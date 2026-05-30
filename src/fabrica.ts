/**
 * Fabrica v5.
 *
 * Tiny fine-grained reactive HTML runtime with cached templates, signals,
 * effects, batching, cleanup hooks, keyed lists, conditional rendering, refs,
 * event modifiers, DOM properties, boolean attributes, class maps, style maps,
 * raw HTML, components, Shadow DOM safety, and userscript-friendly guards.
 *
 * @example Basic counter
 * ```ts
 * import Fabrica from "./fabrica";
 *
 * const count = Fabrica.signal(0);
 *
 * Fabrica.render(document.body, Fabrica.html`
 *   <button @click=${() => count.update((value) => value + 1)}>
 *     Count: ${count}
 *   </button>
 * `);
 * ```
 *
 * @example Conditional UI
 * ```ts
 * const open = Fabrica.signal(false);
 *
 * const view = Fabrica.html`
 *   ${Fabrica.when(
 *     open,
 *     () => Fabrica.html`<section>Open</section>`,
 *     () => Fabrica.html`<section>Closed</section>`,
 *   )}
 * `;
 * ```
 *
 * @example Keyed repeat
 * ```ts
 * const items = Fabrica.signal([
 *   { id: "a", label: "Alpha" },
 *   { id: "b", label: "Beta" },
 * ]);
 *
 * const list = Fabrica.html`
 *   <ul>
 *     ${Fabrica.repeat(
 *       items,
 *       (item) => item.id,
 *       ({ item, index }) => Fabrica.html`
 *         <li>${() => index() + 1}. ${() => item().label}</li>
 *       `,
 *       {
 *         empty: () => Fabrica.html`<li>Empty</li>`,
 *       },
 *     )}
 *   </ul>
 * `;
 * ```
 *
 * @example Attributes, refs, properties, and events
 * ```ts
 * const active = Fabrica.signal(true);
 * const disabled = Fabrica.signal(false);
 *
 * Fabrica.html`
 *   <input
 *     ref=${Fabrica.ref((node) => node.focus())}
 *     .value=${() => active() ? "active" : "idle"}
 *     ?disabled=${disabled}
 *   />
 *
 *   <button
 *     class=${Fabrica.classMap({ active, disabled })}
 *     style=${Fabrica.styleMap({ opacity: () => disabled() ? "0.5" : "1" })}
 *     @click.prevent.stop=${() => active.update((value) => !value)}
 *   >
 *     Toggle
 *   </button>
 * `;
 * ```
 */

/* ========================================================================== */
/* Constants                                                                  */
/* ========================================================================== */

const TEXT_MARKER_PREFIX = "fabrica:text:";
const ATTR_MARKER_PREFIX = "__fabrica_attr_";
const ATTR_MARKER_SUFFIX = "__";
const PART_START = "fabrica:start";
const PART_END = "fabrica:end";

const RAW_HTML_BRAND = Symbol("fabrica.rawHtml");
const COMPONENT_BRAND = Symbol("fabrica.component");
const DIRECTIVE_BRAND = Symbol("fabrica.directive");

const TEMPLATE_CACHE = new WeakMap<TemplateStringsArray, CompiledTemplate>();
const EFFECT_QUEUE = new Set<EffectRunner>();
const NODE_CLEANUPS = new WeakMap<Node, Cleanup[]>();
const DELEGATED_EVENTS = new WeakMap<Document, Set<string>>();

let activeEffect: EffectRunner | null = null;
let trackingEnabled = true;
let flushQueued = false;
let batchDepth = 0;

/* ========================================================================== */
/* Types                                                                      */
/* ========================================================================== */

type Cleanup = () => void;

type ReactiveExpression<TValue> = () => TValue;

type RenderValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Node
  | DocumentFragment
  | readonly RenderValue[]
  | Signal<unknown>
  | ReactiveExpression<unknown>
  | Directive
  | RawHtml;

type EffectRunner = (() => void) & {
  deps: Set<EffectRunner>[];
  cleanups: Cleanup[];
  disposed: boolean;
  sync: boolean;
};

export type Signal<TValue> = (() => TValue) & {
  set(nextValue: TValue): void;
  update(updater: (currentValue: TValue) => TValue): void;
  peek(): TValue;
  subscribe(listener: EffectRunner): Cleanup;
};

type Directive = {
  readonly [DIRECTIVE_BRAND]: true;
  readonly kind: string;
};

type RawHtml = {
  readonly [RAW_HTML_BRAND]: true;
  readonly value: string;
};

type Component<TProps extends object = Record<string, never>> = ((props?: TProps) => RenderValue) & {
  readonly [COMPONENT_BRAND]: true;
};

type TemplatePart =
  | {
      readonly type: "child";
      readonly index: number;
      readonly path: number[];
    }
  | {
      readonly type: "attribute";
      readonly index: number;
      readonly path: number[];
      readonly name: string;
    };

type CompiledTemplate = {
  readonly template: HTMLTemplateElement;
  readonly parts: TemplatePart[];
};

export type RepeatContext<TItem, TKey extends PropertyKey> = {
  readonly item: Signal<TItem>;
  readonly index: Signal<number>;
  readonly key: Signal<TKey>;
};

type RepeatOptions = {
  readonly empty?: () => RenderValue;
};

type EventConfig = {
  readonly name: string;
  readonly prevent: boolean;
  readonly stop: boolean;
  readonly delegate: boolean;
  readonly options: AddEventListenerOptions;
};

type DebugState = {
  enabled: boolean;
  templates: number;
  parts: number;
  effects: number;
  flushes: number;
  updates: number;
  delegatedEvents: number;
};

type DirectiveController = {
  readonly kind: string;
  update(directive: Directive): void;
  dispose(): void;
};

type WhenDirective = Directive & {
  readonly kind: "when";
  readonly condition: unknown | Signal<unknown> | (() => unknown);
  readonly truthy: () => RenderValue;
  readonly falsy?: () => RenderValue;
};

type RepeatDirective<TItem = unknown, TKey extends PropertyKey = PropertyKey> = Directive & {
  readonly kind: "repeat";
  readonly items: readonly TItem[] | Signal<readonly TItem[]> | (() => readonly TItem[]);
  readonly key: (item: TItem, index: number) => TKey;
  readonly render: (context: RepeatContext<TItem, TKey>) => RenderValue;
  readonly empty?: () => RenderValue;
};

type RefDirective = Directive & {
  readonly kind: "ref";
  readonly callback: (node: Element) => void | Cleanup;
};

type MapDirective = Directive & {
  readonly kind: "classMap" | "styleMap";
  readonly value: Record<string, unknown>;
};

