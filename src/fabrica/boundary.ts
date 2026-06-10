import { signal } from "../broto/reactivity";
import { component } from "./component";
import type { BoundaryOptions, RenderValue } from "./types";

/**
 * Creates an error boundary component.
 *
 * @remarks
 * Boundaries catch synchronous errors thrown while creating child content. They
 * expose a retry callback to the fallback so UI can recover without remounting
 * the whole application. Async resource failures should be rendered from the
 * resource state, while thrown render errors are handled here.
 *
 * @param options - Boundary options.
 * @returns Renderable component output.
 *
 * @example
 * ```ts
 * html`${boundary({
 *   children: () => html`<RiskyPanel />`,
 *   fallback: (error, retry) => html`<button @click=${retry}>Retry</button>`,
 * })}`;
 * ```
 */
export function boundary(options: BoundaryOptions): RenderValue {
  const Boundary = component(function Boundary() {
    const error = signal<unknown>(undefined);
    const version = signal(0);

    const retry = (): void => {
      error.set(undefined);
      version.update((value) => value + 1);
    };

    return () => {
      version();
      const currentError = error();

      if (currentError !== undefined) {
        return options.fallback(currentError, retry);
      }

      try {
        return options.children();
      } catch (caught) {
        options.onError?.(caught);
        error.set(caught);
        return options.fallback(caught, retry);
      }
    };
  });

  return Boundary();
}
