import { debugState } from "./debug";
import type { Cleanup, CleanupRegistrar, EffectOptions, EffectRunner, Signal, SignalOptions, SchedulerMode } from "./types";

/** Queued async effects waiting for the next scheduler flush. */
const effectQueue = new Set<EffectRunner>();

const DEFAULT_MAX_FLUSH_ITERATIONS = 1_000;

let activeEffect: EffectRunner | null = null;
let trackingEnabled = true;
let flushQueued = false;
let batchDepth = 0;
let schedulerMode: SchedulerMode = "microtask";
let maxFlushIterations = DEFAULT_MAX_FLUSH_ITERATIONS;

/**
 * Configures the global reactive scheduler.
 *
 * @param options - Scheduler options.
 * @returns void.
 *
 * @example Use animation-frame scheduling for heavy UI work
 * ```ts
 * configureScheduler({ mode: "raf", maxFlushIterations: 500 });
 * ```
 */
export function configureScheduler(options: { mode?: SchedulerMode; maxFlushIterations?: number } = {}): void {
  if (options.mode) {
    schedulerMode = options.mode;
  }

  if (typeof options.maxFlushIterations === "number" && Number.isFinite(options.maxFlushIterations)) {
    maxFlushIterations = Math.max(1, Math.floor(options.maxFlushIterations));
  }
}

/**
 * Creates a fine-grained writable signal.
 *
 * @remarks
 * Callable signals keep reads cheap, and custom equality lets callers avoid
 * unnecessary updates for structural values. Pass `{ equals: false }` to always
 * notify subscribers, useful for mutable objects owned outside Fabrica.
 *
 * @param initialValue - Initial signal value.
 * @param options - Optional equality behavior.
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
 *
 * @example Always notify for externally mutated state
 * ```ts
 * const state = signal({ open: false }, { equals: false });
 * state.peek().open = true;
 * state.set(state.peek());
 * ```
 */
export function signal<Value>(initialValue: Value, options: SignalOptions<Value> = {}): Signal<Value> {
  let value = initialValue;
  const subscribers = new Set<EffectRunner>();
  const equals = options.equals ?? Object.is;

  function didNotChange(previousValue: Value, nextValue: Value): boolean {
    if (equals === false) {
      return false;
    }

    return equals(previousValue, nextValue);
  }

  function read(): Value {
    if (activeEffect && trackingEnabled && !subscribers.has(activeEffect)) {
      subscribers.add(activeEffect);
      activeEffect.deps.push(subscribers);
    }

    return value;
  }

  read.set = (nextValue: Value): void => {
    if (didNotChange(value, nextValue)) {
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
 * @returns void.
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
 * @param options - Optional equality behavior.
 * @returns Derived signal.
 *
 * @example Derived label
 * ```ts
 * const label = computed(() => `Count: ${count()}`);
 * ```
 */
export function computed<Value>(getter: () => Value, options: SignalOptions<Value> = {}): Signal<Value> {
  const output = signal<Value>(undefined as Value, options);

  effect(() => {
    output.set(getter());
  });

  return output;
}

/**
 * Alias for `computed()`.
 *
 * @param getter - Getter that may read signals.
 * @param options - Optional equality behavior.
 * @returns Derived signal.
 *
 * @example Memo value
 * ```ts
 * const expensiveLabel = memo(() => calculateLabel(source()));
 * ```
 */
export function memo<Value>(getter: () => Value, options: SignalOptions<Value> = {}): Signal<Value> {
  return computed(getter, options);
}

/**
 * Runs a callback without dependency tracking.
 *
 * @param callback - Callback to run outside dependency tracking.
 * @returns Callback result.
 *
 * @example Read without subscribing
 * ```ts
 * const current = untrack(() => count());
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
 * Batches signal writes into one scheduled flush.
 *
 * @param callback - Callback that may write signals.
 * @returns Callback result.
 *
 * @example Batch two writes
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
 * @returns void.
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
 * @returns void.
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

/** Queues one scheduler flush. */
function queueFlush(): void {
  if (flushQueued) {
    return;
  }

  flushQueued = true;

  if (schedulerMode === "raf") {
    requestAnimationFrame(flushEffects);
    return;
  }

  if (schedulerMode === "idle" && "requestIdleCallback" in globalThis) {
    (globalThis as typeof globalThis & { requestIdleCallback(callback: () => void): number }).requestIdleCallback(flushEffects);
    return;
  }

  queueMicrotask(flushEffects);
}

/** Flushes queued effects with a recursion guard. */
function flushEffects(): void {
  flushQueued = false;
  debugState.flushes += 1;

  let iterations = 0;

  while (effectQueue.size > 0) {
    if (iterations >= maxFlushIterations) {
      effectQueue.clear();
      throw new Error(`[Fabrica] Effect flush exceeded ${maxFlushIterations} iterations. Check for a signal write loop inside an effect.`);
    }

    iterations += 1;
    const queued = Array.from(effectQueue);
    effectQueue.clear();

    for (let index = 0; index < queued.length; index += 1) {
      queued[index]?.();
    }

    if (batchDepth > 0) {
      break;
    }
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
