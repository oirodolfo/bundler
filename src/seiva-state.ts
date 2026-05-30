/**
 * Seiva v1.
 *
 * A tiny reactive state library with:
 *
 * - Writable cells.
 * - Derived views.
 * - DOM reflection.
 * - Batched stories.
 * - Cause tracking.
 * - Patch timeline.
 * - Verb-style mutations.
 *
 * @example Basic counter
 * ```ts
 * const app = world({
 *   count: 0,
 * });
 *
 * app.count.add(1);
 * console.log(app.count.value);
 * // 1
 * ```
 *
 * @example Watch a cell
 * ```ts
 * const count = cell(0);
 *
 * const stop = count.watch((value, previous, patch) => {
 *   console.log({ value, previous, cause: patch.cause });
 * });
 *
 * count.add(1).because("user-clicked-plus");
 * stop();
 * ```
 *
 * @example DOM reflection
 * ```ts
 * const app = world({
 *   count: 0,
 * });
 *
 * const button = document.createElement("button");
 * const label = document.createTextNode("");
 *
 * button.textContent = "+";
 * button.onclick = () => app.count.add(1).because("button-click");
 *
 * app.count.reflect(label);
 * document.body.append(button, label);
 * ```
 *
 * @example Two-way input reflection
 * ```ts
 * const app = world({
 *   name: "Rod",
 * });
 *
 * const input = document.createElement("input");
 * app.name.reflect({
 *   node: input,
 *   property: "value",
 * });
 *
 * document.body.append(input);
 * ```
 *
 * @example Derived view
 * ```ts
 * const app = world({
 *   count: 1,
 * });
 *
 * const doubled = app.count.view((count) => count * 2);
 *
 * console.log(doubled.value);
 * // 2
 *
 * app.count.add(2);
 *
 * console.log(doubled.value);
 * // 6
 * ```
 *
 * @example Nested object lens
 * ```ts
 * const app = world({
 *   user: {
 *     name: "Rod",
 *     active: true,
 *   },
 * });
 *
 * app.user.pick("name").become("Rodolfo");
 * app.user.pick("active").flip();
 * ```
 *
 * @example Array lens
 * ```ts
 * const app = world({
 *   todos: [
 *     { text: "Create Seiva", done: false },
 *   ],
 * });
 *
 * app.todos.at(0).pick("done").flip();
 * ```
 *
 * @example Story batching
 * ```ts
 * const app = world({
 *   count: 0,
 *   name: "Rod",
 * });
 *
 * app.story("profile-update", () => {
 *   app.count.add(1);
 *   app.name.become("Rodolfo");
 * });
 *
 * console.log(app.timeline.patches.map((patch) => patch.cause));
 * // ["profile-update", "profile-update"]
 * ```
 * -----------
 * Seiva v1.
 *
 * A tiny reactive state library with writable cells, derived views, DOM reflection,
 * batched stories, cause tracking, patch timeline, and verb-style mutations.
 *
 * @example Basic counter
 * ```ts
 * import Seiva from "./seiva-state";
 *
 * const app = Seiva.world({
 *   count: 0,
 * });
 *
 * app.count.add(1);
 *
 * console.log(app.count.value);
 * // 1
 * ```
 */

type Dispose = () => void;
type Reader<T> = () => T;
type Writer<T> = (value: T) => void;
type Watcher<T> = (value: T, previous: T, patch: Patch) => void;
type AnyRecord = Record<PropertyKey, unknown>;
type ReadableCell<T> = Cell<T> | ViewCell<T>;

const EMPTY_TEXT = "";
const DEFAULT_CAUSE = "manual";
const DEFAULT_INPUT_EVENT = "input";

let activeEffect: ReactiveEffect | null = null;
let activeCause: string | null = null;
let batchDepth = 0;

const pendingEffects = new Set<ReactiveEffect>();

/**
 * Describes one state mutation.
 *
 * @example
 * ```ts
 * const app = world({ count: 0 });
 *
 * app.count.because("click").add(1);
 *
 * console.log(app.timeline.patches[0]?.cause);
 * // "click"
 * ```
 */
export interface Patch {
  readonly cause: string;
  readonly path: readonly PropertyKey[];
  readonly previous: unknown;
  readonly next: unknown;
  readonly time: number;
}

