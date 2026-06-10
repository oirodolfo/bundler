import { batch, computed, effect, memo, signal, untrack } from "../broto/reactivity";
import { createRoot, provide, runWithOwner, useContext } from "../broto/owner";
import { resource } from "../broto/resources";
import { debugState } from "./debug";
import { registerCleanup } from "./dom-cleanup";
import { appendValue } from "./dom";
import { ref } from "./directives";
import type { Cleanup, Component, ComponentContext, RenderValue } from "./types";

let componentId = 0;

/**
 * Creates a reusable UI component with a Broto ownership boundary.
 *
 * @remarks
 * A Fabrica component is not a React-like rerender function. It is an ownership
 * boundary: local effects, resources, refs, event cleanups, context values and
 * lifecycle callbacks are attached to a Broto owner and disposed when the
 * component DOM range is removed.
 *
 * This gives DOM-first components the reasons to exist over direct DOM:
 * lifecycle, cleanup stack, async resource ownership, context propagation,
 * mount/unmount hooks, refs and fine-grained bindings.
 *
 * @param factory - Component factory.
 * @returns Branded component function.
 *
 * @example Local state and fine-grained text binding
 * ```ts
 * const Counter = component(function Counter() {
 *   const count = signal(0);
 *
 *   return html`
 *     <button @click=${() => count.update((value) => value + 1)}>
 *       ${count}
 *     </button>
 *   `;
 * });
 * ```
 *
 * @example Owned resource and cleanup
 * ```ts
 * const Profile = component(function Profile(_props, ctx) {
 *   const profile = ctx.resource((abort) => fetch("/me", { signal: abort }).then((r) => r.json()));
 *
 *   ctx.onUnmount(() => console.log("profile disposed"));
 *
 *   return html`${() => profile().loading ? "Loading" : profile().value?.name}`;
 * });
 * ```
 *
 * @example Context composition
 * ```ts
 * const Theme = createFabricaContext("dark", "Theme");
 * const Provider = component((_props, ctx) => {
 *   ctx.provide(Theme, "forest");
 *   return html`<slot-like-content />`;
 * });
 * ```
 */
export function component<Props extends object = Record<string, never>>(
  factory: (props: Props, context: ComponentContext) => RenderValue,
): Component<Props> {
  const displayName = factory.name || "AnonymousComponent";

  const renderComponent = ((props?: Props): RenderValue => {
    const mountCallbacks: Array<() => void | Cleanup> = [];
    const start = document.createComment(`fabrica:component:${displayName}:start`);
    const end = document.createComment(`fabrica:component:${displayName}:end`);
    const fragment = document.createDocumentFragment();

    let componentDispose: Cleanup | null = null;

    const [content, dispose] = createRoot<RenderValue>((disposeOwner, owner) => {
      const context: ComponentContext = {
        owner,
        id: `fabrica-${++componentId}`,
        signal,
        effect,
        computed,
        memo,
        batch,
        untrack,
        resource,
        onMount(callback) {
          mountCallbacks.push(callback);
        },
        onUnmount(callback) {
          runWithOwner(owner, () => {
            owner.cleanups.push(callback);
          });
        },
        onDispose(callback) {
          runWithOwner(owner, () => {
            owner.cleanups.push(callback);
          });
        },
        provide(contextToken, value) {
          return runWithOwner(owner, () => provide(contextToken, value));
        },
        useContext(contextToken) {
          return runWithOwner(owner, () => useContext(contextToken));
        },
        ref(callback) {
          return ref((node) => {
            const cleanup = callback(node);

            if (typeof cleanup === "function") {
              owner.cleanups.push(cleanup);
            }
          });
        },
      };

      componentDispose = disposeOwner;
      return factory((props ?? {}) as Props, context);
    }, { name: displayName });

    fragment.append(start);
    appendValue(fragment, content);
    fragment.append(end);

    registerCleanup(start, () => {
      componentDispose?.();
      dispose();
      componentDispose = null;
      mountCallbacks.length = 0;
    });

    queueMicrotask(() => {
      if (!start.isConnected) {
        return;
      }

      for (let index = 0; index < mountCallbacks.length; index += 1) {
        const cleanup = mountCallbacks[index]?.();

        if (typeof cleanup === "function") {
          registerCleanup(start, cleanup);
        }
      }

      mountCallbacks.length = 0;
    });

    return fragment;
  }) as Component<Props>;

  Object.defineProperty(renderComponent, "__kind", { value: "component", enumerable: false });
  Object.defineProperty(renderComponent, "displayName", { value: displayName, enumerable: false });
  debugState.components += 1;

  return renderComponent;
}
