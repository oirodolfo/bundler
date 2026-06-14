import { PART_END, PART_START } from "./constants";
import { debugState } from "./debug";
import { clearRange, disposeRange, disposeTree, moveRangeBefore, registerCleanup, removeRange } from "./dom-cleanup";
import { bindEvent } from "./events";
import { isClassMapDirective, isComponent, isComponentRenderRequest, isCssClassArtifact, isCssTextArtifact, isDirective, isDomBag, isDomElement, isDomNode, isRawHtml, isRefDirective, isRenderablePayload, isSignal, isStyleMapDirective } from "./guards";
import { applyClassMap, applyStyleMap } from "./maps";
import { batch, effect, signal } from "../broto/reactivity";
import { createOwner, disposeOwner, getOwner, runWithOwner } from "../broto/owner";
import { comparePathsReverse, compileParts, getCompiledJsxTemplate, getCompiledTemplate, resolvePath } from "./template";
import { hasReactiveValue, readValue } from "./value";
import { materializeComponent } from "./component";
import { resolveComponent } from "./component-registry";
import type { ComponentRenderRequest, Directive, DirectiveController, RenderValue, RepeatDirective, RepeatRecord, TemplatePart, VirtualRepeatDirective, WhenDirective } from "./types";

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
  const compiled = getCompiledTemplate(strings, values);
  const fragment = compiled.template.content.cloneNode(true) as DocumentFragment;

  applyParts(fragment, compiled.parts, values);

  return fragment;
}

/** Creates DOM from Fabrica micro-JSX syntax. */
(html as typeof html & { jsx: typeof html }).jsx = function jsxTemplate(
  strings: TemplateStringsArray,
  ...values: RenderValue[]
): DocumentFragment {
  const compiled = getCompiledJsxTemplate(strings, values);
  const fragment = compiled.template.content.cloneNode(true) as DocumentFragment;

  applyParts(fragment, compiled.parts, values);

  return fragment;
};

