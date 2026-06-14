import type { Cleanup, CleanupRegistrar, ContextToken, Owner, ReactiveExpression, Signal } from "../broto/types";
export type { Cleanup, CleanupRegistrar, ContextToken, Owner, ReactiveExpression, Signal } from "../broto/types";

/**
 * Shared public and internal types used by FabricaDOM.
 *
 * @remarks
 * This file is intentionally boring and explicit. The runtime is small, but the
 * type surface is the contract people will build on top of. Keeping the shapes
 * here avoids circular imports and keeps each implementation file focused on one
 * job instead of becoming a kitchen drawer.
 */

/** Values accepted by the DOM renderer use Broto reactive primitives when needed. */
/** Values accepted by the DOM renderer. */
export type RenderValue =
  | string
  | number
  | bigint
  | boolean
  | null
  | undefined
  | Node
  | DocumentFragment
  | readonly RenderValue[]
  | Signal<unknown>
  | ReactiveExpression<unknown>
  | Directive
  | RawHtml
  | DomBag
  | Component
  | ComponentRenderRequest
  | RenderablePayload
  | CssLikeArtifact;


/** Payload shape returned by Fabrica Elements/Cipó adapters in non-DOM modes. */
export type RenderablePayload = {
  readonly tag: string;
  readonly props?: Record<string, unknown> | null;
};

/** Structural style artifact shape produced by Cipó. */
export type CssLikeArtifact = {
  readonly kind?: string;
  readonly className?: string;
  readonly cssText?: string;
  readonly compiledCss?: string;
  toString?: () => string;
};

/** Runtime debug counters. */
export type DebugSnapshot = {
  enabled: boolean;
  templates: number;
  parts: number;
  effects: number;
  flushes: number;
  updates: number;
  components: number;
  delegatedEvents: number;
  reconciliations: number;
  virtualWindows: number;
};

/** A trusted raw HTML wrapper. */
export type RawHtml = {
  readonly __kind: "rawHtml";
  readonly value: string;
};

/** Base directive contract. */
export type Directive = {
  readonly __kind: "directive";
  readonly kind: string;
};

/** Conditional directive. */
export type WhenDirective = Directive & {
  readonly kind: "when";
  condition: unknown | Signal<unknown> | ReactiveExpression<unknown>;
  truthy: () => RenderValue;
  falsy?: () => RenderValue;
};

/** Keyed repeat directive. */
export type RepeatDirective<Item, Key extends PropertyKey> = Directive & {
  readonly kind: "repeat";
  items: readonly Item[] | Signal<readonly Item[]> | ReactiveExpression<readonly Item[]>;
  key: (item: Item, index: number) => Key;
  render: (context: RepeatContext<Item, Key>) => RenderValue;
  empty?: () => RenderValue;
};

/** Per-item context passed to keyed repeat renderers. */
export type RepeatContext<Item, Key extends PropertyKey> = {
  item: Signal<Item>;
  index: Signal<number>;
  key: Signal<Key>;
};

/** Repeat options. */
export type RepeatOptions = {
  empty?: () => RenderValue;
};

/** Virtual repeat options for large lists. */
export type VirtualRepeatOptions = RepeatOptions & {
  itemHeight?: number;
  overscan?: number;
  height?: number | string;
};

/** Element ref directive. */
export type RefDirective = Directive & {
  readonly kind: "ref";
  callback: (node: Element) => void | Cleanup;
};

/** Class map directive. */
export type ClassMapDirective = Directive & {
  readonly kind: "classMap";
  value: Record<string, unknown>;
};

/** Style map directive. */
export type StyleMapDirective = Directive & {
  readonly kind: "styleMap";
  value: Record<string, unknown>;
};

/** Keyed repeat with viewport windowing. */
export type VirtualRepeatDirective<Item, Key extends PropertyKey> = Directive & {
  readonly kind: "virtualRepeat";
  items: readonly Item[] | Signal<readonly Item[]> | ReactiveExpression<readonly Item[]>;
  key: (item: Item, index: number) => Key;
  render: (context: RepeatContext<Item, Key>) => RenderValue;
  empty?: () => RenderValue;
  itemHeight: number;
  overscan: number;
  height: number | string;
};

/** All supported map directives. */
export type MapDirective = ClassMapDirective | StyleMapDirective;