/**
 * Stores all emitted patches for a world.
 *
 * @example
 * ```ts
 * const app = world({ count: 0 });
 *
 * app.count.add(1);
 * app.timeline.clear();
 *
 * console.log(app.timeline.patches.length);
 * // 0
 * ```
 */
export interface Timeline {
  readonly patches: readonly Patch[];

  /**
   * Clears all recorded patches.
   *
   * @returns Nothing.
   */
  clear(): void;
}

/**
 * A writable reactive value.
 *
 * @example
 * ```ts
 * const count = cell(0);
 *
 * count.add(1).subtract(1).become(10);
 *
 * console.log(count.value);
 * // 10
 * ```
 */
export interface Cell<T> {
  value: T;
  readonly path: readonly PropertyKey[];

  /**
   * Reads the current value.
   *
   * @returns The current cell value.
   *
   * @example
   * ```ts
   * const name = cell("Rod");
   *
   * console.log(name.get());
   * // "Rod"
   * ```
   */
  get(): T;

  /**
   * Replaces the current value.
   *
   * @param next - The next value.
   * @returns The same cell for fluent chaining.
   *
   * @example
   * ```ts
   * const name = cell("Rod");
   *
   * name.become("Rodolfo");
   * ```
   */
  become(next: T): this;

  /**
   * Updates the value using the previous value.
   *
   * @param mutator - Function that receives the current value and returns the next one.
   * @returns The same cell for fluent chaining.
   *
   * @example
   * ```ts
   * const count = cell(1);
   *
   * count.update((value) => value * 10);
   * ```
   */
  update(mutator: (value: T) => T): this;

  /**
   * Subscribes to direct changes.
   *
   * @param watcher - Function called whenever the value changes.
   * @returns A disposer that removes the watcher.
   *
   * @example
   * ```ts
   * const count = cell(0);
   *
   * const stop = count.watch((value, previous) => {
   *   console.log(previous, value);
   * });
   *
   * count.add(1);
   * stop();
   * ```
   */
  watch(watcher: Watcher<T>): Dispose;

  /**
   * Creates a derived reactive view.
   *
   * @param reader - Function that maps the current value into another value.
   * @returns A readonly derived cell.
   *
   * @example
   * ```ts
   * const count = cell(2);
   * const label = count.view((value) => `Count: ${value}`);
   * ```
   */
  view<R>(reader: (value: T) => R): ViewCell<R>;

  /**
   * Reflects this cell into a DOM node.
   *
   * @param target - A DOM node or advanced reflection target.
   * @returns A disposer that removes the reflection.
   *
   * @example
   * ```ts
   * const count = cell(0);
   * const node = document.createTextNode("");
   *
   * count.reflect(node);
   * count.add(1);
   * ```
   */
  reflect(target: Node | ReflectTarget<T>): Dispose;

  /**
   * Sets the cause for the next mutation on this cell.
   *
   * @param cause - Human-readable mutation cause.
   * @returns The same cell for fluent chaining.
   *
   * @example
   * ```ts
   * const count = cell(0);
   *
   * count.because("keyboard-shortcut").add(1);
   * ```
   */
  because(cause: string): this;

  /**
   * Adds a numeric amount.
   *
   * @param amount - Amount to add.
   * @returns The same cell for fluent chaining.
   */
  add(amount: number): this;

  /**
   * Subtracts a numeric amount.
   *
   * @param amount - Amount to subtract.
   * @returns The same cell for fluent chaining.
   */
  subtract(amount: number): this;

  /**
   * Flips a boolean value.
   *
   * @returns The same cell for fluent chaining.
   */
  flip(): this;

  /**
   * Appends text to a string value.
   *
   * @param text - Text to append.
   * @returns The same cell for fluent chaining.
   */
  append(text: string): this;

  /**
   * Pushes items into an array cell immutably.
   *
   * @param items - Items to append.
   * @returns The same cell for fluent chaining.
   */
  push(...items: T extends readonly (infer Item)[] ? Item[] : never): this;

  /**
   * Removes array items matching a predicate.
   *
   * @param predicate - Function returning true for items to remove.
   * @returns The same cell for fluent chaining.
   */
  remove(predicate: T extends readonly (infer Item)[] ? (item: Item, index: number) => boolean : never): this;

