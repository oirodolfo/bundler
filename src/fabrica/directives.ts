import type {
  ClassMapDirective,
  Directive,
  RefDirective,
  RenderValue,
  RepeatContext,
  RepeatDirective,
  RepeatOptions,
  Signal,
  StyleMapDirective,
  VirtualRepeatDirective,
  VirtualRepeatOptions,
  WhenDirective,
} from "./types";

/**
 * Creates a conditional rendering directive.
 *
 * @param condition - Boolean-ish value, signal, or expression.
 * @param truthy - Renderer used when condition is truthy.
 * @param falsy - Renderer used when condition is falsy.
 * @returns When directive.
 *
 * @example
 * ```ts
 * html`${when(open, () => html`<p>Open</p>`, () => html`<p>Closed</p>`)}`;
 * ```
 */
export function when(
  condition: unknown | Signal<unknown> | (() => unknown),
  truthy: () => RenderValue,
  falsy?: () => RenderValue,
): WhenDirective {
  const directive = falsy ? { kind: "when" as const, condition, truthy, falsy } : { kind: "when" as const, condition, truthy };
  return createDirective(directive);
}

/**
 * Creates a keyed list rendering directive.
 *
 * @param items - Items array, signal, or expression.
 * @param key - Stable key getter.
 * @param renderItem - Item renderer.
 * @param options - Repeat options.
 * @returns Repeat directive.
 *
 * @example
 * ```ts
 * repeat(users, (user) => user.id, ({ item }) => html`<li>${() => item().name}</li>`);
 * ```
 */
export function repeat<Item, Key extends PropertyKey>(
  items: readonly Item[] | Signal<readonly Item[]> | (() => readonly Item[]),
  key: (item: Item, index: number) => Key,
  renderItem: (context: RepeatContext<Item, Key>) => RenderValue,
  options: RepeatOptions = {},
): RepeatDirective<Item, Key> {
  const directive = options.empty
    ? { kind: "repeat" as const, items, key, render: renderItem, empty: options.empty }
    : { kind: "repeat" as const, items, key, render: renderItem };

  return createDirective(directive);
}


/**
 * Creates a viewport-windowed keyed list directive for very large collections.
 *
 * @param items - Items array, signal, or expression.
 * @param key - Stable key getter.
 * @param renderItem - Item renderer.
 * @param options - Virtualization options.
 * @returns Virtual repeat directive.
 *
 * @example Render a large log list without mounting every row
 * ```ts
 * virtualRepeat(logs, (log) => log.id, ({ item }) => html`<article>${() => item().message}</article>`, {
 *   itemHeight: 34,
 *   overscan: 8,
 *   height: 420,
 * });
 * ```
 */
export function virtualRepeat<Item, Key extends PropertyKey>(
  items: readonly Item[] | Signal<readonly Item[]> | (() => readonly Item[]),
  key: (item: Item, index: number) => Key,
  renderItem: (context: RepeatContext<Item, Key>) => RenderValue,
  options: VirtualRepeatOptions = {},
): VirtualRepeatDirective<Item, Key> {
  const directive = options.empty
    ? {
        kind: "virtualRepeat" as const,
        items,
        key,
        render: renderItem,
        empty: options.empty,
        itemHeight: options.itemHeight ?? 32,
        overscan: options.overscan ?? 8,
        height: options.height ?? 360,
      }
    : {
        kind: "virtualRepeat" as const,
        items,
        key,
        render: renderItem,
        itemHeight: options.itemHeight ?? 32,
        overscan: options.overscan ?? 8,
        height: options.height ?? 360,
      };

  return createDirective(directive);
}

/**
 * Creates an element ref directive.
 *
 * @param callback - Ref callback. May return cleanup.
 * @returns Ref directive.
 *
 * @example
 * ```ts
 * html`<input ref=${ref((node) => node.focus())} />`;
 * ```
 */
export function ref(callback: (node: Element) => void | (() => void)): RefDirective {
  return createDirective({ kind: "ref", callback });
}

/**
 * Creates a class map directive with diffing.
 *
 * @param value - Class boolean map.
 * @returns Class map directive.
 */
export function classMap(value: Record<string, unknown>): ClassMapDirective {
  return createDirective({ kind: "classMap", value });
}

/**
 * Creates a style map directive with diffing.
 *
 * @param value - Style value map.
 * @returns Style map directive.
 */
export function styleMap(value: Record<string, unknown>): StyleMapDirective {
  return createDirective({ kind: "styleMap", value });
}

/**
 * Brands a directive object.
 *
 * @param directive - Directive data.
 * @returns Branded directive.
 */
export function createDirective<DirectiveShape extends { kind: string }>(
  directive: DirectiveShape,
): DirectiveShape & Directive {
  return Object.assign(directive, { __kind: "directive" as const });
}