type RepeatRecord = {
  readonly item: Signal<unknown>;
  readonly index: Signal<number>;
  readonly key: Signal<PropertyKey>;
  readonly start: Comment;
  readonly end: Comment;
  fragment: DocumentFragment | null;
};

const debugState: DebugState = {
  enabled: false,
  templates: 0,
  parts: 0,
  effects: 0,
  flushes: 0,
  updates: 0,
  delegatedEvents: 0,
};

/* ========================================================================== */
/* Debug                                                                      */
/* ========================================================================== */

/**
 * Enables or disables debug counters.
 *
 * @param enabled - Whether debug mode is enabled.
 *
 * @example
 * ```ts
 * Fabrica.setDebug(true);
 * console.table(Fabrica.debug());
 * ```
 */
function setDebug(enabled: boolean): void {
  debugState.enabled = Boolean(enabled);
}

/**
 * Returns a readonly debug snapshot.
 *
 * @returns Debug state snapshot.
 *
 * @example
 * ```ts
 * const snapshot = Fabrica.debug();
 * console.log(snapshot.updates);
 * ```
 */
function debug(): Readonly<DebugState> {
  return Object.freeze({ ...debugState });
}

/* ========================================================================== */
/* Reactivity                                                                 */
/* ========================================================================== */

/**
 * Creates a fine-grained signal.
 *
 * @remarks
 * `set()` stores exactly the provided value, including functions. Use
 * `update()` for updater semantics.
 *
 * @param initialValue - Initial value.
 * @returns Signal reader with mutation helpers.
 *
 * @example
 * ```ts
 * const count = Fabrica.signal(0);
 * count.set(1);
 * count.update((value) => value + 1);
 * ```
 */
function signal<TValue>(initialValue: TValue): Signal<TValue> {
  let value = initialValue;
  const subscribers = new Set<EffectRunner>();

  function read(): TValue {
    if (activeEffect && trackingEnabled && !subscribers.has(activeEffect)) {
      subscribers.add(activeEffect);
      activeEffect.deps.push(subscribers);
    }

    return value;
  }

  read.set = (nextValue: TValue): void => {
    if (Object.is(value, nextValue)) {
      return;
    }

    value = nextValue;

    for (const subscriber of Array.from(subscribers)) {
      scheduleEffect(subscriber);
    }
  };

  read.update = (updater: (currentValue: TValue) => TValue): void => {
    if (typeof updater !== "function") {
      throw new TypeError("Fabrica.signal.update() expects a function.");
    }

    read.set(updater(value));
  };

  read.peek = (): TValue => value;

  read.subscribe = (listener: EffectRunner): Cleanup => {
    subscribers.add(listener);

    return () => {
      subscribers.delete(listener);
    };
  };

  return read as Signal<TValue>;
}

/**
 * Registers cleanup inside the currently running effect.
 *
 * @param cleanup - Cleanup callback.
 *
 * @example
 * ```ts
 * Fabrica.effect((onCleanup) => {
 *   const id = window.setInterval(() => console.log("tick"), 1000);
 *   onCleanup(() => window.clearInterval(id));
 * });
 * ```
 */
function onCleanup(cleanup: Cleanup): void {
  if (!activeEffect || typeof cleanup !== "function") {
    return;
  }

  activeEffect.cleanups.push(cleanup);
}

/**
 * Runs a tracked effect.
 *
 * @param callback - Effect callback.
 * @param options - Effect options.
 * @returns Dispose callback.
 *
 * @example
 * ```ts
 * const stop = Fabrica.effect(() => {
 *   console.log(count());
 * });
 *
 * stop();
 * ```
 */