/** JSX-friendly namespace: `jsx.html` keeps editor highlighting pleasant. */
export const jsx = Object.freeze({
  html: (html as typeof html & { jsx: typeof html }).jsx,
});

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

  if (isComponentRenderRequest(resolvedValue)) {
    parentNode.insertBefore(materializeComponent(resolvedValue as ComponentRenderRequest), beforeNode);
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

  if (isRenderablePayload(resolvedValue)) {
    parentNode.insertBefore(materializeRenderablePayload(resolvedValue), beforeNode);
    return;
  }

  if (isDomNode(resolvedValue)) {
    parentNode.insertBefore(resolvedValue, beforeNode);
    return;
  }

  parentNode.insertBefore(document.createTextNode(stringifyRenderableValue(resolvedValue)), beforeNode);
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
  const componentPathSet = new Set<string>();
  const componentPropParts = new Map<string, Array<{ name: string; index: number }>>();

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (part?.type === "component") {
      componentPathSet.add(part.path.join("."));
    }
  }

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];

    if (!part) {
      continue;
    }

    const node = resolvePath(fragment, part.path);

    if (!node) {
      continue;
    }

    if (part.type === "attribute" && componentPathSet.has(part.path.join(".")) && node instanceof HTMLTemplateElement) {
      const key = part.path.join(".");
      const propParts = componentPropParts.get(key) ?? [];
      propParts.push({ name: part.name, index: part.index });
      componentPropParts.set(key, propParts);
      node.removeAttribute(part.name);
      continue;
    }

    resolvedParts.push({ part, node });
  }

  resolvedParts.sort((left, right) => comparePathsReverse(left.part.path, right.part.path));

  for (let index = 0; index < resolvedParts.length; index += 1) {
    const resolved = resolvedParts[index];

    if (!resolved) {
      continue;
    }

    if (resolved.part.type === "child") {
      bindChildPart(resolved.node, values[resolved.part.index]);
    } else if (resolved.part.type === "attribute") {
      bindAttributePart(resolved.node, resolved.part.name, values[resolved.part.index]);
    } else {
      const key = resolved.part.path.join(".");
      bindComponentPart(
        resolved.node,
        resolved.part.index >= 0 ? values[resolved.part.index] : undefined,
        values,
        resolved.part,
        componentPropParts.get(key) ?? [],
      );
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
  const owner = createOwner({ parent: getOwner(), name: "fabrica.childPart" });

  registerCleanup(part.start, () => disposeOwner(owner));

  if (hasReactiveValue(value)) {
    const dispose = runWithOwner(owner, () => effect(() => {
      part.set(readValue(value) as RenderValue);
    }, { name: "fabrica.childBinding" }));

    registerCleanup(part.start, dispose);
    return;
  }

  runWithOwner(owner, () => part.set(value));
}


/**
 * Binds a component placeholder created by `<${Component}>...</${Component}>`.
 *
 * @param node - Template placeholder node.
 * @param value - Component function from the opening interpolation.
 * @param values - All template values for dynamic children inside the component body.
 */
function bindComponentPart(
  node: Node,
  value: RenderValue | undefined,
  values: readonly RenderValue[],
  part?: Extract<TemplatePart, { type: "component" }>,
  dynamicPropParts: Array<{ name: string; index: number }> = [],
): void {
  if (!(node instanceof HTMLTemplateElement)) {
    return;
  }

  const componentName = part?.name || readComponentName(node);
  const componentValue =
    typeof value === "function"
      ? value
      : componentName
        ? resolveComponent(componentName)
        : undefined;

  const marker = document.createComment(
    componentName ? `fabrica:component-tag:${componentName}` : "fabrica:component-tag",
  );
  node.parentNode?.insertBefore(marker, node);
  node.remove();

  const childPart = createChildPart(marker);

  if (typeof componentValue !== "function") {
    childPart.set(createMissingComponentFallback(componentName || "unknown") as RenderValue);
    return;
  }

  const props = {
    ...readStaticComponentProps(node),
    ...readDynamicComponentProps(dynamicPropParts, values),
  };
  const children = node.content.cloneNode(true) as DocumentFragment;
  const childParts = compileParts(children);

  applyParts(children, childParts, values);

  const componentProps = {
    ...props,
    children,
  };
  const output = isComponent(componentValue)
    ? componentValue(componentProps as never)
    : (componentValue as (props: Record<string, unknown>) => RenderValue)(componentProps);

  childPart.set(output as RenderValue);
}

function readComponentName(template: HTMLTemplateElement): string {
  return (
    template.getAttribute("data-fabrica-component-name") ||
    template.getAttribute("name") ||
    ""
  );
}

function createMissingComponentFallback(name: string): HTMLElement {
  const element = document.createElement("fabrica-component-error");
  element.setAttribute("role", "alert");
  element.setAttribute("data-fabrica-error", "missing-component");
  element.setAttribute("data-component", name);
  element.style.cssText = [
    "display:inline-block",
    "padding:6px 8px",
    "border:1px solid #f87171",
    "border-radius:8px",
    "background:#450a0a",
    "color:#fecaca",
    "font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace",
  ].join(";");
  element.textContent = `[Fabrica] Missing component: ${name}`;
  return element;
}

function readDynamicComponentProps(
  propParts: Array<{ name: string; index: number }>,
  values: readonly RenderValue[],
): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (let index = 0; index < propParts.length; index += 1) {
    const prop = propParts[index];

    if (!prop) {
      continue;
    }

    props[normalizeComponentPropName(prop.name)] = values[prop.index];
  }

  return props;
}

function normalizeComponentPropName(name: string): string {
  if (name.startsWith(".")) return name.slice(1);
  if (name.startsWith("?")) return name.slice(1);
  if (name.startsWith(":")) return name.slice(1);
  return name;
}

/**
 * Reads static attributes from a component placeholder.
 *
 * @param template - Component placeholder template.
 * @returns Props object.
 */