/** Component context. */
export type ComponentContext = {
  /** Component owner created by Broto. */
  owner: Owner;
  /** Stable component id useful for labels, aria and debug output. */
  id: string;
  /** Creates local reactive state for components. */
  signal: typeof import("../broto/reactivity").signal;
  /** Creates an effect owned by this component boundary. */
  effect: typeof import("../broto/reactivity").effect;
  computed: typeof import("../broto/reactivity").computed;
  memo: typeof import("../broto/reactivity").memo;
  batch: typeof import("../broto/reactivity").batch;
  untrack: typeof import("../broto/reactivity").untrack;
  resource: typeof import("../broto/resources").resource;
  onMount(callback: () => void | Cleanup): void;
  onUnmount(callback: Cleanup): void;
  onDispose(callback: Cleanup): void;
  provide<Value>(context: ContextToken<Value>, value: Value): Value;
  useContext<Value>(context: ContextToken<Value>): Value;
  ref(callback: (node: Element) => void | Cleanup): RefDirective;
};

/** Error boundary options. */
export type BoundaryOptions = {
  children: () => RenderValue;
  fallback: (error: unknown, retry: () => void) => RenderValue;
  onError?: (error: unknown) => void;
};

/** Reusable component function. */
export type ComponentChildren = RenderValue | readonly RenderValue[];

/** A deferred component invocation used by component tags and direct composition. */
export type ComponentRenderRequest<Props extends object = Record<string, never>> = {
  readonly __kind: "componentRender";
  readonly component: Component<Props>;
  readonly props: Props & { children?: ComponentChildren };
};

/** Reusable component function. */
export type Component<Props extends object = Record<string, never>> = ((props?: Props & { children?: ComponentChildren }) => ComponentRenderRequest<Props>) & {
  readonly __kind: "component";
  readonly displayName?: string;
  readonly factory?: (props: Props & { children?: ComponentChildren }, context: ComponentContext) => RenderValue;
};

/** Template part compiled from an HTML template. */
export type TemplatePart =
  | {
      type: "child";
      index: number;
      path: number[];
    }
  | {
      type: "attribute";
      index: number;
      path: number[];
      name: string;
    }
  | {
      type: "component";
      index: number;
      path: number[];
      name?: string;
    };

/** Cached compiled template. */
export type CompiledTemplate = {
  template: HTMLTemplateElement;
  parts: TemplatePart[];
};

/** Event modifiers parsed from @click.prevent.passive syntax. */
export type EventBindingConfig = {
  name: string;
  prevent: boolean;
  stop: boolean;
  delegate: boolean;
  options: AddEventListenerOptions;
};

/** Directive controller mounted inside a child part. */
export type DirectiveController = {
  kind: string;
  update(directive: Directive): void;
  dispose(): void;
};

/** One keyed repeat DOM record. */
export type RepeatRecord = {
  item: Signal<unknown>;
  index: Signal<number>;
  key: Signal<PropertyKey>;
  start: Comment;
  end: Comment;
  fragment: DocumentFragment | null;
};

/** DOM bag options. */
export type DomBagOptions = {
  shadow: boolean;
  important: boolean;
};

/** Callable fluent DOM bag. */
export type DomBag = ((props?: Record<string, unknown>) => DomBag) & {
  readonly $$fabricaBag: true;
  readonly elements: Element[];
  readonly el: Element | null;
  readonly count: number;
  readonly size: number;
  readonly length: number;
  readonly shadow: DomBag;
  readonly important: DomBag;
  html(strings: TemplateStringsArray, ...values: RenderValue[]): DomBag;
  mount(value: RenderValue): Cleanup;
  css(input: CssInput, ...values: unknown[]): DomBag;
  appendTo(parent: ParentNode): DomBag;
  prependTo(parent: ParentNode): DomBag;
  remove(): DomBag;
  dispose(): DomBag;
};

/** CSS input accepted by css helpers. */
export type CssInput = TemplateStringsArray | string | Record<string, unknown>;

/** Global installation options. */
export type InstallOptions = {
  exposeDollar?: boolean;
  exposeDollarEl?: boolean;
  dollarAlias?: string;
  forceAlias?: boolean;
};

/** Mutable runtime config. */
export type RuntimeConfig = Required<InstallOptions> & {
  createWhenSelectorMisses: boolean;
};