function effect(
  callback: (cleanup: (callback: Cleanup) => void) => void,
  options: { readonly sync?: boolean } = {},
): Cleanup {
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
 * @param getter - Derived getter.
 * @returns Derived signal.
 *
 * @example
 * ```ts
 * const doubled = Fabrica.computed(() => count() * 2);
 * ```
 */
function computed<TValue>(getter: () => TValue): Signal<TValue> {
  const output = signal<TValue>(undefined as TValue);

  effect(() => {
    output.set(getter());
  });

  return output;
}

/**
 * Alias for computed.
 *
 * @param getter - Derived getter.
 * @returns Derived signal.
 *
 * @example
 * ```ts
 * const label = Fabrica.memo(() => `Count: ${count()}`);
 * ```
 */
function memo<TValue>(getter: () => TValue): Signal<TValue> {
  return computed(getter);
}

/**
 * Reads signals without dependency tracking.
 *
 * @param callback - Callback to run without tracking.
 * @returns Callback result.
 *
 * @example
 * ```ts
 * const raw = Fabrica.untrack(() => count());
 * ```
 */
function untrack<TValue>(callback: () => TValue): TValue {
  const previous = trackingEnabled;
  trackingEnabled = false;

  try {
    return callback();
  } finally {
    trackingEnabled = previous;
  }
}

/**
 * Batches multiple signal writes into one microtask flush.
 *
 * @param callback - Batch callback.
 * @returns Callback result.
 *
 * @example
 * ```ts
 * Fabrica.batch(() => {
 *   firstName.set("Rod");
 *   lastName.set("Dev");
 * });
 * ```
 */
function batch<TValue>(callback: () => TValue): TValue {
  batchDepth += 1;

  try {
    return callback();
  } finally {
    batchDepth -= 1;

    if (batchDepth === 0 && EFFECT_QUEUE.size > 0) {
      queueFlush();
    }
  }
}

/**
 * Cleans an effect runner dependencies and registered cleanups.
 *
 * @param runner - Effect runner.
 */
function cleanupEffect(runner: EffectRunner): void {
  for (const cleanup of runner.cleanups.splice(0)) {
    cleanup();
  }

  for (const dependency of runner.deps) {
    dependency.delete(runner);
  }

  runner.deps.length = 0;
}

/**
 * Schedules an effect runner.
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

  EFFECT_QUEUE.add(runner);

  if (batchDepth > 0) {
    return;
  }

  queueFlush();
}

/**
 * Queues one effect flush microtask.
 */
function queueFlush(): void {
  if (flushQueued) {
    return;
  }

  flushQueued = true;
  queueMicrotask(flushEffects);
}

/**
 * Flushes queued effects.
 */
function flushEffects(): void {
  flushQueued = false;
  debugState.flushes += 1;

  for (const runner of Array.from(EFFECT_QUEUE)) {
    EFFECT_QUEUE.delete(runner);
    runner();
  }

  if (EFFECT_QUEUE.size > 0 && batchDepth === 0) {
    queueFlush();
  }
}

/* ========================================================================== */
/* Public API                                                                 */
/* ========================================================================== */

/**
 * Creates DOM from a tagged template.
 *
 * @param strings - Template strings.
 * @param values - Dynamic values.
 * @returns Rendered document fragment.
 *
 * @example
 * ```ts
 * const node = Fabrica.html`<strong>${name}</strong>`;
 * ```
 */
function html(strings: TemplateStringsArray, ...values: RenderValue[]): DocumentFragment {
  const compiled = getCompiledTemplate(strings);
  const fragment = compiled.template.content.cloneNode(true) as DocumentFragment;

  applyParts(fragment, compiled.parts, values);

  return fragment;
}

/**
 * Creates trusted raw HTML.
 *
 * @param value - Trusted HTML string.
 * @returns Raw HTML wrapper.
 *
 * @example
 * ```ts
 * Fabrica.html`<article>${Fabrica.html.raw("<strong>Trusted</strong>")}</article>`;
 * ```
 */
html.raw = (value: string): RawHtml => ({
  [RAW_HTML_BRAND]: true,
  value: String(value),
});

/**
 * Replaces a container content and returns dispose.
 *
 * @param container - Container element or fragment.
 * @param value - Render value.
 * @returns Dispose callback.
 *
 * @example
 * ```ts
 * const dispose = Fabrica.render(document.body, Fabrica.html`<h1>Hello</h1>`);
 * dispose();
 * ```
 */
function render(container: Element | DocumentFragment, value: RenderValue): Cleanup {
  disposeTree(container);
  container.replaceChildren();
  appendValue(container, value);

  return () => {
    disposeTree(container);
    container.replaceChildren();
  };
}

/**
 * Mounts content without clearing the container.
 *
 * @param container - Container element or fragment.
 * @param value - Render value.
 * @returns Dispose callback.
 *
 * @example
 * ```ts
 * const dispose = Fabrica.mount(document.body, Fabrica.html`<button>Hi</button>`);
 * ```
 */
function mount(container: Element | DocumentFragment, value: RenderValue): Cleanup {
  const start = document.createComment("fabrica:mount:start");
  const end = document.createComment("fabrica:mount:end");

  container.append(start);
  appendValue(container, value);
  container.append(end);

  return () => {
    disposeRange(start, end);
    removeRange(start, end);
  };
}

/**
 * Creates a branded component.
 *
 * @param factory - Component factory.
 * @returns Branded component.
 *
 * @example
 * ```ts
 * const Header = Fabrica.component(() => Fabrica.html`<header>Hello</header>`);
 * const view = Fabrica.html`${Header()}`;
 * ```
 */
function component<TProps extends object = Record<string, never>>(
  factory: (props: TProps) => RenderValue,
): Component<TProps> {
  const renderComponent = ((props?: TProps) => factory((props ?? {}) as TProps)) as Component<TProps>;

  Object.defineProperty(renderComponent, COMPONENT_BRAND, {
    value: true,
    enumerable: false,
  });

  return renderComponent;
}

/**
 * Creates a conditional directive.
 *
 * @param condition - Condition value, signal, or expression.
 * @param truthy - Renderer used when condition is true.
 * @param falsy - Renderer used when condition is false.
 * @returns When directive.
 *
 * @example
 * ```ts
 * Fabrica.when(open, () => Fabrica.html`Open`, () => Fabrica.html`Closed`);
 * ```
 */
function when(
  condition: unknown | Signal<unknown> | (() => unknown),
  truthy: () => RenderValue,
  falsy?: () => RenderValue,
): WhenDirective {
  return createDirective({
    kind: "when",
    condition,
    truthy,
    falsy,
  });
}

/**
 * Creates a keyed repeat directive.
 *
 * @param items - Items array, signal, or expression.
 * @param key - Key getter.
 * @param renderItem - Item renderer.
 * @param options - Repeat options.
 * @returns Repeat directive.
 *
 * @example
 * ```ts
 * Fabrica.repeat(users, (user) => user.id, ({ item }) => Fabrica.html`
 *   <div>${() => item().name}</div>
 * `);
 * ```
 */
function repeat<TItem, TKey extends PropertyKey>(
  items: readonly TItem[] | Signal<readonly TItem[]> | (() => readonly TItem[]),
  key: (item: TItem, index: number) => TKey,
  renderItem: (context: RepeatContext<TItem, TKey>) => RenderValue,
  options: RepeatOptions = {},
): RepeatDirective<TItem, TKey> {
  return createDirective({
    kind: "repeat",
    items,
    key,
    render: renderItem,
    empty: options.empty,
  });
}

/**
 * Creates a ref directive.
 *
 * @param callback - Ref callback.
 * @returns Ref directive.
 *
 * @example
 * ```ts
 * Fabrica.html`<input ref=${Fabrica.ref((node) => node.focus())} />`;
 * ```
 */
function ref(callback: (node: Element) => void | Cleanup): RefDirective {
  return createDirective({
    kind: "ref",
    callback,
  });
}

/**
 * Creates a class map directive.
 *
 * @param value - Class map.
 * @returns Class map directive.
 *
 * @example
 * ```ts
 * Fabrica.html`<div class=${Fabrica.classMap({ active })}></div>`;
 * ```
 */
function classMap(value: Record<string, unknown | Signal<unknown> | (() => unknown)>): MapDirective {
  return createDirective({
    kind: "classMap",
    value,
  });
}

/**
 * Creates a style map directive.
 *
 * @param value - Style map.
 * @returns Style map directive.
 *
 * @example
 * ```ts
 * Fabrica.html`<div style=${Fabrica.styleMap({ opacity: () => open() ? "1" : "0.5" })}></div>`;
 * ```
 */
function styleMap(
  value: Record<string, string | number | null | undefined | false | Signal<unknown> | (() => unknown)>,
): MapDirective {
  return createDirective({
    kind: "styleMap",
    value,
  });
}

/**
 * Brands directive objects.
 *
 * @param directive - Directive data.
 * @returns Branded directive.
 */
function createDirective<TValue extends { readonly kind: string }>(directive: TValue): TValue & Directive {
  Object.defineProperty(directive, DIRECTIVE_BRAND, {
    value: true,
    enumerable: false,
  });

  return directive as TValue & Directive;
}

/* ========================================================================== */
/* Template Compilation                                                       */
/* ========================================================================== */

/**
 * Gets a compiled template from cache or compiles it.
 *
 * @param strings - Template strings.
 * @returns Compiled template.
 */
function getCompiledTemplate(strings: TemplateStringsArray): CompiledTemplate {
  const cached = TEMPLATE_CACHE.get(strings);

  if (cached) {
    return cached;
  }

  const template = document.createElement("template");
  template.innerHTML = buildTemplateSource(strings);

  const parts = compileParts(template.content);
  const compiled = { template, parts };

  TEMPLATE_CACHE.set(strings, compiled);

  debugState.templates += 1;
  debugState.parts += parts.length;

  return compiled;
}

/**
 * Builds HTML source with interpolation markers.
 *
 * @param strings - Template strings.
 * @returns HTML source.
 */
function buildTemplateSource(strings: TemplateStringsArray): string {
  let source = "";

  for (let index = 0; index < strings.length; index += 1) {
    const chunk = strings[index] ?? "";
    source += chunk;

    if (index >= strings.length - 1) {
      continue;
    }

    source += isAttributePosition(chunk)
      ? `${ATTR_MARKER_PREFIX}${index}${ATTR_MARKER_SUFFIX}`
      : `<!--${TEXT_MARKER_PREFIX}${index}-->`;
  }

  return source;
}

/**
 * Detects whether interpolation is inside an attribute assignment.
 *
 * @param chunk - Static chunk before interpolation.
 * @returns Whether interpolation belongs to an attribute.
 */
function isAttributePosition(chunk: string): boolean {
  return /(?:[.?@:a-zA-Z_][\w:.-]*)\s*=\s*(?:"[^"]*|'[^']*)?$/.test(chunk);
}