function readStaticComponentProps(template: HTMLTemplateElement): Record<string, unknown> {
  const props: Record<string, unknown> = {};

  for (let index = 0; index < template.attributes.length; index += 1) {
    const attribute = template.attributes[index];

    if (
      !attribute ||
      attribute.name === "data-fabrica-component" ||
      attribute.name === "data-fabrica-component-name" ||
      attribute.name === "data-fabrica-explicit-component" ||
      attribute.name === "name"
    ) {
      continue;
    }

    props[attribute.name] = attribute.value;
  }

  return props;
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

      if (isRenderablePayload(resolvedValue)) {
        clearRange(start, end);
        const element = materializeRenderablePayload(resolvedValue);
        appendValue(end.parentNode, element, end);
        currentType = "payload";
        currentText = "";
        textNode = null;
        currentNode = element;
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

      const nextText = stringifyRenderableValue(resolvedValue);

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

    if (isCssClassArtifact(next) && (name === "class" || name === "className")) {
      element.setAttribute("class", next.className);
      previous = next.className;
      return;
    }

    if (isCssTextArtifact(next) && name === "style") {
      const cssText = readCssText(next);
      if (!Object.is(previous, cssText)) {
        (element as HTMLElement).style.cssText = cssText;
        previous = cssText;
      }
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

    element.setAttribute(name, stringifyRenderableValue(next));
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

function materializeRenderablePayload(payload: { tag: string; props?: Record<string, unknown> | null }): Element {
  const element = document.createElement(payload.tag);
  applyRenderableProps(element, payload.props || {});
  return element;
}

function applyRenderableProps(element: Element, props: Record<string, unknown>): void {
  for (const key in props) {
    const value = readValue(props[key] as RenderValue) as unknown;

    if (value == null || value === false) {
      continue;
    }

    if (key === "children") {
      appendValue(element, value as RenderValue);
      continue;
    }

    if (key === "text" || key === "textContent") {
      element.textContent = stringifyRenderableValue(value);
      continue;
    }

    if (key === "html" || key === "innerHTML" || key === "unsafeHTML") {
      element.innerHTML = stringifyRenderableValue(value);
      continue;
    }

    if (key === "class" || key === "className") {
      element.setAttribute("class", stringifyClassValue(value));
      continue;
    }

    if (key === "style") {
      applyStyleValue(element, value);
      continue;
    }

    if (key === "attrs" && value && typeof value === "object") {
      applyRenderableProps(element, value as Record<string, unknown>);
      continue;
    }

    if (key === "dataset" && value && typeof value === "object" && element instanceof HTMLElement) {
      for (const dataKey in value as Record<string, unknown>) {
        const dataValue = readValue((value as Record<string, unknown>)[dataKey] as RenderValue);
        if (dataValue == null) delete element.dataset[dataKey];
        else element.dataset[dataKey] = stringifyRenderableValue(dataValue);
      }
      continue;
    }

    if (key === "ref") {
      if (typeof value === "function") {
        const cleanup = (value as (node: Element) => void | (() => void))(element);
        if (typeof cleanup === "function") registerCleanup(element, cleanup);
      } else if (value && typeof value === "object" && "current" in value) {
        (value as { current: Element | null }).current = element;
      }
      continue;
    }

    if (key === "on" && value && typeof value === "object") {
      for (const eventName in value as Record<string, unknown>) {
        const listener = (value as Record<string, unknown>)[eventName];
        if (typeof listener === "function") element.addEventListener(eventName, listener as EventListener);
      }
      continue;
    }

    if (key.startsWith("on") && typeof value === "function") {
      element.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      continue;
    }

    setPropertyOrAttribute(element, key, value);
  }
}

function setPropertyOrAttribute(element: Element, name: string, value: unknown): void {
  if (value == null || value === false) {
    element.removeAttribute(name);
    if (name in element && typeof (element as unknown as Record<string, unknown>)[name] === "boolean") {
      (element as unknown as Record<string, unknown>)[name] = false;
    }
    return;
  }

  if (value === true) {
    element.setAttribute(name, "");
    if (name in element && typeof (element as unknown as Record<string, unknown>)[name] === "boolean") {
      (element as unknown as Record<string, unknown>)[name] = true;
    }
    return;
  }

  if (!name.startsWith("data-") && !name.startsWith("aria-") && name in element) {
    try {
      (element as unknown as Record<string, unknown>)[name] = value;
      return;
    } catch {
      element.setAttribute(name, stringifyRenderableValue(value));
      return;
    }
  }

  element.setAttribute(name, stringifyRenderableValue(value));
}

function applyStyleValue(element: Element, value: unknown): void {
  if (isCssTextArtifact(value)) {
    (element as HTMLElement).style.cssText = readCssText(value);
    return;
  }

  if (typeof value === "string") {
    element.setAttribute("style", value);
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const style = (element as HTMLElement).style;

  for (const key in value as Record<string, unknown>) {
    const item = readValue((value as Record<string, unknown>)[key] as RenderValue);

    if (item == null || item === false) {
      style.removeProperty(toKebabCase(key));
      continue;
    }

    style.setProperty(key.startsWith("--") ? key : toKebabCase(key), stringifyRenderableValue(item));
  }
}

function stringifyClassValue(value: unknown): string {
  if (isCssClassArtifact(value)) return value.className;
  if (Array.isArray(value)) return value.map(stringifyClassValue).filter(Boolean).join(" ");

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .filter((key) => Boolean((value as Record<string, unknown>)[key]))
      .join(" ");
  }

  return stringifyRenderableValue(value);
}

function stringifyRenderableValue(value: unknown): string {
  if (isCssClassArtifact(value)) return value.className;
  if (isCssTextArtifact(value)) return readCssText(value);
  return String(value ?? "");
}

function readCssText(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const artifact = value as { cssText?: string; compiledCss?: string; toString?: () => string };
  return artifact.cssText || artifact.compiledCss || (typeof artifact.toString === "function" ? artifact.toString() : "");
}

function toKebabCase(value: string): string {
  if (value.startsWith("--")) return value;
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
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