  /**
   * Creates a writable lens for an array index.
   *
   * @param index - Array index.
   * @returns A writable cell targeting the selected item.
   */
  at(index: number): Cell<T extends readonly (infer Item)[] ? Item : never>;

  /**
   * Creates a writable lens for an object property.
   *
   * @param key - Object property key.
   * @returns A writable cell targeting the selected property.
   */
  pick<K extends keyof T>(key: K): Cell<T[K]>;
}

/**
 * A readonly reactive derived value.
 *
 * @example
 * ```ts
 * const count = cell(2);
 * const doubled = count.view((value) => value * 2);
 *
 * console.log(doubled.value);
 * // 4
 * ```
 */
export interface ViewCell<T> {
  readonly value: T;
  readonly path: readonly PropertyKey[];

  /**
   * Reads the current derived value.
   *
   * @returns The cached derived value.
   */
  get(): T;

  /**
   * Watches derived value changes.
   *
   * @param watcher - Function called whenever the derived value changes.
   * @returns A disposer that removes the watcher.
   */
  watch(watcher: Watcher<T>): Dispose;

  /**
   * Creates another derived view.
   *
   * @param reader - Function mapping the current derived value.
   * @returns A readonly derived cell.
   */
  view<R>(reader: (value: T) => R): ViewCell<R>;

  /**
   * Reflects this derived view into the DOM.
   *
   * @param target - A DOM node or advanced reflection target.
   * @returns A disposer that removes the reflection.
   */
  reflect(target: Node | ReflectTarget<T>): Dispose;
}

/**
 * Advanced DOM reflection target.
 *
 * @example Input value
 * ```ts
 * const name = cell("Rod");
 * const input = document.createElement("input");
 *
 * name.reflect({
 *   node: input,
 *   property: "value",
 * });
 * ```
 *
 * @example Custom input parser
 * ```ts
 * const age = cell(18);
 * const input = document.createElement("input");
 *
 * age.reflect({
 *   node: input,
 *   property: "value",
 *   read(node) {
 *     return Number((node as HTMLInputElement).value);
 *   },
 * });
 * ```
 */
export interface ReflectTarget<T> {
  readonly node: Node;
  readonly property?: keyof Node | string;
  readonly event?: string;
  readonly read?: (node: Node) => T;
  readonly write?: (node: Node, value: T) => void;
}

/**
 * A reactive world created from an object.
 *
 * @example
 * ```ts
 * const app = world({
 *   count: 0,
 *   name: "Rod",
 *   dark: true,
 * });
 *
 * app.count.add(1);
 * app.name.become("Rodolfo");
 * app.dark.flip();
 * ```
 */
export type WorldShape<T extends AnyRecord> = {
  readonly [K in keyof T]: Cell<T[K]>;
} & {
  readonly timeline: Timeline;

  /**
   * Runs multiple updates under the same cause and flushes effects once.
   *
   * @param cause - Human-readable batch cause.
   * @param run - Function containing related updates.
   * @returns The result returned by `run`.
   */
  story<R>(cause: string, run: () => R): R;
};

/**
 * Public Seiva API object.
 */
export interface SeivaApi {
  readonly cell: typeof cell;
  readonly world: typeof world;
  readonly story: typeof story;
  readonly effect: typeof effect;
  readonly text: typeof text;
  readonly reflect: typeof reflect;
}

interface ReactiveSource {
  subscribeEffect(effect: ReactiveEffect): void;
  unsubscribeEffect(effect: ReactiveEffect): void;
}

/**
 * Small dependency-tracking effect.
 */
class ReactiveEffect {
  private readonly dependencies = new Set<ReactiveSource>();

  public constructor(private readonly runEffect: () => void) {}

  public run(): void {
    this.cleanup();

    const previous = activeEffect;
    activeEffect = this;

    try {
      this.runEffect();
    } finally {
      activeEffect = previous;
    }
  }

  public depend(source: ReactiveSource): void {
    this.dependencies.add(source);
  }

  public cleanup(): void {
    for (const dependency of this.dependencies) {
      dependency.unsubscribeEffect(this);
    }

    this.dependencies.clear();
  }
}

