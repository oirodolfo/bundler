/**
 * Shared types for Broto, the reactive runtime used by Fábrica.
 *
 * @remarks
 * Broto owns dependency tracking, scheduling, writable signals, computed
 * values, effects, batching, stores, async resources and small graph helpers.
 * Keeping these types outside Fábrica lets the DOM renderer stay focused on
 * HTML/UI while other packages can reuse the same reactive primitives.
 */

/** Runs when an effect, resource or owner is disposed. */
export type Cleanup = () => void;

/** Owner options used by createRoot/createOwner. */
export type OwnerOptions = {
  id?: string;
  name?: string;
  parent?: Owner | null;
  onError?: OwnerErrorHandler;
};

/** Context token used by Broto owner trees. */
export type ContextToken<Value> = {
  readonly id: symbol;
  readonly description: string;
  readonly defaultValue?: Value;
};

/** Lifecycle owner used for effects, resources and UI component boundaries. */
export type OwnerErrorHandler = (error: unknown, owner: Owner) => void | boolean;

export type Owner = {
  id: string;
  name?: string;
  parent: Owner | null;
  children: Set<Owner>;
  cleanups: Cleanup[];
  context: Map<ContextToken<unknown>, unknown>;
  errorHandlers: OwnerErrorHandler[];
  disposed: boolean;
};

/** Registers a cleanup callback in the currently running effect. */
export type CleanupRegistrar = (cleanup: Cleanup) => void;

/** A lazily evaluated value that may read signals. */
export type ReactiveExpression<Value> = () => Value;

/** Custom equality behavior for writable and derived signals. */
export type SignalOptions<Value> = {
  /** Pass false to always notify subscribers. */
  equals?: false | ((previousValue: Value, nextValue: Value) => boolean);
};

/** Reactive scheduler mode used by the fine-grained effect queue. */
export type SchedulerMode = "microtask" | "raf" | "idle" | "sync";

/** Priority used by scheduleTask(). */
export type SchedulerPriority = "user-blocking" | "normal" | "background";

/** Writable fine-grained signal. */
export type Signal<Value> = (() => Value) & {
  /** Stores a new value and notifies subscribers when it changed. */
  set(nextValue: Value): void;
  /** Updates the value from the current value. */
  update(updater: (currentValue: Value) => Value): void;
  /** Reads the value without tracking the current effect. */
  peek(): Value;
  /** Subscribes an effect runner directly. Mostly used internally. */
  subscribe(listener: EffectRunner): Cleanup;
};

/** Internal tracked effect runner. */
export type EffectRunner = (() => void) & {
  deps: Array<Set<EffectRunner>>;
  cleanups: Cleanup[];
  disposed: boolean;
  sync: boolean;
  owner: Owner;
};

/** Effect options. */
export type EffectOptions = {
  sync?: boolean;
  name?: string;
};

/** Snapshot of Broto runtime counters. */
export type BrotoDebugSnapshot = {
  enabled: boolean;
  signals: number;
  effects: number;
  computed: number;
  stores: number;
  resources: number;
  flushes: number;
  updates: number;
};

/** Async resource state. */
export type ResourceState<Value, ErrorValue = unknown> = {
  loading: boolean;
  value: Value | undefined;
  error: ErrorValue | undefined;
  stale?: boolean;
};

/** Async resource controls. */
export type ResourceLoader<Value, Source = void> = (signal: AbortSignal, source: Source) => Promise<Value>;

export type ResourceOptions<Source = void> = {
  source?: Source | Signal<Source> | (() => Source);
  immediate?: boolean;
  cacheKey?: string | ((source: Source) => string);
  timeoutMs?: number;
  retries?: number;
};

/** Async resource controls. */
export type Resource<Value, ErrorValue = unknown> = Signal<ResourceState<Value, ErrorValue>> & {
  reload(): Promise<Value | undefined>;
  abort(reason?: unknown): void;
};

/** Small graph edge used by debugging/devtools. */
export type GraphEdge = {
  from: string;
  to: string;
  label?: string;
};
