import { debugState } from "./debug";
import type { Cleanup, CleanupRegistrar, EffectOptions, EffectRunner, Signal } from "./types";

/** Queued async effects waiting for the next microtask flush. */
const effectQueue = new Set<EffectRunner>();

let activeEffect: EffectRunner | null = null;
let trackingEnabled = true;
let flushQueued = false;
let batchDepth = 0;

/**
 * Creates a fine-grained writable signal.
 *
 * @remarks
 * This replaces object-style `{ value }` signals because callable signals are
 * faster to read and harder to confuse with plain values. `set()` stores exactly
 * what you pass, including functions. Use `update()` when you want updater
 * semantics.
 *
 * @param initialValue - Initial signal value.
 * @returns Signal reader with mutation helpers.
 *
 * @example Basic counter
 * ```ts
 * const count = signal(0);
 * count.set(1);
 * count.update((current) => current + 1);
 * console.log(count());
 * // 2
 * ```
 */
export function signal<Value>(initialValue: Value): Signal<Value> {
  let value = initialValue;
  const subscribers = new Set<EffectRunner>();

  function read(): Value {
    if (activeEffect && trackingEnabled && !subscribers.has(activeEffect)) {
      subscribers.add(activeEffect);
      activeEffect.deps.push(subscribers);
    }

    return value;
  }

  read.set = (nextValue: Value): void => {
    if (Object.is(value, nextValue)) {
      return;
    }

    value = nextValue;

    for (const subscriber of Array.from(subscribers)) {
      scheduleEffect(subscriber);
    }
  };

  read.update = (updater: (currentValue: Value) => Value): void => {
    if (typeof updater !== "function") {
      throw new TypeError("signal.update() expects a function updater.");
    }

    read.set(updater(value));
  };

  read.peek = (): Value => value;

  read.subscribe = (listener: EffectRunner): Cleanup => {
    subscribers.add(listener);

    return () => {
      subscribers.delete(listener);
    };
  };

  return read as Signal<Value>;
}

/**
 * Registers cleanup inside the currently running effect.
 *
 * @param cleanup - Cleanup callback.
 *
 * @example Interval cleanup
 * ```ts
 * effect((onCleanup) => {
 *   const timer = window.setInterval(() => console.log("tick"), 1000);
 *   onCleanup(() => window.clearInterval(timer));
 * });
 * ```
 */
export function onCleanup(cleanup: Cleanup): void {
  if (!activeEffect || typeof cleanup !== "function") {
    return;
  }

  activeEffect.cleanups.push(cleanup);
}

/**
 * Runs a tracked effect and returns a disposer.
 *
 * @remarks
 * Each execution removes old dependencies before tracking new ones. This avoids
 * stale subscriptions when branches change, which is one of the easiest ways for
 * tiny reactive libraries to leak memory.
 *
 * @param callback - Reactive callback.
 * @param options - Effect options.
 * @returns Dispose callback.
 *
 * @example Dispose manually
 * ```ts
 * const stop = effect(() => {
 *   console.log(count());
 * });
 * stop();
 * ```
 */
export function effect(callback: (cleanup: CleanupRegistrar) => void, options: EffectOptions = {}): Cleanup {
  const runner = function runEffect(): void {
    if (runner.disposed) {
      return;
    }

    cleanupEffect(runner);

    const previousEffect = activeEffect;
    activeEffect = runner;

    try {
      callback(onCleanup);
    } finally {
      activeEffect = previousEffect;
    }
  } as EffectRunner;

  runner.deps = [];
  runner.cleanups = [];
  runner.disposed = false;
  runner.sync = Boolean(options.sync);

  debugState.effects += 1;
  runner();

  return () => {
    runner.disposed = true;
    cleanupEffect(runner);
  };
}

/**
 * Creates a derived signal.
 *
 * @param getter - Getter that may read signals.
 * @returns Derived signal.
 *
 * @example Derived label
 * ```ts
 * const label = computed(() => `Count: ${count()}`);
 * ```
 */
