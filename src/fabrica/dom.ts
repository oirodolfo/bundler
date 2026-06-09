import { PART_END, PART_START } from "./constants";
import { debugState } from "./debug";
import { clearRange, disposeRange, disposeTree, moveRangeBefore, registerCleanup, removeRange } from "./dom-cleanup";
import { bindEvent } from "./events";
import { isClassMapDirective, isDirective, isDomBag, isDomElement, isDomNode, isRawHtml, isRefDirective, isSignal, isStyleMapDirective } from "./guards";
import { applyClassMap, applyStyleMap } from "./maps";
import { batch, effect, signal } from "./reactivity";
import { comparePathsReverse, getCompiledTemplate, resolvePath } from "./template";
import { hasReactiveValue, readValue } from "./value";
import type { Directive, DirectiveController, RenderValue, RepeatDirective, RepeatRecord, TemplatePart, VirtualRepeatDirective, WhenDirective } from "./types";

/** Persistent root render parts keyed by container. */
const renderStates = new WeakMap<Node, { part: ReturnType<typeof createChildPart>; dispose: () => void }>();

/**
 * Creates DOM from a tagged template.
 *
 * @param strings - Template strings.
 * @param values - Dynamic values.
 * @returns Rendered document fragment.
 *
 * @example
 * ```ts
 * const view = html`<strong>${name}</strong>`;
 * ```
 */
export function html(strings: TemplateStringsArray, ...values: RenderValue[]): DocumentFragment {
  const compiled = getCompiledTemplate(strings);
  const fragment = compiled.template.content.cloneNode(true) as DocumentFragment;

  applyParts(fragment, compiled.parts, values);

  return fragment;
}

/**
 * Replaces a container content and returns a dispose function.
 *
 * @param container - Target container.
 * @param value - Render value.
 * @returns Dispose callback.
 *
 * @example
 * ```ts
 * const dispose = render(document.body, html`<h1>Hello</h1>`);
 * dispose();
 * ```
 */
export function render(container: Element | DocumentFragment | ShadowRoot, value: RenderValue): () => void {
  let state = renderStates.get(container);

  if (!state) {
    disposeTree(container);
    container.replaceChildren();

    const marker = document.createComment("fabrica:render");
    container.appendChild(marker);

    const part = createChildPart(marker);
    const dispose = (): void => {
      disposeRange(part.start, part.end);
      removeRange(part.start, part.end);
      renderStates.delete(container);
    };

    state = { part, dispose };
    renderStates.set(container, state);
  }

  debugState.reconciliations += 1;
  state.part.set(value);

  return state.dispose;
}

/**
 * Mounts content without clearing the container.
 *
 * @param container - Target container.
 * @param value - Render value.
 * @returns Dispose callback.
 */
export function mount(container: Node, value: RenderValue): () => void {
  const start = document.createComment("fabrica:mount:start");
  const end = document.createComment("fabrica:mount:end");

  container.appendChild(start);
  appendValue(container, value);
  container.appendChild(end);

  return () => {
    disposeRange(start, end);
    removeRange(start, end);
  };
}

/**
 * Appends a render value into a parent, optionally before a reference node.
 *
 * @param parentNode - Parent node.
 * @param value - Render value.
 * @param beforeNode - Optional insertion reference.
 */