/**
 * Compiles all dynamic parts.
 *
 * @param root - Template root.
 * @returns Compiled parts.
 */
function compileParts(root: DocumentFragment): TemplatePart[] {
  const parts: TemplatePart[] = [];

  compileChildParts(root, parts);
  compileAttributeParts(root, parts);

  return parts;
}

/**
 * Compiles child comment markers.
 *
 * @param root - Template root.
 * @param parts - Parts accumulator.
 */
function compileChildParts(root: DocumentFragment, parts: TemplatePart[]): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue ?? "";

    if (!value.startsWith(TEXT_MARKER_PREFIX)) {
      continue;
    }

    parts.push({
      type: "child",
      index: Number(value.slice(TEXT_MARKER_PREFIX.length)),
      path: getNodePath(root, node),
    });
  }
}

/**
 * Compiles attribute markers.
 *
 * @param root - Template root.
 * @param parts - Parts accumulator.
 */
function compileAttributeParts(root: DocumentFragment, parts: TemplatePart[]): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const element = walker.currentNode as Element;

    for (const attribute of Array.from(element.attributes)) {
      const index = getAttributeMarkerIndex(attribute.value);

      if (index === -1) {
        continue;
      }

      parts.push({
        type: "attribute",
        index,
        path: getNodePath(root, element),
        name: attribute.name,
      });

      element.removeAttribute(attribute.name);
    }
  }
}

/**
 * Reads the dynamic marker index from an attribute value.
 *
 * @param value - Attribute value.
 * @returns Marker index or -1.
 */
function getAttributeMarkerIndex(value: string): number {
  const start = value.indexOf(ATTR_MARKER_PREFIX);

  if (start === -1) {
    return -1;
  }

  return Number(value.slice(start + ATTR_MARKER_PREFIX.length).split(ATTR_MARKER_SUFFIX)[0]);
}

/**
 * Builds a node path from root to node.
 *
 * @param root - Root node.
 * @param node - Target node.
 * @returns Child index path.
 */
function getNodePath(root: Node, node: Node): number[] {
  const path: number[] = [];
  let current: Node | null = node;

  while (current && current !== root) {
    const parentNode: Node | null = current.parentNode;

    if (!parentNode) {
      break;
    }

    path.push(indexOfChild(parentNode, current));
    current = parentNode;
  }

  path.reverse();

  return path;
}

/**
 * Gets child index using sibling traversal.
 *
 * @param parentNode - Parent node.
 * @param child - Child node.
 * @returns Child index.
 */
function indexOfChild(parentNode: Node, child: Node): number {
  let index = 0;
  let current: ChildNode | null = parentNode.firstChild;

  while (current && current !== child) {
    index += 1;
    current = current.nextSibling;
  }

  return index;
}

/**
 * Resolves a compiled path in a cloned template.
 *
 * @param root - Root node.
 * @param path - Compiled path.
 * @returns Resolved node.
 */
function resolvePath(root: Node, path: readonly number[]): Node | null {
  let current: Node | null = root;

  for (const index of path) {
    current = current.childNodes[index] ?? null;

    if (!current) {
      return null;
    }
  }

  return current;
}

/**
 * Sorts parts in reverse DOM order so marker replacement cannot shift unresolved siblings.
 *
 * @param left - Left part.
 * @param right - Right part.
 * @returns Sort result.
 */
function comparePartsInReverseDomOrder(left: TemplatePart, right: TemplatePart): number {
  const maxLength = Math.max(left.path.length, right.path.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left.path[index] ?? -1;
    const rightValue = right.path[index] ?? -1;

    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
  }

  return right.path.length - left.path.length;
}

/**
 * Applies compiled parts to a cloned fragment.
 *
 * @param fragment - Cloned fragment.
 * @param parts - Compiled parts.
 * @param values - Runtime values.
 */
function applyParts(fragment: DocumentFragment, parts: readonly TemplatePart[], values: readonly RenderValue[]): void {
  const resolvedParts: Array<{ readonly part: TemplatePart; readonly node: Node }> = [];

  for (const part of parts) {
    const node = resolvePath(fragment, part.path);

    if (node) {
      resolvedParts.push({ part, node });
    }
  }

  resolvedParts.sort((left, right) => comparePartsInReverseDomOrder(left.part, right.part));

  for (const { part, node } of resolvedParts) {
    if (part.type === "child") {
      bindChildPart(node, values[part.index]);
      continue;
    }

    bindAttributePart(node, part.name, values[part.index]);
  }
}

/* ========================================================================== */
/* Child Parts                                                                */
/* ========================================================================== */

/**
 * Binds a child marker.
 *
 * @param marker - Marker node.
 * @param value - Render value.
 */
function bindChildPart(marker: Node, value: RenderValue): void {
  const part = createChildPart(marker);

  if (isSignal(value) || isReactiveExpression(value)) {
    const dispose = effect(() => {
      part.set(readReactiveValue(value));
    });

    registerCleanup(part.start, dispose);
    return;
  }

  part.set(value);
}

/**
 * Creates a child part with stable boundaries.
 *
 * @param marker - Marker node.
 * @returns Child part controller.
 */