export function computed<Value>(getter: () => Value): Signal<Value> {
  const output = signal<Value>(undefined as Value);

  effect(() => {
    output.set(getter());
  });

  return output;
}

/**
 * Alias for `computed()`.
 *
 * @param getter - Getter that may read signals.
 * @returns Derived signal.
 *
 * @example Memo value
 * ```ts
 * const expensiveLabel = memo(() => calculateLabel(source()));
 * ```
 */
export function memo<Value>(getter: () => Value): Signal<Value> {
  return computed(getter);
}

/**
 * Runs a callback without dependency tracking.
 *
 * @param callback - Callback to run outside dependency tracking.
 * @returns Callback result.
 *
 * @example Snapshot read
 * ```ts
 * const raw = untrack(() => count());
 * ```
 */
export function untrack<Value>(callback: () => Value): Value {
  const previousTracking = trackingEnabled;
  trackingEnabled = false;

  try {
    return callback();
  } finally {
    trackingEnabled = previousTracking;
  }
}

/**
 * Batches multiple writes into a single microtask flush.
 *
 * @param callback - Batch callback.
 * @returns Callback result.
 *
 * @example One flush for many writes
 * ```ts
 * batch(() => {
 *   firstName.set("Rod");
 *   lastName.set("Dev");
 * });
 * ```
 */
export function batch<Value>(callback: () => Value): Value {
  batchDepth += 1;

  try {
    return callback();
  } finally {
    batchDepth -= 1;

    if (batchDepth === 0 && effectQueue.size > 0) {
      queueFlush();
    }
  }
}

/**
 * Resolves a value as a signal/function/plain value.
 *
 * @param value - Input value.
 * @returns Resolved value.
 */
export function readReactiveValue(value: unknown): unknown {
  if (typeof value === "function" && isSignalLike(value)) {
    return (value as Signal<unknown>)();
  }

  if (typeof value === "function") {
    return (value as () => unknown)();
  }

  return value;
}

/**
 * Checks whether a value has reactive behavior.
 *
 * @param value - Input value.
 * @returns Whether the value is a signal or expression.
 */
export function hasReactiveValue(value: unknown): boolean {
  return typeof value === "function";
}

/**
 * Cleans old effect dependencies and user cleanups.
 *
 * @param runner - Effect runner.
 */
function cleanupEffect(runner: EffectRunner): void {
  const cleanups = runner.cleanups;

  for (let index = 0; index < cleanups.length; index += 1) {
    cleanups[index]?.();
  }

  cleanups.length = 0;

  const deps = runner.deps;

  for (let index = 0; index < deps.length; index += 1) {
    deps[index]?.delete(runner);
  }

  deps.length = 0;
}

/**
 * Schedules or immediately runs an effect.
 *
 * @param runner - Effect runner.
 */
function scheduleEffect(runner: EffectRunner): void {
  if (runner.disposed) {
    return;
  }

  if (runner.sync) {
    runner();
    return;
  }

  effectQueue.add(runner);

  if (batchDepth === 0) {
    queueFlush();
  }
}

/** Queues a single microtask flush. */
function queueFlush(): void {
  if (flushQueued) {
    return;
  }

  flushQueued = true;
  queueMicrotask(flushEffects);
}

/** Flushes queued effects. */
function flushEffects(): void {
  flushQueued = false;
  debugState.flushes += 1;

  for (const runner of Array.from(effectQueue)) {
    effectQueue.delete(runner);
    runner();
  }

  if (effectQueue.size > 0 && batchDepth === 0) {
    queueFlush();
  }
}

/**
 * Lightweight local signal check to avoid a circular import from guards.
 *
 * @param value - Candidate function.
 * @returns Whether the value looks like a signal.
 */
function isSignalLike(value: unknown): boolean {
  return (
    typeof value === "function" &&
    typeof (value as Partial<Signal<unknown>>).set === "function" &&
    typeof (value as Partial<Signal<unknown>>).update === "function" &&
    typeof (value as Partial<Signal<unknown>>).peek === "function"
  );
}
