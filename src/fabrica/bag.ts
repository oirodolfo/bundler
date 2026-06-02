import { SVG_NAMESPACE, SVG_TAGS } from "./constants";
import { applyCss } from "./css";
import { disposeTree } from "./dom-cleanup";
import { html, mount, render } from "./dom";
import { isDomElement } from "./guards";
import { applyProps } from "./props";
import type { CssInput, DomBag, DomBagOptions, RenderValue } from "./types";
import { config } from "./install-state";

/**
 * Creates or queries a fluent DOM bag.
 *
 * @param target - Selector, element, array-like elements, or creation expression.
 * @param root - Query root.
 * @returns DOM bag.
 *
 * @example Query existing elements
 * ```ts
 * $("button")({ disabled: true });
 * ```
 *
 * @example Create on selector miss
 * ```ts
 * $("section.panel").html`<h1>Panel</h1>`.appendTo(document.body);
 * ```
 */
export function $(target: string | Element | ArrayLike<Element>, root: ParentNode = document): DomBag {
  return createDomBag(resolveElements(target, root), { shadow: false, important: false });
}

/**
 * Creates a new element-only bag from a shorthand expression.
 *
 * @param expression - Tag/class/id expression.
 * @returns DOM bag containing one new element.
 *
 * @example
 * ```ts
 * $.create("button.primary#save").html`Save`.appendTo(document.body);
 * ```
 */
$.create = function create(expression: string): DomBag {
  return createDomBag([createElementFromExpression(expression)], { shadow: false, important: false });
};

/**
 * Queries elements only and never creates on miss.
 *
 * @param selector - CSS selector.
 * @param root - Query root.
 * @returns DOM bag.
 */
$.find = function find(selector: string, root: ParentNode = document): DomBag {
  return createDomBag(Array.from(root.querySelectorAll(selector)).filter(isDomElement), {
    shadow: false,
    important: false,
  });
};

/** Assign public helpers onto the function object at runtime. */
Object.assign($, { html });

/**
 * Creates the callable bag object.
 *
 * @param elements - Wrapped elements.
 * @param options - Bag options.
 * @returns DOM bag.
 */
export function createDomBag(elements: Element[], options: DomBagOptions): DomBag {
  let renderDisposer: (() => void) | null = null;

  const bag = ((props: Record<string, unknown> = {}): DomBag => {
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];

      if (element) {
        applyProps(element, props);
      }
    }

    return bag;
  }) as DomBag;

  Object.defineProperties(bag, {
    $$fabricaBag: { value: true, enumerable: false },
    elements: { value: elements, enumerable: true },
    el: { value: elements[0] ?? null, enumerable: true },
    count: { value: elements.length, enumerable: true },
    size: { value: elements.length, enumerable: true },
    length: {
      get() {
        return elements.length;
      },
    },
    shadow: {
      get() {
        return createDomBag(elements, { ...options, shadow: true });
      },
    },
    important: {
      get() {
        return createDomBag(elements, { ...options, important: true });
      },
    },
  });

  bag.html = (strings: TemplateStringsArray, ...values: RenderValue[]): DomBag => {
    if (renderDisposer) {
      renderDisposer();
    }

    const disposers: Array<() => void> = [];

    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];

      if (!element) {
        continue;
      }

      const root = options.shadow ? getShadowRoot(element) : element;
      disposers.push(render(root, html(strings, ...values)));
    }

    renderDisposer = () => {
      for (let index = 0; index < disposers.length; index += 1) {
        disposers[index]?.();
      }

      disposers.length = 0;
    };

    return bag;
  };

  bag.mount = (value: RenderValue): (() => void) => {
    const disposers: Array<() => void> = [];

    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];

      if (!element) {
        continue;
      }

      const root = options.shadow ? getShadowRoot(element) : element;
      disposers.push(mount(root, value));
    }

    return () => {
      for (let index = 0; index < disposers.length; index += 1) {
        disposers[index]?.();
      }

      disposers.length = 0;
    };
  };

  bag.css = (input: CssInput, ...values: unknown[]): DomBag => {
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];

      if (element) {
        applyCss(element, input, values, options.important);
      }
    }

    return bag;
  };

  bag.appendTo = (parent: ParentNode): DomBag => {
    parent.append(...elements);
    return bag;
  };

  bag.prependTo = (parent: ParentNode): DomBag => {
    parent.prepend(...elements);
    return bag;
  };

  bag.remove = (): DomBag => {
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];

      if (element) {
        disposeTree(element);
        element.remove();
      }
    }

    return bag;
  };

  bag.dispose = (): DomBag => {
    renderDisposer?.();
    renderDisposer = null;
    return bag;
  };

  return bag;
}

/**
 * Resolves a target into elements.
 *
 * @param target - Selector, element, or array-like elements.
 * @param root - Query root.
 * @returns Resolved elements.
 */
export function resolveElements(target: string | Element | ArrayLike<Element>, root: ParentNode): Element[] {
  if (typeof target === "string") {
    const trimmed = target.trim();

    if (/^<[^<>]+>$/.test(trimmed)) {
      return [createElementFromExpression(trimmed.slice(1, -1))];
    }

    const found = Array.from(root.querySelectorAll(trimmed)).filter(isDomElement);

    if (found.length > 0 || !config.createWhenSelectorMisses || !isCreatableExpression(trimmed)) {
      return found;
    }

    return [createElementFromExpression(trimmed)];
  }

  if (isDomElement(target)) {
    return [target];
  }

  const elements: Element[] = [];

  for (let index = 0; index < target.length; index += 1) {
    const item = target[index];

    if (isDomElement(item)) {
      elements.push(item);
    }
  }

  return elements;
}

/**
 * Creates an element from `tag#id.class` shorthand.
 *
 * @param expression - Element expression.
 * @returns Created element.
 */
export function createElementFromExpression(expression: string): Element {
  const source = expression.trim().replace(/^<|>$/g, "");
  const tagMatch = source.match(/^[a-zA-Z][\w-]*/);
  const tagName = tagMatch?.[0] ?? "div";
  const element = SVG_TAGS.has(tagName) ? document.createElementNS(SVG_NAMESPACE, tagName) : document.createElement(tagName);
  const idMatch = source.match(/#([\w-]+)/);

  if (idMatch?.[1]) {
    element.id = idMatch[1];
  }

  for (const match of source.matchAll(/\.([\w-]+)/g)) {
    const className = match[1];

    if (className) {
      element.classList.add(className);
    }
  }

  return element;
}

/**
 * Checks whether a selector miss is safe to turn into an element.
 *
 * @param value - Selector/expression.
 * @returns Whether the expression is creatable.
 */
function isCreatableExpression(value: string): boolean {
  return /^[a-zA-Z][\w-]*(?:#[\w-]+)?(?:\.[\w-]+)*$/.test(value);
}

/**
 * Gets or creates an open shadow root.
 *
 * @param element - Shadow host.
 * @returns Shadow root.
 */
function getShadowRoot(element: Element): ShadowRoot {
  return element.shadowRoot ?? element.attachShadow({ mode: "open" });
}