/**
 * Mutable implementation of the patch timeline.
 */
class PatchTimeline implements Timeline {
  public readonly patches: Patch[] = [];

  public clear(): void {
    this.patches.length = 0;
  }

  public add(patch: Patch): void {
    this.patches.push(patch);
  }
}

/**
 * Writable root cell implementation.
 */
class WritableCell<T> implements Cell<T>, ReactiveSource {
  private readonly effects = new Set<ReactiveEffect>();
  private readonly watchers = new Set<Watcher<T>>();
  private localCause: string | null = null;

  public constructor(
    private current: T,
    public readonly path: readonly PropertyKey[],
    private readonly timeline: PatchTimeline,
  ) {}

  public get value(): T {
    return this.get();
  }

  public set value(next: T) {
    this.become(next);
  }

  public get(): T {
    if (activeEffect) {
      this.effects.add(activeEffect);
      activeEffect.depend(this);
    }

    return this.current;
  }

  public become(next: T): this {
    const previous = this.current;

    if (Object.is(previous, next)) {
      return this;
    }

    this.current = next;

    const patch = this.createPatch(previous, next);

    this.timeline.add(patch);
    this.emit(next, previous, patch);

    return this;
  }

  public update(mutator: (value: T) => T): this {
    return this.become(mutator(this.current));
  }

  public watch(watcher: Watcher<T>): Dispose {
    this.watchers.add(watcher);

    return () => {
      this.watchers.delete(watcher);
    };
  }

  public view<R>(reader: (value: T) => R): ViewCell<R> {
    return new DerivedCell(() => reader(this.get()), this.path.concat("view"), this.timeline);
  }

  public reflect(target: Node | ReflectTarget<T>): Dispose {
    return reflectCell(this, target);
  }

  public because(cause: string): this {
    this.localCause = cause;
    return this;
  }

  public add(amount: number): this {
    return this.update((value) => (assertNumber(value) + amount) as T);
  }

  public subtract(amount: number): this {
    return this.update((value) => (assertNumber(value) - amount) as T);
  }

  public flip(): this {
    return this.update((value) => !assertBoolean(value) as T);
  }

  public append(text: string): this {
    return this.update((value) => (assertString(value) + text) as T);
  }

  public push(...items: T extends readonly (infer Item)[] ? Item[] : never): this {
    return this.update((value) => {
      const list = assertArray(value);

      return list.concat(items as unknown[]) as T;
    });
  }

  public remove(
    predicate: T extends readonly (infer Item)[] ? (item: Item, index: number) => boolean : never,
  ): this {
    return this.update((value) => {
      const list = assertArray(value);
      const shouldRemove = predicate as (item: unknown, index: number) => boolean;

      return list.filter((item, index) => !shouldRemove(item, index)) as T;
    });
  }

  public at(index: number): Cell<T extends readonly (infer Item)[] ? Item : never> {
    return createArrayIndexLens(this, index, this.timeline);
  }

  public pick<K extends keyof T>(key: K): Cell<T[K]> {
    return createObjectPropertyLens(this, key, this.timeline);
  }

  public subscribeEffect(effect: ReactiveEffect): void {
    this.effects.add(effect);
  }

  public unsubscribeEffect(effect: ReactiveEffect): void {
    this.effects.delete(effect);
  }

  private emit(next: T, previous: T, patch: Patch): void {
    for (const watcher of this.watchers) {
      watcher(next, previous, patch);
    }

    for (const effect of this.effects) {
      scheduleEffect(effect);
    }
  }

  private createPatch(previous: T, next: T): Patch {
    return {
      cause: this.consumeCause(),
      path: this.path,
      previous,
      next,
      time: Date.now(),
    };
  }

  private consumeCause(): string {
    const cause = this.localCause ?? activeCause ?? DEFAULT_CAUSE;

    this.localCause = null;

    return cause;
  }
}

/**
 * Writable cell that proxies reads and writes into another parent value.
 */
class LensCell<T> implements Cell<T>, ReactiveSource {
  private readonly effects = new Set<ReactiveEffect>();
  private readonly watchers = new Set<Watcher<T>>();
  private localCause: string | null = null;

