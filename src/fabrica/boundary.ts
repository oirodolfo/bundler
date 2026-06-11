import { onOwnerError } from "../broto/owner";
import { signal } from "../broto/reactivity";
import { component } from "./component";
import type { BoundaryOptions, RenderValue } from "./types";

/**
 * Creates an error boundary component.
 *
 * @remarks
 * Boundaries now catch render-time errors, effect errors, lifecycle errors and
 * resource errors propagated through the Broto owner graph. The fallback receives
 * the error and a retry callback. Retry clears the error and re-runs the child
 * factory by bumping an internal signal.
 *
 * @param options - Boundary options.
 * @returns Renderable component output.
 *
 * @example Input
 * ```ts
 * html`${boundary({
 *   children: () => html`<${RiskyPanel}></${RiskyPanel}>`,
 *   fallback: (error, retry) => html`<button @click=${retry}>Retry</button>`,
 * })}`;
 * ```
 *
 * @example Output after error
 * ```html
 * <button>Retry</button>
 * ```
 */
export function boundary(options: BoundaryOptions): RenderValue {
  const Boundary = component(function Boundary(_props, ctx) {
    const error = signal<unknown>(undefined);
    const version = signal(0);

    const retry = (): void => {
      error.set(undefined);
      version.update((value) => value + 1);
    };

    ctx.onDispose(onOwnerError((caught) => {
      options.onError?.(caught);
      error.set(caught);
      return true;
    }));

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