export function appendValue(parentNode: Node | null, value: RenderValue, beforeNode: Node | null = null): void {
  if (!parentNode) {
    return;
  }

  const resolvedValue = readValue(value) as RenderValue;

  if (resolvedValue == null || resolvedValue === false || resolvedValue === true) {
    return;
  }

  if (isDomBag(resolvedValue)) {
    const elements = resolvedValue.elements;

    for (let index = 0; index < elements.length; index += 1) {
      parentNode.insertBefore(elements[index] as Node, beforeNode);
    }

    return;
  }

  if (Array.isArray(resolvedValue)) {
    for (let index = 0; index < resolvedValue.length; index += 1) {
      appendValue(parentNode, resolvedValue[index], beforeNode);
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
 * Applies compiled parts to a cloned fragment.
 *
 * @param fragment - Cloned fragment.
 * @param parts - Compiled parts.
 * @param values - Runtime values.
 */
function applyParts(fragment: DocumentFragment, parts: readonly TemplatePart[], values: readonly RenderValue[]): void {
  const resolvedParts: Array<{ part: TemplatePart; node: Node }> = [];

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (!part) {
      continue;
    }

    const node = resolvePath(fragment, part.path);

    if (node) {
      resolvedParts.push({ part, node });
    }
  }

  resolvedParts.sort((left, right) => comparePathsReverse(left.part.path, right.part.path));

  for (let index = 0; index < resolvedParts.length; index += 1) {
    const resolved = resolvedParts[index];

    if (!resolved) {
      continue;
    }

    if (resolved.part.type === "child") {
      bindChildPart(resolved.node, values[resolved.part.index]);
    } else {
      bindAttributePart(resolved.node, resolved.part.name, values[resolved.part.index]);
    }
  }
}

/**
 * Binds a child interpolation marker.
 *
 * @param marker - Marker node.
 * @param value - Runtime value.
 */
function bindChildPart(marker: Node, value: RenderValue | undefined): void {
  const part = createChildPart(marker);

  if (hasReactiveValue(value)) {
    const dispose = effect(() => {
      part.set(readValue(value) as RenderValue);
    });

    registerCleanup(part.start, dispose);
    return;
  }

  part.set(value);
}

/**
 * Creates a stable dynamic child part.
 *
 * @param marker - Template marker node.
 * @returns Child part controller.
 */
function createChildPart(marker: Node): { start: Comment; end: Comment; set(value: RenderValue | undefined): void } {
  const start = document.createComment(PART_START);
  const end = document.createComment(PART_END);
  const parentNode = marker.parentNode;

  let currentType = "empty";
  let currentText = "";
  let textNode: Text | null = null;
  let currentNode: Node | null = null;
  let directiveController: DirectiveController | null = null;

  if (parentNode) {
    parentNode.insertBefore(start, marker);
    parentNode.insertBefore(end, marker);
    parentNode.removeChild(marker);
  }

  return {
    start,
    end,
    set(value: RenderValue | undefined): void {
      debugState.updates += 1;

      const resolvedValue = readValue(value) as RenderValue;

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

        for (let index = 0; index < resolvedValue.length; index += 1) {
          appendValue(end.parentNode, resolvedValue[index], end);
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
        appendValue(end.parentNode, template.content, end);
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
        appendValue(end.parentNode, resolvedValue, end);
        currentType = "node";
        currentText = "";
        textNode = null;
        currentNode = resolvedValue;
        return;
      }

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
      appendValue(end.parentNode, textNode, end);
      currentType = "text";
      currentText = nextText;
      currentNode = textNode;
    },
  };
}

/**
 * Binds an attribute interpolation.
 *
 * @param node - Target node.
 * @param rawName - Raw attribute name.
 * @param value - Runtime value.
 */
function bindAttributePart(node: Node, rawName: string, value: RenderValue | undefined): void {
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
    bindEvent(node, rawName.slice(1), value as RenderValue);
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

function bindPlainAttributePart(element: Element, name: string, value: RenderValue | undefined): void {
  let previous: unknown = Symbol("initial");
  let mapState: ReturnType<typeof applyClassMap> | ReturnType<typeof applyStyleMap> | null = null;

  const update = (): void => {
    const next = readValue(value);

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

function bindPropertyPart(element: Element, name: string, value: RenderValue | undefined): void {
  let previous: unknown = Symbol("initial");

  const update = (): void => {
    const next = readValue(value);

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

function bindBooleanAttributePart(element: Element, name: string, value: RenderValue | undefined): void {
  let previous: boolean | null = null;

  const update = (): void => {
    const next = Boolean(readValue(value));

    if (previous === next) {
      return;
    }

    previous = next;

    if (next) {
      element.setAttribute(name, "");
    } else {
      element.removeAttribute(name);
    }
  };

  const dispose = hasReactiveValue(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }
}

function bindConditionalClassPart(element: Element, className: string, value: RenderValue | undefined): void {
  let previous: boolean | null = null;

  const update = (): void => {
    const next = Boolean(readValue(value));

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

function createDirectiveController(start: Comment, end: Comment, directive: Directive): DirectiveController {
  if (directive.kind === "when") {
    return createWhenController(start, end);
  }

  if (directive.kind === "repeat") {
    return createRepeatController(start, end);
  }

  if (directive.kind === "virtualRepeat") {
    return createVirtualRepeatController(start, end);
  }

  return {
    kind: directive.kind,
    update(): void {},
    dispose(): void {
      clearRange(start, end);
    },
  };
}

function createWhenController(start: Comment, end: Comment): DirectiveController {
  let currentDirective: WhenDirective | null = null;
  let disposeEffect: (() => void) | null = null;
  let previousBranch = "";

  return {
    kind: "when",
    update(nextDirective: Directive): void {
      currentDirective = nextDirective as WhenDirective;

      if (disposeEffect) {
        return;
      }

      disposeEffect = effect(() => {
        if (!currentDirective) {
          return;
        }

        const condition = Boolean(readValue(currentDirective.condition));
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

      registerCleanup(start, disposeEffect);
    },
    dispose(): void {
      disposeEffect?.();
      disposeEffect = null;
      clearRange(start, end);
    },
  };
}

function createRepeatController(start: Comment, end: Comment): DirectiveController {
  const records = new Map<PropertyKey, RepeatRecord>();
  let currentDirective: RepeatDirective<unknown, PropertyKey> | null = null;
  let disposeItems: (() => void) | null = null;
  let emptyStart: Comment | null = null;
  let emptyEnd: Comment | null = null;

  const updateList = (): void => {
    if (!currentDirective) {
      return;
    }

    const hasItems = updateRepeat(start, end, records, currentDirective);

    if (!hasItems && currentDirective.empty) {
      if (!emptyStart) {
        emptyStart = document.createComment("fabrica:empty:start");
        emptyEnd = document.createComment("fabrica:empty:end");
        end.parentNode?.insertBefore(emptyStart, end);
        appendValue(end.parentNode, currentDirective.empty(), end);
        end.parentNode?.insertBefore(emptyEnd, end);
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

  return {
    kind: "repeat",
    update(nextDirective: Directive): void {
      currentDirective = nextDirective as RepeatDirective<unknown, PropertyKey>;

      if (disposeItems) {
        return;
      }

      disposeItems = hasReactiveValue(currentDirective.items) ? effect(updateList) : (updateList(), null);

      if (disposeItems) {
        registerCleanup(start, disposeItems);
      }
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

function createVirtualRepeatController(start: Comment, end: Comment): DirectiveController {
  const records = new Map<PropertyKey, RepeatRecord>();
  let currentDirective: VirtualRepeatDirective<unknown, PropertyKey> | null = null;
  let disposeItems: (() => void) | null = null;
  let scroller: HTMLDivElement | null = null;
  let topSpacer: HTMLDivElement | null = null;
  let contentStart: Comment | null = null;
  let contentEnd: Comment | null = null;
  let bottomSpacer: HTMLDivElement | null = null;
  let scrollFrame = 0;

  const ensureNodes = (): void => {
    if (scroller || !end.parentNode || !currentDirective) {
      return;
    }

    scroller = document.createElement("div");
    topSpacer = document.createElement("div");
    bottomSpacer = document.createElement("div");
    contentStart = document.createComment("fabrica:virtual:start");
    contentEnd = document.createComment("fabrica:virtual:end");

    scroller.style.overflow = "auto";
    scroller.style.maxHeight = typeof currentDirective.height === "number" ? `${currentDirective.height}px` : String(currentDirective.height);
    scroller.style.contain = "content";
    topSpacer.style.pointerEvents = "none";
    bottomSpacer.style.pointerEvents = "none";

    scroller.append(topSpacer, contentStart, contentEnd, bottomSpacer);
    end.parentNode.insertBefore(scroller, end);

    scroller.addEventListener("scroll", () => {
      if (scrollFrame) {
        return;
      }

      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        updateWindow();
      });
    }, { passive: true });
  };

  const updateWindow = (): void => {
    if (!currentDirective) {
      return;
    }

    ensureNodes();

    if (!scroller || !topSpacer || !contentStart || !contentEnd || !bottomSpacer) {
      return;
    }

    const resolvedItems = readValue(currentDirective.items);
    const items = Array.isArray(resolvedItems) ? resolvedItems : [];
    const itemHeight = Math.max(1, currentDirective.itemHeight);
    const viewportHeight = scroller.clientHeight || (typeof currentDirective.height === "number" ? currentDirective.height : itemHeight * 12);
    const firstVisible = Math.floor(scroller.scrollTop / itemHeight);
    const visibleCount = Math.ceil(viewportHeight / itemHeight);
    const from = Math.max(0, firstVisible - currentDirective.overscan);
    const to = Math.min(items.length, firstVisible + visibleCount + currentDirective.overscan);
    const visibleItems = items.slice(from, to);

    debugState.virtualWindows += 1;
    topSpacer.style.height = `${from * itemHeight}px`;
    bottomSpacer.style.height = `${Math.max(0, items.length - to) * itemHeight}px`;

    const visibleDirective: RepeatDirective<unknown, PropertyKey> = {
      __kind: "directive",
      kind: "repeat",
      items: visibleItems,
      key: (item, visibleIndex) => currentDirective?.key(item, from + visibleIndex) ?? visibleIndex,
      render: currentDirective.render,
      empty: currentDirective.empty,
    };

    updateRepeat(contentStart, contentEnd, records, visibleDirective);
  };

  return {
    kind: "virtualRepeat",
    update(nextDirective: Directive): void {
      currentDirective = nextDirective as VirtualRepeatDirective<unknown, PropertyKey>;
      ensureNodes();

      if (disposeItems) {
        updateWindow();
        return;
      }

      disposeItems = hasReactiveValue(currentDirective.items) ? effect(updateWindow) : (updateWindow(), null);

      if (disposeItems) {
        registerCleanup(start, disposeItems);
      }
    },
    dispose(): void {
      disposeItems?.();
      disposeItems = null;

      for (const record of records.values()) {
        disposeRange(record.start, record.end);
      }

      records.clear();

      if (scroller) {
        disposeTree(scroller);
        scroller.remove();
      }

      scroller = null;
      topSpacer = null;
      contentStart = null;
      contentEnd = null;
      bottomSpacer = null;
      clearRange(start, end);
    },
  };
}

function updateRepeat(
  start: Comment,
  end: Comment,
  records: Map<PropertyKey, RepeatRecord>,
  directive: RepeatDirective<unknown, PropertyKey>,
): boolean {
  const resolvedItems = readValue(directive.items);
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
      const existing = record;
      batch(() => {
        existing.item.set(item);
        existing.index.set(index);
        existing.key.set(key);
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

function createRepeatRecord(
  item: unknown,
  index: number,
  key: PropertyKey,
  renderItem: (context: { item: ReturnType<typeof signal<unknown>>; index: ReturnType<typeof signal<number>>; key: ReturnType<typeof signal<PropertyKey>> }) => RenderValue,
): RepeatRecord {
  const start = document.createComment("fabrica:item:start");
  const end = document.createComment("fabrica:item:end");
  const context = { item: signal(item), index: signal(index), key: signal(key) };
  const fragment = document.createDocumentFragment();

  fragment.append(start);
  appendValue(fragment, renderItem(context));
  fragment.append(end);

  return { ...context, start, end, fragment };
}