function createChildPart(marker: Node): { readonly start: Comment; readonly end: Comment; set(value: RenderValue): void } {
  const start = document.createComment(PART_START);
  const end = document.createComment(PART_END);

  let currentType = "empty";
  let currentText = "";
  let textNode: Text | null = null;
  let currentNode: Node | null = null;
  let directiveController: DirectiveController | null = null;

  const parentNode: Node | null = marker.parentNode;

  if (parentNode) {
    parentNode.insertBefore(start, marker);
    parentNode.insertBefore(end, marker);
    parentNode.removeChild(marker);
  }

  return {
    start,
    end,

    set(value: RenderValue): void {
      debugState.updates += 1;

      const resolvedValue = readReactiveValue(value);

      if (isDirective(resolvedValue)) {
        if (!directiveController || directiveController.kind !== resolvedValue.kind) {
          directiveController?.dispose();
          clearRange(start, end);
          directiveController = createDirectiveController(start, end, resolvedValue);
          currentType = `directive:${resolvedValue.kind}`;
          currentText = "";
          textNode = null;
          currentNode = null;
        }

        directiveController.update(resolvedValue);
        return;
      }

      if (directiveController) {
        directiveController.dispose();
        directiveController = null;
      }

      if (resolvedValue == null || resolvedValue === false || resolvedValue === true) {
        if (currentType !== "empty") {
          clearRange(start, end);
          currentType = "empty";
          currentText = "";
          textNode = null;
          currentNode = null;
        }

        return;
      }

      if (Array.isArray(resolvedValue)) {
        clearRange(start, end);

        for (const item of resolvedValue) {
          appendValue(end.parentNode, item, end);
        }

        currentType = "array";
        currentText = "";
        textNode = null;
        currentNode = null;
        return;
      }

      if (isRawHtml(resolvedValue)) {
        if (currentType === "raw" && currentText === resolvedValue.value) {
          return;
        }

        clearRange(start, end);

        const template = document.createElement("template");
        template.innerHTML = resolvedValue.value;
        insertBefore(end, template.content);

        currentType = "raw";
        currentText = resolvedValue.value;
        textNode = null;
        currentNode = null;
        return;
      }

      if (isDomNode(resolvedValue)) {
        if (currentType === "node" && currentNode === resolvedValue) {
          return;
        }

        clearRange(start, end);
        insertBefore(end, resolvedValue);

        currentType = "node";
        currentText = "";
        textNode = null;
        currentNode = resolvedValue;
        return;
      }

      if (typeof resolvedValue === "string" || typeof resolvedValue === "number") {
        const nextText = String(resolvedValue);

        if (currentType === "text" && textNode) {
          if (currentText !== nextText) {
            textNode.data = nextText;
            currentText = nextText;
          }

          return;
        }

        clearRange(start, end);

        textNode = document.createTextNode(nextText);
        insertBefore(end, textNode);

        currentType = "text";
        currentText = nextText;
        currentNode = textNode;
        return;
      }

      this.set(String(resolvedValue));
    },
  };
}

/**
 * Creates a directive controller.
 *
 * @param start - Start boundary.
 * @param end - End boundary.
 * @param directive - Initial directive.
 * @returns Directive controller.
 */
function createDirectiveController(start: Comment, end: Comment, directive: Directive): DirectiveController {
  if (directive.kind === "when") {
    return createWhenController(start, end);
  }

  if (directive.kind === "repeat") {
    return createRepeatController(start, end);
  }

  return {
    kind: directive.kind,
    update(): void {},
    dispose(): void {
      clearRange(start, end);
    },
  };
}

/**
 * Creates a stable when controller.
 *
 * @param start - Start boundary.
 * @param end - End boundary.
 * @returns When controller.
 */
function createWhenController(start: Comment, end: Comment): DirectiveController {
  let disposeEffect: Cleanup | null = null;
  let currentDirective: WhenDirective | null = null;
  let previousBranch = "";

  return {
    kind: "when",

    update(nextDirective): void {
      currentDirective = nextDirective as WhenDirective;

      if (disposeEffect) {
        return;
      }

      disposeEffect = effect(() => {
        if (!currentDirective) {
          return;
        }

        const condition = Boolean(readReactiveValue(currentDirective.condition));
        const branch = condition ? "truthy" : "falsy";

        if (previousBranch === branch) {
          return;
        }

        previousBranch = branch;
        clearRange(start, end);

        const factory = condition ? currentDirective.truthy : currentDirective.falsy;

        if (factory) {
          appendValue(end.parentNode, factory(), end);
        }
      });
    },

    dispose(): void {
      disposeEffect?.();
      disposeEffect = null;
      clearRange(start, end);
    },
  };
}

/**
 * Creates a keyed repeat controller.
 *
 * @param start - Start boundary.
 * @param end - End boundary.
 * @returns Repeat controller.
 */
function createRepeatController(start: Comment, end: Comment): DirectiveController {
  const records = new Map<PropertyKey, RepeatRecord>();
  let disposeItems: Cleanup | null = null;
  let currentDirective: RepeatDirective | null = null;
  let emptyStart: Comment | null = null;
  let emptyEnd: Comment | null = null;

  return {
    kind: "repeat",

    update(nextDirective): void {
      currentDirective = nextDirective as RepeatDirective;

      if (disposeItems) {
        return;
      }

      const update = (): void => {
        if (!currentDirective) {
          return;
        }

        const hasItems = updateRepeat(start, end, records, currentDirective);

        if (!hasItems && currentDirective.empty) {
          if (!emptyStart) {
            emptyStart = document.createComment("fabrica:empty:start");
            emptyEnd = document.createComment("fabrica:empty:end");

            insertBefore(end, emptyStart);
            appendValue(end.parentNode, currentDirective.empty(), end);
            insertBefore(end, emptyEnd);
          }

          return;
        }

        if (emptyStart && emptyEnd) {
          disposeRange(emptyStart, emptyEnd);
          removeRange(emptyStart, emptyEnd);
          emptyStart = null;
          emptyEnd = null;
        }
      };

      if (isSignal(currentDirective.items) || isReactiveExpression(currentDirective.items)) {
        disposeItems = effect(update);
        return;
      }

      update();
    },

    dispose(): void {
      disposeItems?.();
      disposeItems = null;

      for (const record of records.values()) {
        disposeRange(record.start, record.end);
      }

      records.clear();
      clearRange(start, end);
    },
  };
}

/**
 * Updates a keyed repeat range.
 *
 * @param start - Start boundary.
 * @param end - End boundary.
 * @param records - Current records.
 * @param directive - Repeat directive.
 * @returns Whether there are visible items.
 */