  public constructor(
    private readonly reader: Reader<T>,
    private readonly writer: Writer<T>,
    public readonly path: readonly PropertyKey[],
    private readonly timeline: PatchTimeline,
  ) {}

  public get value(): T {
    return this.get();
  }

  public set value(next: T) {
    this.become(next);
  }

  public get(): T {
    if (activeEffect) {
      this.effects.add(activeEffect);
      activeEffect.depend(this);
    }

    return this.reader();
  }

  public become(next: T): this {
    const previous = this.reader();

    if (Object.is(previous, next)) {
      return this;
    }

    this.writer(next);

    const patch = this.createPatch(previous, next);

    this.timeline.add(patch);
    this.emit(next, previous, patch);

    return this;
  }

  public update(mutator: (value: T) => T): this {
    return this.become(mutator(this.reader()));
  }

  public watch(watcher: Watcher<T>): Dispose {
    this.watchers.add(watcher);

    return () => {
      this.watchers.delete(watcher);
    };
  }

  public view<R>(reader: (value: T) => R): ViewCell<R> {
    return new DerivedCell(() => reader(this.get()), this.path.concat("view"), this.timeline);
  }

  public reflect(target: Node | ReflectTarget<T>): Dispose {
    return reflectCell(this, target);
  }

  public because(cause: string): this {
    this.localCause = cause;
    return this;
  }

  public add(amount: number): this {
    return this.update((value) => (assertNumber(value) + amount) as T);
  }

  public subtract(amount: number): this {
    return this.update((value) => (assertNumber(value) - amount) as T);
  }

  public flip(): this {
    return this.update((value) => !assertBoolean(value) as T);
  }

  public append(text: string): this {
    return this.update((value) => (assertString(value) + text) as T);
  }

  public push(...items: T extends readonly (infer Item)[] ? Item[] : never): this {
    return this.update((value) => assertArray(value).concat(items as unknown[]) as T);
  }

  public remove(
    predicate: T extends readonly (infer Item)[] ? (item: Item, index: number) => boolean : never,
  ): this {
    return this.update((value) => {
      const list = assertArray(value);
      const shouldRemove = predicate as (item: unknown, index: number) => boolean;

      return list.filter((item, index) => !shouldRemove(item, index)) as T;
    });
  }

  public at(index: number): Cell<T extends readonly (infer Item)[] ? Item : never> {
    return createArrayIndexLens(this, index, this.timeline);
  }

  public pick<K extends keyof T>(key: K): Cell<T[K]> {
    return createObjectPropertyLens(this, key, this.timeline);
  }

  public subscribeEffect(effect: ReactiveEffect): void {
    this.effects.add(effect);
  }

  public unsubscribeEffect(effect: ReactiveEffect): void {
    this.effects.delete(effect);
  }

  private emit(next: T, previous: T, patch: Patch): void {
    for (const watcher of this.watchers) {
      watcher(next, previous, patch);
    }

    for (const effect of this.effects) {
      scheduleEffect(effect);
    }
  }

  private createPatch(previous: T, next: T): Patch {
    return {
      cause: this.consumeCause(),
      path: this.path,
      previous,
      next,
      time: Date.now(),
    };
  }

  private consumeCause(): string {
    const cause = this.localCause ?? activeCause ?? DEFAULT_CAUSE;

    this.localCause = null;

    return cause;
  }
}

/**
 * Cached readonly derived cell.
 */
class DerivedCell<T> implements ViewCell<T>, ReactiveSource {
  private readonly effects = new Set<ReactiveEffect>();
  private readonly watchers = new Set<Watcher<T>>();
  private cached!: T;
  private initialized = false;

  public constructor(
    private readonly reader: Reader<T>,
    public readonly path: readonly PropertyKey[],
    private readonly timeline: PatchTimeline,
  ) {
    const reactiveEffect = new ReactiveEffect(() => {
      const previous: T = this.cached;
      const next: T = this.reader();

      if (!this.initialized) {
        this.cached = next;
        this.initialized = true;
        return;
      }

      if (Object.is(previous, next)) {
        return;
      }

      this.cached = next;

      const patch: Patch = {
        cause: activeCause ?? DEFAULT_CAUSE,
        path: this.path,
        previous,
        next,
        time: Date.now(),
      };

      this.timeline.add(patch);

      for (const watcher of this.watchers) {
        watcher(next, previous, patch);
      }

      for (const subscriber of this.effects) {
        scheduleEffect(subscriber);
      }
    });

    reactiveEffect.run();
  }

