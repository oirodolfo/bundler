type Dispose = () => void;
type Watcher<T> = (value: T, previous: T, patch: Patch) => void;
type Reader<T> = () => T;
type Writer<T> = (value: T) => void;
type AnyRecord = Record<PropertyKey, unknown>;

const EMPTY_TEXT = "";
const DEFAULT_CAUSE = "manual";
const DOM_REFLECT_EVENT = "input";

let activeEffect: Effect | null = null;
let activeCause: string | null = null;
let batchDepth = 0;

const pendingEffects = new Set<Effect>();

export interface Patch {
  readonly cause: string;
  readonly path: readonly PropertyKey[];
  readonly previous: unknown;
  readonly next: unknown;
  readonly time: number;
}

export interface Timeline {
  readonly patches: readonly Patch[];
  clear(): void;
}

export interface Cell<T> {
  value: T;
  readonly path: readonly PropertyKey[];

  get(): T;
  become(next: T): this;
  update(mutator: (value: T) => T): this;
  watch(watcher: Watcher<T>): Dispose;
  view<R>(reader: (value: T) => R): ViewCell<R>;
  reflect(target: Node | ReflectTarget<T>): Dispose;
  because(cause: string): this;

  add(amount: number): this;
  subtract(amount: number): this;
  flip(): this;
  append(text: string): this;
  push(...items: T extends readonly (infer Item)[] ? Item[] : never): this;
  remove(predicate: T extends readonly (infer Item)[] ? (item: Item, index: number) => boolean : never): this;
  at(index: number): Cell<T extends readonly (infer Item)[] ? Item : never>;
  pick<K extends keyof T>(key: K): Cell<T[K]>;
}

export interface ViewCell<T> {
  readonly value: T;
  readonly path: readonly PropertyKey[];

  get(): T;
  watch(watcher: Watcher<T>): Dispose;
  view<R>(reader: (value: T) => R): ViewCell<R>;
  reflect(target: Node | ReflectTarget<T>): Dispose;
}

export interface ReflectTarget<T> {
  readonly node: Node;
  readonly property?: keyof Node | string;
  readonly event?: string;
  readonly read?: (node: Node) => T;
  readonly write?: (node: Node, value: T) => void;
}

export type WorldShape<T extends AnyRecord> = {
  readonly [K in keyof T]: Cell<T[K]>;
} & {
  readonly timeline: Timeline;
  story<R>(cause: string, run: () => R): R;
};

class Effect {
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

interface ReactiveSource {
  subscribeEffect(effect: Effect): void;
  unsubscribeEffect(effect: Effect): void;
}

class PatchTimeline implements Timeline {
  public readonly patches: Patch[] = [];

  public clear(): void {
    this.patches.length = 0;
  }

  public add(patch: Patch): void {
    this.patches.push(patch);
  }
}

class WritableCell<T> implements Cell<T>, ReactiveSource {
  private effects = new Set<Effect>();
  private watchers = new Set<Watcher<T>>();
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

    const patch: Patch = {
      cause: this.consumeCause(),
      path: this.path,
      previous,
      next,
      time: Date.now(),
    };

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
    return this.update((value) => assertNumber(value) + amount as T);
  }

  public subtract(amount: number): this {
    return this.update((value) => assertNumber(value) - amount as T);
  }

  public flip(): this {
    return this.update((value) => !assertBoolean(value) as T);
  }

  public append(text: string): this {
    return this.update((value) => assertString(value) + text as T);
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
      return list.filter((item, index) => !(predicate as (item: unknown, index: number) => boolean)(item, index)) as T;
    });
  }

  public at(index: number): Cell<T extends readonly (infer Item)[] ? Item : never> {
    return new LensCell(
      () => assertArray(this.get())[index] as T extends readonly (infer Item)[] ? Item : never,
      (next) => {
        this.update((value) => {
          const list = assertArray(value).slice();
          list[index] = next;
          return list as T;
        });
      },
      this.path.concat(index),
      this.timeline,
    );
  }

  public pick<K extends keyof T>(key: K): Cell<T[K]> {
    return new LensCell(
      () => assertObject(this.get())[key as PropertyKey] as T[K],
      (next) => {
        this.update((value) => ({
          ...(assertObject(value) as object),
          [key]: next,
        }) as T);
      },
      this.path.concat(key as PropertyKey),
      this.timeline,
    );
  }

  public subscribeEffect(effect: Effect): void {
    this.effects.add(effect);
  }

  public unsubscribeEffect(effect: Effect): void {
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

  private consumeCause(): string {
    const cause = this.localCause ?? activeCause ?? DEFAULT_CAUSE;
    this.localCause = null;
    return cause;
  }
}

class LensCell<T> implements Cell<T>, ReactiveSource {
  private effects = new Set<Effect>();
  private watchers = new Set<Watcher<T>>();
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

