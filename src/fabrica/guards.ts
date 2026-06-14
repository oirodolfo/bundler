import type {
  ClassMapDirective,
  Component,
  ComponentRenderRequest,
  Directive,
  DomBag,
  CssLikeArtifact,
  RawHtml,
  RenderablePayload,
  RefDirective,
  Signal,
  StyleMapDirective,
} from "./types";

/**
 * Checks whether a value is a FabricaDOM signal.
 *
 * @param value - Unknown value.
 * @returns Whether the value has the signal contract.
 *
 * @example
 * ```ts
 * if (isSignal(value)) {
 *   console.log(value.peek());
 * }
 * ```
 */
export function isSignal(value: unknown): value is Signal<unknown> {
  return (
    typeof value === "function" &&
    typeof (value as Partial<Signal<unknown>>).set === "function" &&
    typeof (value as Partial<Signal<unknown>>).update === "function" &&
    typeof (value as Partial<Signal<unknown>>).peek === "function" &&
    typeof (value as Partial<Signal<unknown>>).subscribe === "function"
  );
}

/**
 * Checks whether a value is a branded component.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a component function.
 *
 * @example
 * ```ts
 * if (isComponent(Header)) {
 *   mount(document.body, Header());
 * }
 * ```
 */
export function isComponent(value: unknown): value is Component {
  return Boolean(value && typeof value === "function" && (value as Component).__kind === "component");
}

/**
 * Checks whether a value is a directive object.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a directive.
 */

/**
 * Checks whether a value is a deferred component render request.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a component render request.
 */
export function isComponentRenderRequest(value: unknown): value is ComponentRenderRequest {
  return Boolean(value && typeof value === "object" && (value as ComponentRenderRequest).__kind === "componentRender");
}

export function isDirective(value: unknown): value is Directive {
  return Boolean(value && typeof value === "object" && (value as Directive).__kind === "directive");
}

/**
 * Checks whether a directive is a ref directive.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a ref directive.
 */
export function isRefDirective(value: unknown): value is RefDirective {
  return isDirective(value) && value.kind === "ref";
}

/**
 * Checks whether a directive is a class map directive.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a class map directive.
 */
export function isClassMapDirective(value: unknown): value is ClassMapDirective {
  return isDirective(value) && value.kind === "classMap";
}

/**
 * Checks whether a directive is a style map directive.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a style map directive.
 */
export function isStyleMapDirective(value: unknown): value is StyleMapDirective {
  return isDirective(value) && value.kind === "styleMap";
}

/**
 * Checks whether a value is trusted raw HTML.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a raw HTML wrapper.
 */
export function isRawHtml(value: unknown): value is RawHtml {
  return Boolean(value && typeof value === "object" && (value as RawHtml).__kind === "rawHtml");
}

/**
 * Checks DOM nodes structurally so it works across iframes and userscript worlds.
 *
 * @param value - Unknown value.
 * @returns Whether the value behaves like a DOM Node.
 */
export function isDomNode(value: unknown): value is Node {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Node).nodeType === "number" &&
      typeof (value as Node).nodeName === "string",
  );
}

/**
 * Checks DOM elements structurally so it works across iframes and userscript worlds.
 *
 * @param value - Unknown value.
 * @returns Whether the value behaves like an Element.
 */
export function isDomElement(value: unknown): value is Element {
  return Boolean(value && typeof value === "object" && (value as Element).nodeType === 1 && typeof (value as Element).tagName === "string");
}

/**
 * Checks whether a value is a FabricaDOM bag.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a DOM bag.
 */
export function isDomBag(value: unknown): value is DomBag {
  return Boolean(value && typeof value === "function" && (value as DomBag).$$fabricaBag === true);
}

/**
 * Checks whether a value is a plain object.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a direct Object instance.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && value.constructor === Object);
}

/**
 * Checks whether a value looks like a template strings array.
 *
 * @param value - Unknown value.
 * @returns Whether the value is a tagged-template strings array.
 */
export function isTemplateStringsArray(value: unknown): value is TemplateStringsArray {
  return Array.isArray(value) && "raw" in value;
}


/**
 * Checks whether a value is a Fabrica Elements/Cipó payload.
 *
 * @param value - Unknown value.
 * @returns Whether the value can be materialized as a DOM element.
 */
export function isRenderablePayload(value: unknown): value is RenderablePayload {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as RenderablePayload).tag === "string" &&
      ((value as RenderablePayload).props == null || typeof (value as RenderablePayload).props === "object"),
  );
}

/**
 * Checks whether a value looks like a Cipó class-list artifact.
 *
 * @param value - Unknown value.
 * @returns Whether the value exposes a generated class name.
 */
export function isCssClassArtifact(value: unknown): value is CssLikeArtifact & { className: string } {
  return Boolean(value && typeof value === "object" && typeof (value as CssLikeArtifact).className === "string");
}

/**
 * Checks whether a value looks like a CSS text artifact.
 *
 * @param value - Unknown value.
 * @returns Whether the value exposes CSS text.
 */
export function isCssTextArtifact(value: unknown): value is CssLikeArtifact {
  return Boolean(
    value &&
      typeof value === "object" &&
      (typeof (value as CssLikeArtifact).cssText === "string" || typeof (value as CssLikeArtifact).compiledCss === "string"),
  );
}
