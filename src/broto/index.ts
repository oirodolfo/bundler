/**
 * @tool Broto
 * @global Broto
 * @package broto
 * @tags reactive signals scheduler resources browser
 * @description Small reactive runtime extracted from Fábrica.
 *
 * @remarks
 * Broto owns state and reactivity so Fábrica can focus on HTML/UI.
 * It provides signals, computed values, effects, batching, stores, graph helpers,
 * scheduler configuration and async resources.
 *
 * @example Signals and effects
 * ```ts
 * const count = signal(0);
 * const doubled = computed(() => count() * 2);
 * const stop = effect(() => console.log(doubled()));
 * count.set(2);
 * stop();
 * ```
 *
 * @example Store and resource
 * ```ts
 * const user = store({ name: "Rod" });
 * user.name.set("Rodolfo");
 *
 * const profile = resource(() => fetch("/me").then((r) => r.json()));
 * profile.reload();
 * ```
 */
export type {
  BrotoDebugSnapshot,
  Cleanup,
  CleanupRegistrar,
  EffectOptions,
  EffectRunner,
  GraphEdge,
  ReactiveExpression,
  Resource,
  ResourceState,
  ResourceLoader,
  SchedulerMode,
  SchedulerPriority,
  ContextToken,
  Owner,
  OwnerOptions,
  Signal,
  SignalOptions,
} from "./types";

export { debug, setDebug } from "./debug";
export { batch, computed, configureScheduler, effect, flushSync, hasReactiveValue, memo, onCleanup, readReactiveValue, scheduleTask, signal, untrack } from "./reactivity";
export { cleanupOwner, createContext, createOwner, createRoot, disposeOwner, getOwner, handleOwnerError, inspectOwnerGraph, onOwnerCleanup, onOwnerError, provide, runWithOwner, useContext } from "./owner";
export { graph, Graph } from "./graph";
export { resource } from "./resources";
export { store, type Store } from "./store";

import * as BrotoApi from "./public-api";
export default BrotoApi;