    const patch: Patch = {
      cause: this.consumeCause(),
      path: this.path,
      previous,
      next,
      time: Date.now(),
    };

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
    return this.update((value) => assertNumber(value) + amount as T);
  }

  public subtract(amount: number): this {
    return this.update((value) => assertNumber(value) - amount as T);
  }

  public flip(): this {
    return this.update((value) => !assertBoolean(value) as T);
  }

  public append(text: string): this {
    return this.update((value) => assertString(value) + text as T);
  }

  public push(...items: T extends readonly (infer Item)[] ? Item[] : never): this {
    return this.update((value) => assertArray(value).concat(items as unknown[]) as T);
  }

  public remove(
    predicate: T extends readonly (infer Item)[] ? (item: Item, index: number) => boolean : never,
  ): this {
    return this.update((value) => {
      const list = assertArray(value);
      return list.filter((item, index) => !(predicate as (item: unknown, index: number) => boolean)(item, index)) as T;
    });
  }

  public at(index: number): Cell<T extends readonly (infer Item)[] ? Item : never> {
    return new LensCell(
      () => assertArray(this.get())[index] as T extends readonly (infer Item)[] ? Item : never,
      (next) => {
        this.update((value) => {
          const list = assertArray(value).slice();
          list[index] = next;
          return list as T;
        });
      },
      this.path.concat(index),
      this.timeline,
    );
  }

  public pick<K extends keyof T>(key: K): Cell<T[K]> {
    return new LensCell(
      () => assertObject(this.get())[key as PropertyKey] as T[K],
      (next) => {
        this.update((value) => ({
          ...(assertObject(value) as object),
          [key]: next,
        }) as T);
      },
      this.path.concat(key as PropertyKey),
      this.timeline,
    );
  }

  public subscribeEffect(effect: Effect): void {
    this.effects.add(effect);
  }

  public unsubscribeEffect(effect: Effect): void {
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

  private consumeCause(): string {
    const cause = this.localCause ?? activeCause ?? DEFAULT_CAUSE;
    this.localCause = null;
    return cause;
  }
}

class DerivedCell<T> implements ViewCell<T>, ReactiveSource {
  private effects = new Set<Effect>();
  private watchers = new Set<Watcher<T>>();
  private cached!: T;
  private initialized = false;

  public constructor(
    private readonly reader: Reader<T>,
    public readonly path: readonly PropertyKey[],
    private readonly timeline: PatchTimeline,
  ) {
    const effect = new Effect(() => {
      const previous = this.cached;
      const next = this.reader();

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

    effect.run();
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

  public subscribeEffect(effect: Effect): void {
    this.effects.add(effect);
  }

  public unsubscribeEffect(effect: Effect): void {
    this.effects.delete(effect);
  }
}

export function cell<T>(initial: T): Cell<T> {
  return new WritableCell(initial, [], new PatchTimeline());
}

export function world<T extends AnyRecord>(initial: T): WorldShape<T> {
  const timeline = new PatchTimeline();
  const result: Partial<WorldShape<T>> = {
    timeline,
    story<R>(cause: string, run: () => R): R {
      return story(cause, run);
    },
  };

  for (const key of Object.keys(initial) as Array<keyof T>) {
    result[key] = new WritableCell(initial[key], [key], timeline) as WorldShape<T>[typeof key];
  }

  return result as WorldShape<T>;
}

export function story<R>(cause: string, run: () => R): R {
  const previous = activeCause;
  activeCause = cause;
  batchDepth++;

  try {
    return run();
  } finally {
    batchDepth--;
    activeCause = previous;

    if (batchDepth === 0) {
      flushEffects();
    }
  }
}

export function effect(run: () => void): Dispose {
  const created = new Effect(run);
  created.run();

  return () => {
    created.cleanup();
  };
}

export function text(value: string | number | boolean | Cell<unknown> | ViewCell<unknown>): Text {
  const node = document.createTextNode(EMPTY_TEXT);

  if (isReadable(value)) {
    value.reflect(node);
    return node;
  }

  node.textContent = String(value);
  return node;
}

export function reflect<T>(target: Node | ReflectTarget<T>, source: Cell<T> | ViewCell<T>): Dispose {
  return source.reflect(target);
}

function reflectCell<T>(source: Cell<T> | ViewCell<T>, target: Node | ReflectTarget<T>): Dispose {
  const config: ReflectTarget<T> = target instanceof Node ? { node: target } : target;
  const node = config.node;
  const property = config.property;
  const write = config.write ?? createDefaultDomWriter<T>(property);

  write(node, source.get());

  const disposeEffect = effect(() => {
    write(node, source.get());
  });

  if (!("become" in source)) {
    return disposeEffect;
  }

  const readable = config.read ?? createDefaultDomReader<T>(property);
  const event = config.event ?? DOM_REFLECT_EVENT;

  if (!isInputLike(node)) {
    return disposeEffect;
  }

  const listener = () => {
    source.become(readable(node));
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

function scheduleEffect(effect: Effect): void {
  if (batchDepth > 0) {
    pendingEffects.add(effect);
    return;
  }

  effect.run();
}

function flushEffects(): void {
  for (const effect of pendingEffects) {
    effect.run();
  }

  pendingEffects.clear();
}

function isReadable(value: unknown): value is Cell<unknown> | ViewCell<unknown> {
  return Boolean(value && typeof value === "object" && "get" in value && "reflect" in value);
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