  public get value(): T {
    return this.get();
  }

  public get(): T {
    if (activeEffect) {
      this.effects.add(activeEffect);
      activeEffect.depend(this);
    }

    return this.cached;
  }

  public watch(watcher: Watcher<T>): Dispose {
    this.watchers.add(watcher);

    return () => {
      this.watchers.delete(watcher);
    };
  }

  public view<R>(reader: (value: T) => R): ViewCell<R> {
    return new DerivedCell(() => reader(this.get()), this.path.concat("view"), this.timeline);
  }

  public reflect(target: Node | ReflectTarget<T>): Dispose {
    return reflectCell(this, target);
  }

  public subscribeEffect(effect: ReactiveEffect): void {
    this.effects.add(effect);
  }

  public unsubscribeEffect(effect: ReactiveEffect): void {
    this.effects.delete(effect);
  }
}

/**
 * Creates a standalone writable cell.
 *
 * @param initial - Initial value.
 * @returns A writable reactive cell.
 *
 * @example Number cell
 * ```ts
 * const count = cell(0);
 *
 * count.add(1);
 * ```
 */
export function cell<T>(initial: T): Cell<T> {
  return new WritableCell(initial, [], new PatchTimeline());
}

/**
 * Creates a reactive world from a plain object.
 *
 * @param initial - Initial object state.
 * @returns A world where each root property is a writable cell.
 *
 * @example
 * ```ts
 * const app = world({
 *   count: 0,
 *   name: "Rod",
 * });
 *
 * app.count.add(1);
 * app.name.become("Rodolfo");
 * ```
 */
export function world<T extends AnyRecord>(initial: T): WorldShape<T> {
  const timeline = new PatchTimeline();

  const result = {
    timeline,

    story<R>(cause: string, run: () => R): R {
      return story(cause, run);
    },
  } as WorldShape<T>;

  for (const key of Object.keys(initial) as Array<keyof T>) {
    result[key] = new WritableCell(initial[key], [key], timeline) as unknown as WorldShape<T>[typeof key];
  }

  return result;
}

/**
 * Runs updates under the same cause and flushes effects once at the end.
 *
 * @param cause - Human-readable reason for the batch.
 * @param run - Function containing related mutations.
 * @returns The value returned by `run`.
 *
 * @example
 * ```ts
 * const count = cell(0);
 *
 * story("setup", () => {
 *   count.add(1);
 * });
 * ```
 */
export function story<R>(cause: string, run: () => R): R {
  const previousCause = activeCause;

  activeCause = cause;
  batchDepth++;

  try {
    return run();
  } finally {
    batchDepth--;
    activeCause = previousCause;

    if (batchDepth === 0) {
      flushEffects();
    }
  }
}

/**
 * Creates a tracked reactive effect.
 *
 * @param run - Function that reads cells or views.
 * @returns A disposer that stops the effect.
 *
 * @example
 * ```ts
 * const count = cell(0);
 *
 * const stop = effect(() => {
 *   console.log(`Count is ${count.value}`);
 * });
 *
 * count.add(1);
 * stop();
 * ```
 */
export function effect(run: () => void): Dispose {
  const created = new ReactiveEffect(run);

  created.run();

  return () => {
    created.cleanup();
  };
}

/**
 * Creates a text node from a plain value or readable reactive value.
 *
 * @param value - Plain value, writable cell, or derived view.
 * @returns A DOM Text node.
 *
 * @example Reactive text
 * ```ts
 * const count = cell(0);
 * const node = text(count);
 *
 * count.add(1);
 * ```
 */
export function text<T>(value: string | number | boolean | ReadableCell<T>): Text {
  const node = document.createTextNode(EMPTY_TEXT);

  if (isReadable(value)) {
    value.reflect(node);
    return node;
  }

  node.textContent = String(value);

  return node;
}

/**
 * Reflects a source into a DOM target.
 *
 * @param target - DOM node or advanced reflection target.
 * @param source - Writable cell or derived view.
 * @returns A disposer that removes the reflection.
 *
 * @example
 * ```ts
 * const count = cell(0);
 * const label = document.createElement("span");
 *
 * reflect(label, count);
 * ```
 */
