import type { DebugSnapshot } from "./types";

/**
 * Mutable debug counters for the runtime.
 *
 * @remarks
 * The runtime increments these counters in hot paths, so this object stays flat
 * and tiny. Consumers only receive frozen snapshots through `debug()`.
 */
export const debugState: DebugSnapshot = {
  enabled: false,
  templates: 0,
  parts: 0,
  effects: 0,
  flushes: 0,
  updates: 0,
  components: 0,
  delegatedEvents: 0,
  reconciliations: 0,
  virtualWindows: 0,
};

/**
 * Enables or disables debug mode.
 *
 * @param enabled - Whether debug mode should be enabled.
 *
 * @example
 * ```ts
 * setDebug(true);
 * console.table(debug());
 * ```
 */
export function setDebug(enabled: boolean): void {
  debugState.enabled = Boolean(enabled);
}

/**
 * Returns a frozen debug snapshot.
 *
 * @returns Current debug counters.
 *
 * @example
 * ```ts
 * const snapshot = debug();
 * console.log(snapshot.templates);
 * ```
 */
export function debug(): Readonly<DebugSnapshot> {
  return Object.freeze({ ...debugState });
}
