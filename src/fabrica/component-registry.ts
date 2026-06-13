import type { Component } from "./types";

/** Component names accepted by Fabrica's micro-JSX compiler. */
const COMPONENT_NAME_RE = /^[A-Z][A-Za-z0-9_$.-]*$/;

/** Global component registry used by `html.jsx` and `<f-component name="...">`. */
const componentRegistry = new Map<string, Component<Record<string, unknown>>>();

/**
 * Normalizes a component registry name without changing user intent.
 *
 * @param name - Raw component name.
 * @returns Trimmed name.
 *
 * @example input
 * ```ts
 * normalizeComponentName("  Dock  ")
 * ```
 *
 * @example output
 * ```ts
 * "Dock"
 * ```
 */
export function normalizeComponentName(name: string): string {
  return String(name || "").trim();
}

/**
 * Returns whether a string can be used as a micro-JSX component tag.
 *
 * @param name - Possible component name.
 * @returns Whether the name starts with an uppercase letter.
 *
 * @example input
 * ```ts
 * isRegisteredComponentName("Dock")
 * ```
 *
 * @example output
 * ```ts
 * true
 * ```
 */
export function isRegisteredComponentName(name: string): boolean {
  return COMPONENT_NAME_RE.test(normalizeComponentName(name));
}

/**
 * Registers a component for string-based micro-JSX rendering.
 *
 * @remarks
 * `component(fn)` calls this automatically using `fn.name`. You can call it
 * manually when minification changes names or when you want aliases.
 *
 * @param name - Public component name used in `<Name />` or `<f-component name="Name">`.
 * @param component - Fabrica component function.
 * @returns The same component for chaining.
 *
 * @example input
 * ```ts
 * const Dock = component(function Dock() {
 *   return html`<button>Open</button>`;
 * });
 *
 * html.jsx`<Dock />`
 * ```
 *
 * @example output
 * ```html
 * <button>Open</button>
 * ```
 */
export function registerComponent<Props extends object>(name: string, component: Component<Props>): Component<Props> {
  const normalized = normalizeComponentName(name);

  if (!normalized) {
    throw new Error("[Fabrica] registerComponent() needs a non-empty name.");
  }

  componentRegistry.set(normalized, component as unknown as Component<Record<string, unknown>>);

  return component;
}

/**
 * Removes a component from the micro-JSX registry.
 *
 * @param name - Component name.
 * @returns Whether a component was removed.
 *
 * @example input
 * ```ts
 * unregisterComponent("Dock")
 * ```
 *
 * @example output
 * ```ts
 * true
 * ```
 */
export function unregisterComponent(name: string): boolean {
  return componentRegistry.delete(normalizeComponentName(name));
}

/**
 * Resolves a component by registry name.
 *
 * @param name - Component name.
 * @returns Component or undefined.
 *
 * @example input
 * ```ts
 * resolveComponent("Dock")
 * ```
 */
export function resolveComponent(name: string): Component<Record<string, unknown>> | undefined {
  return componentRegistry.get(normalizeComponentName(name));
}

/**
 * Returns a readonly snapshot of registered components.
 *
 * @returns Component registry snapshot.
 *
 * @example input
 * ```ts
 * Array.from(listComponents().keys())
 * ```
 *
 * @example output
 * ```ts
 * ["Dock", "Panel"]
 * ```
 */
export function listComponents(): ReadonlyMap<string, Component<Record<string, unknown>>> {
  return new Map(componentRegistry);
}

/**
 * Clears the component registry. Mostly useful for tests and hot-reload.
 *
 * @returns Nothing.
 *
 * @example input
 * ```ts
 * clearComponents()
 * ```
 */
export function clearComponents(): void {
  componentRegistry.clear();
}
