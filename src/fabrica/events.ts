import { debugState } from "./debug";
import { registerCleanup } from "./dom-cleanup";
import { isSignal } from "./guards";
import { effect } from "./reactivity";
import type { EventBindingConfig, RenderValue } from "./types";

/** Roots that already have a delegated listener for each event. */
const delegatedEvents = new WeakMap<EventTarget, Set<string>>();

/**
 * Binds an event listener with modifiers.
 *
 * @param element - Target element.
 * @param rawName - Event name and modifiers, without leading @.
 * @param value - Handler or signal of handler.
 * @returns void.
 *
 * @example
 * ```ts
 * bindEvent(button, "click.prevent.stop", onClick);
 * ```
 */
export function bindEvent(element: Element, rawName: string, value: RenderValue): void {
  const eventConfig = parseEventName(rawName);

  if (eventConfig.delegate) {
    bindDelegatedEvent(element, eventConfig, value);
    return;
  }

  let previousHandler: (((event: Event) => void) & { original?: unknown }) | null = null;

  const update = (): void => {
    const handler = isSignal(value) ? value() : value;

    if (previousHandler && previousHandler.original === handler) {
      return;
    }

    if (previousHandler) {
      element.removeEventListener(eventConfig.name, previousHandler, eventConfig.options);
      previousHandler = null;
    }

    if (typeof handler !== "function") {
      return;
    }

    previousHandler = createEventHandler(element, handler as (event: Event) => void, eventConfig);
    element.addEventListener(eventConfig.name, previousHandler, eventConfig.options);
  };

  const dispose = isSignal(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }

  registerCleanup(element, () => {
    if (previousHandler) {
      element.removeEventListener(eventConfig.name, previousHandler, eventConfig.options);
    }
  });
}

/**
 * Parses event modifiers.
 *
 * @param rawName - Raw event name such as `click.prevent.stop`.
 * @returns Parsed event config.
 */
export function parseEventName(rawName: string): EventBindingConfig {
  const parts = rawName.split(".");
  const name = parts.shift() || rawName;
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

/**
 * Creates a listener wrapper that applies modifiers before calling user code.
 *
 * @param element - Bound element.
 * @param handler - User handler.
 * @param eventConfig - Parsed event configuration.
 * @returns Wrapped listener.
 */
function createEventHandler(
  element: Element,
  handler: (event: Event) => void,
  eventConfig: EventBindingConfig,
): ((event: Event) => void) & { original?: unknown } {
  const wrapped = ((event: Event): void => {
    if (eventConfig.prevent && !eventConfig.options.passive) {
      event.preventDefault();
    }

    if (eventConfig.stop) {
      event.stopPropagation();
    }

    handler.call(element, event);
  }) as ((event: Event) => void) & { original?: unknown };

  wrapped.original = handler;
  return wrapped;
}

/**
 * Binds an event through root-level delegation.
 *
 * @param element - Target element.
 * @param eventConfig - Parsed event configuration.
 * @param value - Handler value.
 * @returns void.
 */
function bindDelegatedEvent(element: Element, eventConfig: EventBindingConfig, value: RenderValue): void {
  let previousHandler: ((event: Event) => void) | null = null;
  const target = element as Element & {
    __fabricaDelegatedHandlers?: Record<string, (event: Event) => void>;
  };

  const update = (): void => {
    const handler = isSignal(value) ? value() : value;

    if (typeof handler !== "function") {
      if (target.__fabricaDelegatedHandlers) {
        delete target.__fabricaDelegatedHandlers[eventConfig.name];
      }
      previousHandler = null;
      return;
    }

    const wrapped = createEventHandler(element, handler as (event: Event) => void, eventConfig);

    if (previousHandler && (previousHandler as typeof previousHandler & { original?: unknown }).original === handler) {
      return;
    }

    target.__fabricaDelegatedHandlers ??= {};
    target.__fabricaDelegatedHandlers[eventConfig.name] = wrapped;
    previousHandler = wrapped;
    ensureDelegatedEvent(getDelegationRoot(element), eventConfig.name);
  };

  const dispose = isSignal(value) ? effect(update) : (update(), null);

  if (dispose) {
    registerCleanup(element, dispose);
  }

  registerCleanup(element, () => {
    if (target.__fabricaDelegatedHandlers) {
      delete target.__fabricaDelegatedHandlers[eventConfig.name];
    }
  });
}

/**
 * Gets the best delegation root for a node.
 *
 * @param element - Target element.
 * @returns Event target root.
 *
 * @example
 * ```ts
 * const root = getDelegationRoot(button);
 * ```
 */
function getDelegationRoot(element: Element): Document | ShadowRoot {
  const root = element.getRootNode?.();
  return root instanceof ShadowRoot ? root : element.ownerDocument || document;
}

/**
 * Installs a delegated listener once per root and event name.
 *
 * @param root - Delegation root.
 * @param eventName - Event name.
 * @returns void.
 */
function ensureDelegatedEvent(root: Document | ShadowRoot, eventName: string): void {
  let events = delegatedEvents.get(root);

  if (!events) {
    events = new Set<string>();
    delegatedEvents.set(root, events);
  }

  if (events.has(eventName)) {
    return;
  }

  events.add(eventName);
  debugState.delegatedEvents += 1;

  root.addEventListener(eventName, (event) => {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];

    if (path.length > 0) {
      for (let index = 0; index < path.length; index += 1) {
        const current = path[index];

        if (current === root) {
          return;
        }

        if (runDelegatedHandler(current, eventName, event)) {
          return;
        }
      }

      return;
    }

    let current: Node | null = event.target as Node | null;

    while (current && current !== root) {
      if (runDelegatedHandler(current, eventName, event)) {
        return;
      }

      current = current.parentNode;
    }
  });
}

/**
 * Runs one delegated handler when present.
 *
 * @param current - Current composed path item.
 * @param eventName - Event name.
 * @param event - Runtime event.
 * @returns Whether propagation should stop.
 */
function runDelegatedHandler(current: unknown, eventName: string, event: Event): boolean {
  const handlers = (current as Element & {
    __fabricaDelegatedHandlers?: Record<string, (runtimeEvent: Event) => void>;
  })?.__fabricaDelegatedHandlers;

  const delegatedHandler = handlers?.[eventName];

  if (!delegatedHandler) {
    return false;
  }

  delegatedHandler(event);
  return Boolean(event.cancelBubble);
}