export function reflect<T>(target: Node | ReflectTarget<T>, source: ReadableCell<T>): Dispose {
  return source.reflect(target);
}

function createArrayIndexLens<T>(
  parent: Cell<T>,
  index: number,
  timeline: PatchTimeline,
): Cell<T extends readonly (infer Item)[] ? Item : never> {
  type Item = T extends readonly (infer CurrentItem)[] ? CurrentItem : never;

  return new LensCell<Item>(
    () => assertArray(parent.get())[index] as Item,
    (next: Item) => {
      parent.update((value) => {
        const list = assertArray(value).slice();

        list[index] = next;

        return list as T;
      });
    },
    parent.path.concat(index),
    timeline,
  ) as Cell<T extends readonly (infer CurrentItem)[] ? CurrentItem : never>;
}

function createObjectPropertyLens<T, K extends keyof T>(
  parent: Cell<T>,
  key: K,
  timeline: PatchTimeline,
): Cell<T[K]> {
  return new LensCell<T[K]>(
    () => assertObject(parent.get())[key as PropertyKey] as T[K],
    (next: T[K]) => {
      parent.update((value) => ({
        ...(assertObject(value) as object),
        [key]: next,
      }) as T);
    },
    parent.path.concat(key as PropertyKey),
    timeline,
  );
}

function reflectCell<T>(source: ReadableCell<T>, target: Node | ReflectTarget<T>): Dispose {
  const config: ReflectTarget<T> = target instanceof Node ? { node: target } : target;
  const node = config.node;
  const property = config.property;
  const write = config.write ?? createDefaultDomWriter<T>(property);

  write(node, source.get());

  const disposeEffect = effect(() => {
    write(node, source.get());
  });

  if (!isWritableCell(source) || !isInputLike(node)) {
    return disposeEffect;
  }

  const read = config.read ?? createDefaultDomReader<T>(property);
  const event = config.event ?? DEFAULT_INPUT_EVENT;

  const listener = (): void => {
    source.become(read(node));
  };

  node.addEventListener(event, listener);

  return () => {
    disposeEffect();
    node.removeEventListener(event, listener);
  };
}

function createDefaultDomWriter<T>(property?: keyof Node | string): (node: Node, value: T) => void {
  if (property) {
    return (node, value) => {
      (node as unknown as Record<string, unknown>)[String(property)] = value;
    };
  }

  return (node, value) => {
    node.textContent = value == null ? EMPTY_TEXT : String(value);
  };
}

function createDefaultDomReader<T>(property?: keyof Node | string): (node: Node) => T {
  if (property) {
    return (node) => (node as unknown as Record<string, T>)[String(property)];
  }

  return (node) => node.textContent as T;
}

function scheduleEffect(effectToSchedule: ReactiveEffect): void {
  if (batchDepth > 0) {
    pendingEffects.add(effectToSchedule);
    return;
  }

  effectToSchedule.run();
}

function flushEffects(): void {
  for (const effectToFlush of pendingEffects) {
    effectToFlush.run();
  }

  pendingEffects.clear();
}

function isReadable(value: unknown): value is ReadableCell<unknown> {
  return Boolean(value && typeof value === "object" && "get" in value && "reflect" in value);
}

function isWritableCell<T>(value: ReadableCell<T>): value is Cell<T> {
  return "become" in value;
}

function isInputLike(node: Node): node is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement;
}

function assertNumber(value: unknown): number {
  if (typeof value !== "number") {
    throw new TypeError("Seiva expected a number cell.");
  }

  return value;
}

function assertBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError("Seiva expected a boolean cell.");
  }

  return value;
}

function assertString(value: unknown): string {
  if (typeof value !== "string") {
    throw new TypeError("Seiva expected a string cell.");
  }

  return value;
}

function assertArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Seiva expected an array cell.");
  }

  return value;
}

function assertObject(value: unknown): AnyRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Seiva expected an object cell.");
  }

  return value as AnyRecord;
}

const Seiva: SeivaApi = Object.freeze({
  cell,
  world,
  story,
  effect,
  text,
  reflect,
});

export default Seiva;