function updateRepeat(
  start: Comment,
  end: Comment,
  records: Map<PropertyKey, RepeatRecord>,
  directive: RepeatDirective,
): boolean {
  const resolvedItems = readReactiveValue(directive.items);
  const items = Array.isArray(resolvedItems) ? resolvedItems : [];
  const nextKeys = new Set<PropertyKey>();
  let cursor: Node | null = start.nextSibling;

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const key = directive.key(item, index);

    nextKeys.add(key);

    let record = records.get(key);

    if (!record) {
      record = createRepeatRecord(item, index, key, directive.render);
      records.set(key, record);
    } else {
      batch(() => {
        record.item.set(item);
        record.index.set(index);
        record.key.set(key);
      });
    }

    if (record.fragment) {
      end.parentNode?.insertBefore(record.fragment, cursor ?? end);
      record.fragment = null;
    } else {
      moveRangeBefore(record.start, record.end, cursor ?? end);
    }

    cursor = record.end.nextSibling;
  }

  for (const [key, record] of Array.from(records.entries())) {
    if (nextKeys.has(key)) {
      continue;
    }

    disposeRange(record.start, record.end);
    removeRange(record.start, record.end);
    records.delete(key);
  }

  return items.length > 0;
}

/**
 * Creates one repeat record.
 *
 * @param item - Item value.
 * @param index - Item index.
 * @param key - Item key.
 * @param renderItem - Item renderer.
 * @returns Repeat record.
 */
function createRepeatRecord(
  item: unknown,
  index: number,
  key: PropertyKey,
  renderItem: (context: RepeatContext<unknown, PropertyKey>) => RenderValue,
): RepeatRecord {
  const start = document.createComment("fabrica:item:start");
  const end = document.createComment("fabrica:item:end");

  const context: RepeatContext<unknown, PropertyKey> = {
    item: signal(item),
    index: signal(index),
    key: signal(key),
  };

  const fragment = document.createDocumentFragment();
  fragment.append(start);
  appendValue(fragment, renderItem(context));
  fragment.append(end);

  return {
    ...context,
    start,
    end,
    fragment,
  };
}

/* ========================================================================== */
/* Attribute Parts                                                            */
/* ========================================================================== */

/**
 * Binds an attribute, property, boolean attribute, ref, or event.
 *
 * @param node - Target node.
 * @param rawName - Attribute name.
 * @param value - Runtime value.
 */
function bindAttributePart(node: Node, rawName: string, value: RenderValue): void {
  if (!isDomElement(node)) {
    return;
  }

  if (isRefDirective(value)) {
    const cleanup = value.callback(node);

    if (typeof cleanup === "function") {
      registerCleanup(node, cleanup);
    }

    return;
  }

  if (rawName.startsWith("@")) {
    bindEventPart(node, rawName.slice(1), value);
    return;
  }

  if (rawName.startsWith(".")) {
    bindPropertyPart(node, rawName.slice(1), value);
    return;
  }

  if (rawName.startsWith("?")) {
    bindBooleanAttributePart(node, rawName.slice(1), value);
    return;
  }

  if (rawName.startsWith("class:")) {
    bindConditionalClassPart(node, rawName.slice("class:".length), value);
    return;
  }

  bindPlainAttributePart(node, rawName, value);
}

/**
 * Binds a normal attribute.
 *
 * @param element - Target element.
 * @param name - Attribute name.
 * @param value - Runtime value.
 */
function bindPlainAttributePart(element: Element, name: string, value: RenderValue): void {
  let previous: unknown = Symbol("initial");
  let mapState: { previousKeys: Set<string> } | null = null;

  const update = (): void => {
    const next = readReactiveValue(value);

    if (isClassMapDirective(next) && name === "class") {
      mapState = applyClassMap(element, next.value, mapState);
      return;
    }

    if (isStyleMapDirective(next) && name === "style") {
      mapState = applyStyleMap(element, next.value, mapState);
      return;
    }

    if (Object.is(previous, next)) {
      return;
    }

    previous = next;

    if (next == null || next === false) {
      element.removeAttribute(name);
      return;
    }

    element.setAttribute(name, String(next));
  };

  const dispose = hasReactiveValue(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }
}

/**
 * Binds a DOM property.
 *
 * @param element - Target element.
 * @param name - Property name.
 * @param value - Runtime value.
 */
function bindPropertyPart(element: Element, name: string, value: RenderValue): void {
  let previous: unknown = Symbol("initial");

  const update = (): void => {
    const next = readReactiveValue(value);

    if (Object.is(previous, next)) {
      return;
    }

    previous = next;
    (element as unknown as Record<string, unknown>)[name] = next;
  };

  const dispose = hasReactiveValue(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }
}

/**
 * Binds a boolean attribute.
 *
 * @param element - Target element.
 * @param name - Attribute name.
 * @param value - Runtime value.
 */
function bindBooleanAttributePart(element: Element, name: string, value: RenderValue): void {
  let previous: boolean | null = null;

  const update = (): void => {
    const next = Boolean(readReactiveValue(value));

    if (previous === next) {
      return;
    }

    previous = next;

    if (next) {
      element.setAttribute(name, "");
      return;
    }

    element.removeAttribute(name);
  };

  const dispose = hasReactiveValue(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }
}

/**
 * Binds a conditional class.
 *
 * @param element - Target element.
 * @param className - Class name.
 * @param value - Runtime value.
 */
function bindConditionalClassPart(element: Element, className: string, value: RenderValue): void {
  let previous: boolean | null = null;

  const update = (): void => {
    const next = Boolean(readReactiveValue(value));

    if (previous === next) {
      return;
    }

    previous = next;
    element.classList.toggle(className, next);
  };

  const dispose = hasReactiveValue(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }
}

/* ========================================================================== */
/* Events                                                                     */
/* ========================================================================== */

/**
 * Binds an event listener.
 *
 * @param element - Target element.
 * @param rawEventName - Event name with modifiers.
 * @param value - Handler or handler signal.
 */
function bindEventPart(element: Element, rawEventName: string, value: RenderValue): void {
  const config = parseEventName(rawEventName);

  if (config.delegate) {
    bindDelegatedEventPart(element, config, value);
    return;
  }

  let previousHandler: (((event: Event) => void) & { original?: unknown }) | null = null;

  const update = (): void => {
    const handler = isSignal(value) ? value() : value;

    if (previousHandler && previousHandler.original === handler) {
      return;
    }

    if (previousHandler) {
      element.removeEventListener(config.name, previousHandler, config.options);
      previousHandler = null;
    }

    if (typeof handler !== "function") {
      return;
    }

    previousHandler = createEventHandler(element, handler as (event: Event) => void, config);
    element.addEventListener(config.name, previousHandler, config.options);
  };

  const dispose = isSignal(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }

  registerCleanup(element, () => {
    if (previousHandler) {
      element.removeEventListener(config.name, previousHandler, config.options);
    }
  });
}

