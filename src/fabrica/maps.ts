import { toKebabCase } from "./css";
import { readValue } from "./value";

/** Previous map keys and values tracked by classMap/styleMap bindings. */
type MapState = {
  keys: Set<string>;
  values: Map<string, unknown>;
};

/**
 * Applies a class map with key and value diffing.
 *
 * @param element - Target element.
 * @param map - Class boolean map.
 * @param state - Previous state.
 * @returns Next state.
 *
 * @example
 * ```ts
 * state = applyClassMap(button, { active: true, muted: false }, state);
 * ```
 */
export function applyClassMap(element: Element, map: Record<string, unknown>, state: MapState | null): MapState {
  const previousKeys = state?.keys ?? new Set<string>();
  const previousValues = state?.values ?? new Map<string, unknown>();
  const nextKeys = new Set<string>();
  const nextValues = new Map<string, unknown>();

  for (const className in map) {
    nextKeys.add(className);
  }

  for (const className of previousKeys) {
    if (!nextKeys.has(className)) {
      element.classList.remove(className);
    }
  }

  for (const className of nextKeys) {
    const next = Boolean(readValue(map[className]));
    nextValues.set(className, next);

    if (previousValues.has(className) && Object.is(previousValues.get(className), next)) {
      continue;
    }

    element.classList.toggle(className, next);
  }

  return { keys: nextKeys, values: nextValues };
}

/**
 * Applies a style map with key/value diffing and !important support.
 *
 * @param element - Target element.
 * @param map - Style value map.
 * @param state - Previous state.
 * @returns Next state.
 *
 * @example
 * ```ts
 * state = applyStyleMap(card, { opacity: "0.8", width: "100px !important" }, state);
 * ```
 */
export function applyStyleMap(element: Element, map: Record<string, unknown>, state: MapState | null): MapState {
  const style = (element as HTMLElement).style;
  const previousKeys = state?.keys ?? new Set<string>();
  const previousValues = state?.values ?? new Map<string, unknown>();
  const nextKeys = new Set<string>();
  const nextValues = new Map<string, unknown>();

  for (const property in map) {
    nextKeys.add(property);
  }

  for (const property of previousKeys) {
    if (!nextKeys.has(property)) {
      style.removeProperty(toKebabCase(property));
    }
  }

  for (const property of nextKeys) {
    const cssName = toKebabCase(property);
    const value = readValue(map[property]);
    const normalized = normalizeStyleValue(value);
    const signature = normalized ? `${normalized.value}!${normalized.priority}` : null;
    nextValues.set(property, signature);

    if (previousValues.has(property) && Object.is(previousValues.get(property), signature)) {
      continue;
    }

    if (!normalized) {
      style.removeProperty(cssName);
      continue;
    }

    style.setProperty(cssName, normalized.value, normalized.priority);
  }

  return { keys: nextKeys, values: nextValues };
}

/**
 * Normalizes style-map values into DOM setProperty pieces.
 *
 * @param value - Raw style value.
 * @returns Normalized value or null for removal.
 */
function normalizeStyleValue(value: unknown): { value: string; priority: "" | "important" } | null {
  if (value == null || value === false) {
    return null;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  if (/\s*!important\s*$/i.test(text)) {
    return { value: text.replace(/\s*!important\s*$/i, "").trim(), priority: "important" };
  }

  return { value: text, priority: "" };
}
