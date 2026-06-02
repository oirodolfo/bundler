import type { Cleanup } from "./types";

/** Cleanups attached to DOM nodes. WeakMap lets the browser collect removed nodes. */
const nodeCleanups = new WeakMap<Node, Cleanup[]>();

/**
 * Registers cleanup on a node.
 *
 * @remarks
 * Dynamic parts attach effect disposers to their boundary comments. Components
 * attach lifecycle disposers to their start boundary. This keeps cleanup tied to
 * real DOM ownership instead of a global registry that slowly turns swampy.
 *
 * @param node - Node that owns the cleanup.
 * @param cleanup - Cleanup callback.
 *
 * @example
 * ```ts
 * registerCleanup(element, () => element.removeEventListener("click", handler));
 * ```
 */
export function registerCleanup(node: Node, cleanup: Cleanup): void {
  let cleanups = nodeCleanups.get(node);

  if (!cleanups) {
    cleanups = [];
    nodeCleanups.set(node, cleanups);
  }

  cleanups.push(cleanup);
}

/**
 * Disposes a node and all descendants.
 *
 * @param node - Root node to dispose.
 *
 * @example
 * ```ts
 * disposeTree(container);
 * container.replaceChildren();
 * ```
 */
export function disposeTree(node: Node): void {
  const cleanups = nodeCleanups.get(node);

  if (cleanups) {
    for (let index = 0; index < cleanups.length; index += 1) {
      cleanups[index]?.();
    }

    cleanups.length = 0;
    nodeCleanups.delete(node);
  }

  const children = node.childNodes;

  for (let index = 0; index < children.length; index += 1) {
    disposeTree(children[index] as Node);
  }
}

/**
 * Disposes an inclusive node range.
 *
 * @param start - Inclusive start boundary.
 * @param end - Inclusive end boundary.
 */
export function disposeRange(start: Node, end: Node): void {
  let current: Node | null = start;

  while (current) {
    const next: Node | null = current.nextSibling;
    disposeTree(current);

    if (current === end) {
      break;
    }

    current = next;
  }
}

/**
 * Clears nodes between two boundary comments while preserving the boundaries.
 *
 * @param start - Start boundary.
 * @param end - End boundary.
 */
export function clearRange(start: Comment, end: Comment): void {
  let current: Node | null = start.nextSibling;

  while (current && current !== end) {
    const next: Node | null = current.nextSibling;
    disposeTree(current);
    current.parentNode?.removeChild(current);
    current = next;
  }
}

/**
 * Removes an inclusive node range.
 *
 * @param start - Inclusive start boundary.
 * @param end - Inclusive end boundary.
 */
export function removeRange(start: Node, end: Node): void {
  let current: Node | null = start;

  while (current) {
    const next: Node | null = current.nextSibling;
    current.parentNode?.removeChild(current);

    if (current === end) {
      break;
    }

    current = next;
  }
}

/**
 * Moves an inclusive range before another node without recreating child nodes.
 *
 * @param start - Range start.
 * @param end - Range end.
 * @param before - Reference node.
 */
export function moveRangeBefore(start: Node, end: Node, before: Node): void {
  const parentNode = before.parentNode;

  if (!parentNode || start === before || end.nextSibling === before) {
    return;
  }

  const fragment = document.createDocumentFragment();
  let current: Node | null = start;

  while (current) {
    const next: Node | null = current.nextSibling;
    fragment.append(current);

    if (current === end) {
      break;
    }

    current = next;
  }

  parentNode.insertBefore(fragment, before);
}