/**
 * Binds a delegated event listener.
 *
 * @param element - Target element.
 * @param config - Event config.
 * @param value - Handler.
 */
function bindDelegatedEventPart(element: Element, config: EventConfig, value: RenderValue): void {
  const handler = isSignal(value) ? value() : value;

  if (typeof handler !== "function") {
    return;
  }

  const target = element as Element & {
    __fabricaDelegatedHandlers?: Record<string, (event: Event) => void>;
  };

  target.__fabricaDelegatedHandlers ??= {};
  target.__fabricaDelegatedHandlers[config.name] = createEventHandler(element, handler as (event: Event) => void, config);

  ensureDelegatedEvent(document, config.name);

  registerCleanup(element, () => {
    if (target.__fabricaDelegatedHandlers) {
      delete target.__fabricaDelegatedHandlers[config.name];
    }
  });
}

/**
 * Creates an event handler wrapper.
 *
 * @param element - Bound element.
 * @param handler - User handler.
 * @param config - Event config.
 * @returns Wrapped handler.
 */
function createEventHandler(
  element: Element,
  handler: (event: Event) => void,
  config: EventConfig,
): ((event: Event) => void) & { original?: unknown } {
  const wrapped = ((event: Event): void => {
    if (config.prevent && !config.options.passive) {
      event.preventDefault();
    }

    if (config.stop) {
      event.stopPropagation();
    }

    handler.call(element, event);
  }) as ((event: Event) => void) & { original?: unknown };

  wrapped.original = handler;

  return wrapped;
}

/**
 * Installs a delegated event listener for a document.
 *
 * @param root - Document root.
 * @param eventName - Event name.
 */
function ensureDelegatedEvent(root: Document, eventName: string): void {
  let events = DELEGATED_EVENTS.get(root);

  if (!events) {
    events = new Set();
    DELEGATED_EVENTS.set(root, events);
  }

  if (events.has(eventName)) {
    return;
  }

  events.add(eventName);
  debugState.delegatedEvents += 1;

  root.addEventListener(eventName, (event) => {
    let current: Node | null = event.target as Node | null;

    while (current && current !== root) {
      const handlers = (current as Element & {
        __fabricaDelegatedHandlers?: Record<string, (event: Event) => void>;
      }).__fabricaDelegatedHandlers;

      if (handlers?.[eventName]) {
        handlers[eventName](event);

        if (event.cancelBubble) {
          return;
        }
      }

      current = current.parentNode;
    }
  });
}

/**
 * Parses event modifiers.
 *
 * @param rawEventName - Raw event name.
 * @returns Event config.
 */
function parseEventName(rawEventName: string): EventConfig {
  const parts = rawEventName.split(".");
  const name = parts.shift() || rawEventName;
  const modifiers = new Set(parts);

  return {
    name,
    prevent: modifiers.has("prevent"),
    stop: modifiers.has("stop"),
    delegate: modifiers.has("delegate"),
    options: {
      once: modifiers.has("once"),
      passive: modifiers.has("passive"),
      capture: modifiers.has("capture"),
    },
  };
}

/* ========================================================================== */
/* classMap / styleMap                                                        */
/* ========================================================================== */

/**
 * Applies class map diff.
 *
 * @param element - Target element.
 * @param map - Class map.
 * @param state - Previous state.
 * @returns Next state.
 */
function applyClassMap(
  element: Element,
  map: Record<string, unknown>,
  state: { previousKeys: Set<string> } | null,
): { previousKeys: Set<string> } {
  const previousKeys = state?.previousKeys ?? new Set<string>();
  const nextKeys = new Set(Object.keys(map));

  for (const className of previousKeys) {
    if (!nextKeys.has(className)) {
      element.classList.remove(className);
    }
  }

  for (const className of nextKeys) {
    element.classList.toggle(className, Boolean(readReactiveValue(map[className])));
  }

  return { previousKeys: nextKeys };
}

/**
 * Applies style map diff.
 *
 * @param element - Target element.
 * @param map - Style map.
 * @param state - Previous state.
 * @returns Next state.
 */
function applyStyleMap(
  element: Element,
  map: Record<string, unknown>,
  state: { previousKeys: Set<string> } | null,
): { previousKeys: Set<string> } {
  const previousKeys = state?.previousKeys ?? new Set<string>();
  const nextKeys = new Set(Object.keys(map));
  const style = (element as HTMLElement).style;

  for (const property of previousKeys) {
    if (!nextKeys.has(property)) {
      style.removeProperty(property);
    }
  }

  for (const property of nextKeys) {
    const value = readReactiveValue(map[property]);

    if (value == null || value === false) {
      style.removeProperty(property);
      continue;
    }

    style.setProperty(property, String(value));
  }

  return { previousKeys: nextKeys };
}

/* ========================================================================== */
/* DOM Operations                                                             */
/* ========================================================================== */

/**
 * Moves an inclusive range before another node.
 *
 * @param start - Range start.
 * @param end - Range end.
 * @param before - Reference node.
 */
function moveRangeBefore(start: Node, end: Node, before: Node): void {
  const parentNode: Node | null = before.parentNode;

  if (!parentNode || start === before || end.nextSibling === before) {
    return;
  }

  const fragment = document.createDocumentFragment();
  let current: Node | null = start;

  while (current) {
    const nextNode: Node | null = current.nextSibling;
    fragment.append(current);

    if (current === end) {
      break;
    }

    current = nextNode;
  }

  parentNode.insertBefore(fragment, before);
}

/**
 * Removes an inclusive node range.
 *
 * @param start - Range start.
 * @param end - Range end.
 */
function removeRange(start: Node, end: Node): void {
  let current: Node | null = start;

  while (current) {
    const nextNode: Node | null = current.nextSibling;
    current.parentNode?.removeChild(current);

    if (current === end) {
      break;
    }

    current = nextNode;
  }
}

/**
 * Clears nodes between boundary comments.
 *
 * @param start - Start boundary.
 * @param end - End boundary.
 */
function clearRange(start: Comment, end: Comment): void {
  let current: Node | null = start.nextSibling;

  while (current && current !== end) {
    const nextNode: Node | null = current.nextSibling;
    disposeTree(current);
    current.parentNode?.removeChild(current);
    current = nextNode;
  }
}

/**
 * Inserts a value before a reference node.
 *
 * @param referenceNode - Reference node.
 * @param value - Value to insert.
 */
function insertBefore(referenceNode: Node, value: RenderValue): void {
  const parentNode: Node | null = referenceNode.parentNode;

  if (!parentNode) {
    return;
  }

  appendValue(parentNode, value, referenceNode);
}

