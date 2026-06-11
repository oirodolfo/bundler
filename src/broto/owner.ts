import type { Cleanup, ContextToken, Owner, OwnerErrorHandler, OwnerOptions } from "./types";

let ownerId = 0;
let activeOwner: Owner | null = null;

/**
 * Gets the currently active owner.
 *
 * @remarks
 * Owners are Broto's lifecycle boundaries. Effects, resources and Fabrica
 * components register cleanup, context and error handlers against the active
 * owner, so disposal follows a deterministic tree instead of ad-hoc arrays.
 *
 * @returns The active owner, or null when no owner is running.
 *
 * @example
 * ```ts
 * const owner = getOwner();
 * console.log(owner?.name);
 * ```
 */
export function getOwner(): Owner | null {
  return activeOwner;
}

/**
 * Runs a callback with a temporary active owner.
 *
 * @param owner - Owner to activate.
 * @param callback - Work to run inside the owner.
 * @returns Callback result.
 *
 * @example
 * ```ts
 * runWithOwner(owner, () => {
 *   effect(() => console.log(count()));
 * });
 * ```
 */
export function runWithOwner<Value>(owner: Owner | null, callback: () => Value): Value {
  const previousOwner = activeOwner;
  activeOwner = owner;

  try {
    return callback();
  } finally {
    activeOwner = previousOwner;
  }
}

/**
 * Creates an owner under the active owner or an explicit parent.
 *
 * @param options - Owner options.
 * @returns New owner.
 *
 * @example
 * ```ts
 * const owner = createOwner({ name: "Panel" });
 * runWithOwner(owner, () => onOwnerCleanup(() => console.log("disposed")));
 * disposeOwner(owner);
 * ```
 */
export function createOwner(options: OwnerOptions = {}): Owner {
  const parent = options.parent === undefined ? activeOwner : options.parent;
  const owner: Owner = {
    id: options.id ?? `broto-${++ownerId}`,
    name: options.name,
    parent,
    children: new Set<Owner>(),
    cleanups: [],
    context: new Map<ContextToken<unknown>, unknown>(),
    errorHandlers: options.onError ? [options.onError] : [],
    disposed: false,
  };

  if (parent && !parent.disposed) {
    parent.children.add(owner);
  }

  return owner;
}

/**
 * Creates a root owner, runs setup inside it and returns the setup value plus a disposer.
 *
 * @param callback - Root setup callback.
 * @param options - Optional owner metadata.
 * @returns Callback value and dispose callback.
 *
 * @example Component-like root
 * ```ts
 * const [view, dispose] = createRoot(() => html`<p>Hello</p>`, { name: "View" });
 * dispose();
 * ```
 */
export function createRoot<Value>(callback: (dispose: Cleanup, owner: Owner) => Value, options: OwnerOptions = {}): [Value, Cleanup] {
  const owner = createOwner({ ...options, parent: options.parent ?? null });
  const dispose = () => disposeOwner(owner);
  const value = runWithOwner(owner, () => callback(dispose, owner));
  return [value, dispose];
}

/**
 * Registers cleanup in the active owner.
 *
 * @param cleanup - Cleanup callback.
 * @returns The same cleanup for convenient composition.
 *
 * @example
 * ```ts
 * onOwnerCleanup(() => socket.close());
 * ```
 */
export function onOwnerCleanup(cleanup: Cleanup): Cleanup {
  if (typeof cleanup !== "function") {
    return cleanup;
  }

  if (activeOwner && !activeOwner.disposed) {
    activeOwner.cleanups.push(cleanup);
  }

  return cleanup;
}

/**
 * Registers an error handler on the active owner.
 *
 * @remarks
 * Error handlers are walked from the throwing owner up to the root. Returning
 * `true` marks the error as handled. This powers Fabrica error boundaries and
 * keeps async resources/events/effects from becoming orphaned browser errors.
 *
 * @param handler - Error handler.
 * @returns Cleanup that removes the handler.
 *
 * @example
 * ```ts
 * const stop = onOwnerError((error) => {
 *   console.error(error);
 *   return true;
 * });
 * stop();
 * ```
 */
export function onOwnerError(handler: OwnerErrorHandler): Cleanup {
  if (!activeOwner || activeOwner.disposed) {
    return () => {};
  }

  const owner = activeOwner;
  owner.errorHandlers.push(handler);

  return () => {
    const index = owner.errorHandlers.indexOf(handler);
    if (index >= 0) {
      owner.errorHandlers.splice(index, 1);
    }
  };
}

/**
 * Propagates an error through the owner tree.
 *
 * @param error - Error value.
 * @param origin - Owner where the error happened. Defaults to active owner.
 * @returns Whether an owner handled the error.
 *
 * @example
 * ```ts
 * if (!handleOwnerError(error)) throw error;
 * ```
 */
export function handleOwnerError(error: unknown, origin: Owner | null = activeOwner): boolean {
  let owner = origin;

  while (owner) {
    for (let index = owner.errorHandlers.length - 1; index >= 0; index -= 1) {
      try {
        const handled = owner.errorHandlers[index]?.(error, owner);
        if (handled === true) {
          return true;
        }
      } catch (handlerError) {
        error = handlerError;
      }
    }

    owner = owner.parent;
  }

  return false;
}

/**
 * Runs and clears an owner's child graph and cleanup stack without marking it disposed.
 *
 * @param owner - Owner to clean.
 * @returns void.
 */
export function cleanupOwner(owner: Owner): void {
  for (const child of Array.from(owner.children)) {
    disposeOwner(child);
  }

  owner.children.clear();

  const cleanups = owner.cleanups.splice(0);
  for (let index = cleanups.length - 1; index >= 0; index -= 1) {
    runCleanup(cleanups[index], owner);
  }
}

/**
 * Disposes an owner and its full subtree.
 *
 * @param owner - Owner to dispose.
 * @returns void.
 */
export function disposeOwner(owner: Owner): void {
  if (owner.disposed) {
    return;
  }

  cleanupOwner(owner);
  owner.disposed = true;
  owner.parent?.children.delete(owner);
}

/**
 * Creates a context token.
 *
 * @param defaultValue - Optional fallback value.
 * @param description - Debug-friendly name.
 * @returns Context token.
 *
 * @example
 * ```ts
 * const ThemeContext = createContext("dark", "Theme");
 * ```
 */
export function createContext<Value>(defaultValue?: Value, description = "BrotoContext"): ContextToken<Value> {
  return {
    id: Symbol(description),
    description,
    defaultValue,
  };
}

/**
 * Provides a context value in the active owner.
 *
 * @param context - Context token.
 * @param value - Value to provide.
 * @returns Provided value.
 */
export function provide<Value>(context: ContextToken<Value>, value: Value): Value {
  if (!activeOwner) {
    throw new Error(`[Broto] provide(${context.description}) was called without an active owner.`);
  }

  activeOwner.context.set(context as ContextToken<unknown>, value);
  return value;
}

/**
 * Reads the nearest context value from the owner tree.
 *
 * @param context - Context token.
 * @returns Nearest provided value or token default.
 */
export function useContext<Value>(context: ContextToken<Value>): Value {
  let owner = activeOwner;

  while (owner) {
    if (owner.context.has(context as ContextToken<unknown>)) {
      return owner.context.get(context as ContextToken<unknown>) as Value;
    }

    owner = owner.parent;
  }

  return context.defaultValue as Value;
}

/**
 * Returns a serializable owner graph snapshot for devtools/debug panels.
 *
 * @param root - Root owner. Defaults to active owner.
 * @returns Owner graph object.
 */
export function inspectOwnerGraph(root: Owner | null = activeOwner): unknown {
  if (!root) {
    return null;
  }

  return {
    id: root.id,
    name: root.name,
    disposed: root.disposed,
    cleanups: root.cleanups.length,
    context: root.context.size,
    errorHandlers: root.errorHandlers.length,
    children: Array.from(root.children, (child) => inspectOwnerGraph(child)),
  };
}

function runCleanup(cleanup: Cleanup | undefined, owner: Owner): void {
  if (!cleanup) {
    return;
  }

  try {
    cleanup();
  } catch (error) {
    if (!handleOwnerError(error, owner)) {
      queueMicrotask(() => {
        throw error;
      });
    }
  }
}