/**
 * Appends or inserts a render value.
 *
 * @param parentNode - Parent node.
 * @param value - Render value.
 * @param beforeNode - Optional reference node.
 */
function appendValue(parentNode: Node | null, value: RenderValue, beforeNode: Node | null = null): void {
  if (!parentNode) {
    return;
  }

  const resolvedValue = readReactiveValue(value);

  if (resolvedValue == null || resolvedValue === false || resolvedValue === true) {
    return;
  }

  if (Array.isArray(resolvedValue)) {
    for (const item of resolvedValue) {
      appendValue(parentNode, item, beforeNode);
    }

    return;
  }

  if (isRawHtml(resolvedValue)) {
    const template = document.createElement("template");
    template.innerHTML = resolvedValue.value;
    parentNode.insertBefore(template.content, beforeNode);
    return;
  }

  if (isDomNode(resolvedValue)) {
    parentNode.insertBefore(resolvedValue, beforeNode);
    return;
  }

  parentNode.insertBefore(document.createTextNode(String(resolvedValue)), beforeNode);
}

/**
 * Registers cleanup on a node.
 *
 * @param node - Node.
 * @param cleanup - Cleanup callback.
 */
function registerCleanup(node: Node, cleanup: Cleanup): void {
  const list = NODE_CLEANUPS.get(node) ?? [];
  list.push(cleanup);
  NODE_CLEANUPS.set(node, list);
}

/**
 * Disposes a tree.
 *
 * @param node - Root node.
 */
function disposeTree(node: Node): void {
  const cleanups = NODE_CLEANUPS.get(node);

  if (cleanups) {
    for (const cleanup of cleanups.splice(0)) {
      cleanup();
    }

    NODE_CLEANUPS.delete(node);
  }

  for (const child of Array.from(node.childNodes)) {
    disposeTree(child);
  }
}

/**
 * Disposes an inclusive range.
 *
 * @param start - Range start.
 * @param end - Range end.
 */
function disposeRange(start: Node, end: Node): void {
  let current: Node | null = start;

  while (current) {
    disposeTree(current);

    if (current === end) {
      break;
    }

    current = current.nextSibling;
  }
}

/* ========================================================================== */
/* Guards                                                                     */
/* ========================================================================== */

/**
 * Reads a signal or reactive expression.
 *
 * @param value - Value.
 * @returns Resolved value.
 */
function readReactiveValue(value: unknown): any {
  if (isSignal(value)) {
    return value();
  }

  if (
    Array.isArray(value) ||
    isDirective(value) ||
    isRawHtml(value) ||
    isDomNode(value) ||
    isComponent(value)
  ) {
    return value;
  }

  if (isReactiveExpression(value)) {
    return value();
  }

  return value;
}

/**
 * Checks signal shape.
 *
 * @param value - Value.
 * @returns Whether value is signal.
 */
function isSignal(value: unknown): value is Signal<unknown> {
  return (
    typeof value === "function" &&
    typeof (value as Partial<Signal<unknown>>).set === "function" &&
    typeof (value as Partial<Signal<unknown>>).update === "function" &&
    typeof (value as Partial<Signal<unknown>>).peek === "function" &&
    typeof (value as Partial<Signal<unknown>>).subscribe === "function"
  );
}

/**
 * Checks component brand.
 *
 * @param value - Value.
 * @returns Whether value is component.
 */
function isComponent(value: unknown): value is Component {
  return Boolean(value && typeof value === "function" && (value as Component)[COMPONENT_BRAND]);
}

/**
 * Checks reactive expression.
 *
 * @param value - Value.
 * @returns Whether value is reactive expression.
 */
function isReactiveExpression(value: unknown): value is ReactiveExpression<unknown> {
  return typeof value === "function" && !isSignal(value) && !isComponent(value);
}

/**
 * Checks directive brand.
 *
 * @param value - Value.
 * @returns Whether value is directive.
 */
function isDirective(value: unknown): value is Directive {
  return Boolean(value && typeof value === "object" && (value as Directive)[DIRECTIVE_BRAND]);
}

/**
 * Checks ref directive.
 *
 * @param value - Value.
 * @returns Whether value is ref directive.
 */
function isRefDirective(value: unknown): value is RefDirective {
  return isDirective(value) && value.kind === "ref";
}

/**
 * Checks classMap directive.
 *
 * @param value - Value.
 * @returns Whether value is classMap directive.
 */
function isClassMapDirective(value: unknown): value is MapDirective {
  return isDirective(value) && value.kind === "classMap";
}

/**
 * Checks styleMap directive.
 *
 * @param value - Value.
 * @returns Whether value is styleMap directive.
 */
function isStyleMapDirective(value: unknown): value is MapDirective {
  return isDirective(value) && value.kind === "styleMap";
}

/**
 * Checks raw HTML.
 *
 * @param value - Value.
 * @returns Whether value is raw HTML.
 */
function isRawHtml(value: unknown): value is RawHtml {
  return Boolean(value && typeof value === "object" && (value as RawHtml)[RAW_HTML_BRAND]);
}

/**
 * Checks DOM node structurally across realms.
 *
 * @param value - Value.
 * @returns Whether value is DOM node.
 */
function isDomNode(value: unknown): value is Node {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Node).nodeType === "number" &&
      typeof (value as Node).nodeName === "string",
  );
}

/**
 * Checks DOM element structurally across realms.
 *
 * @param value - Value.
 * @returns Whether value is DOM element.
 */
function isDomElement(value: unknown): value is Element {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Element).nodeType === 1 &&
      typeof (value as Element).tagName === "string",
  );
}

/**
 * Checks if a value can react.
 *
 * @param value - Value.
 * @returns Whether value has reactive content.
 */
function hasReactiveValue(value: unknown): boolean {
  if (isSignal(value) || isReactiveExpression(value)) {
    return true;
  }

  if (!isDirective(value)) {
    return false;
  }

  if (isClassMapDirective(value) || isStyleMapDirective(value)) {
    return Object.values(value.value).some((entry) => isSignal(entry) || isReactiveExpression(entry));
  }

  return false;
}

/* ========================================================================== */
/* Export                                                                     */
/* ========================================================================== */

const Fabrica = Object.freeze({
  html,
  render,
  mount,
  component,
  signal,
  effect,
  onCleanup,
  computed,
  memo,
  untrack,
  batch,
  repeat,
  when,
  ref,
  classMap,
  styleMap,
  setDebug,
  debug,
});

declare global {
  interface Window {
    Fabrica: typeof Fabrica;
  }
}

if (typeof window !== "undefined") {
  window.Fabrica = Fabrica;
}

export default Fábrica;
