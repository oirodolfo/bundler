import {
  batch,
  computed,
  effect,
  memo,
  signal,
  untrack,
} from "../broto/reactivity";
import {
  createRoot,
  handleOwnerError,
  provide,
  runWithOwner,
  useContext,
} from "../broto/owner";
import { resource } from "../broto/resources";
import { debugState } from "./debug";
import { registerComponent } from "./component-registry";
import { registerCleanup } from "./dom-cleanup";
import { appendValue } from "./dom";
import { ref } from "./directives";
import type {
  Cleanup,
  Component,
  ComponentContext,
  ComponentRenderRequest,
  RenderValue,
} from "./types";

let componentId = 0;

/**
 * Creates a reusable UI component with a Broto ownership boundary.
 *
 * @remarks
 * A Fabrica component is an ownership boundary, not a virtual-DOM rerender
 * function. Calling a component returns a deferred render request. The request
 * is materialized only when appended by the renderer, so parent context and DOM
 * lifecycle are preserved.
 *
 * Component responsibilities:
 *
 * - create an owner for effects/resources/context
 * - run mount/unmount/dispose callbacks deterministically
 * - pass `children` from direct calls or component-tag composition
 * - isolate errors for `boundary()`
 * - keep DOM persistent and update only fine-grained bindings
 *
 * @param factory - Component factory.
 * @returns Branded component function.
 *
 * @example Direct composition input
 * ```ts
 * const Button = component(function Button(props) {
 *   return html`<button class=${props.class}>${props.children}</button>`;
 * });
 *
 * render(app, html`${Button({ class: "primary", children: "Save" })}`);
 * ```
 *
 * @example Direct composition output
 * ```html
 * <button class="primary">Save</button>
 * ```
 *
 * @example Component tag input
 * ```ts
 * render(app, html`
 *   <${Button} class="primary">
 *     Save
 *   </${Button}>
 * `);
 * ```
 *
 * @example Component tag output
 * ```html
 * <button class="primary">Save</button>
 * ```
 *
 * @example Owned resource and cleanup
 * ```ts
 * const Profile = component(function Profile(_props, ctx) {
 *   const profile = ctx.resource((abort) => fetch("/me", { signal: abort }).then((r) => r.json()));
 *   ctx.onUnmount(() => console.log("profile disposed"));
 *   return html`${() => profile().loading ? "Loading" : profile().value?.name}`;
 * });
 * ```
 */
type ComponentFactory<Props extends object> = (
  props: Props & { children?: RenderValue | readonly RenderValue[] },
  context: ComponentContext,
) => RenderValue;

/**
 * Creates a reusable UI component with a Broto ownership boundary.
 *
 * @remarks
 * The preferred form is `component("Name", factory)` because it survives
 * minification and makes `jsx.html` string tags deterministic. The historical
 * `component(function Name(){...})` form still works and auto-registers the
 * function name when present.
 *
 * @example Named, minifier-safe component
 * ```ts
 * const Panel = component("Panel", function Panel(props) {
 *   return html`<section>${props.children}</section>`;
 * });
 *
 * render(root, jsx.html`<Panel>Hi</Panel>`);
 * ```
 *
 * @example Existing shorthand remains supported
 * ```ts
 * const Button = component(function Button() {
 *   return html`<button>Save</button>`;
 * });
 * ```
 */
export function component<Props extends object = Record<string, never>>(
  factory: ComponentFactory<Props>,
): Component<Props>;
export function component<Props extends object = Record<string, never>>(
  name: string,
  factory: ComponentFactory<Props>,
): Component<Props>;
export function component<Props extends object = Record<string, never>>(
  nameOrFactory: string | ComponentFactory<Props>,
  maybeFactory?: ComponentFactory<Props>,
): Component<Props> {
  const explicitName =
    typeof nameOrFactory === "string" ? nameOrFactory.trim() : "";
  const factory = (
    typeof nameOrFactory === "function" ? nameOrFactory : maybeFactory
  ) as ComponentFactory<Props> | undefined;

  if (typeof factory !== "function") {
    throw new TypeError("[Fabrica] component() expects a factory function.");
  }

  const displayName = explicitName || factory.name || "AnonymousComponent";

  const renderComponent = ((
    props?: Props & { children?: RenderValue | readonly RenderValue[] },
  ): ComponentRenderRequest<Props> => ({
    __kind: "componentRender",
    component: renderComponent as Component<Props>,
    props: (props ?? {}) as Props & {
      children?: RenderValue | readonly RenderValue[];
    },
  })) as Component<Props>;

  Object.defineProperty(renderComponent, "__kind", {
    value: "component",
    enumerable: false,
  });
  Object.defineProperty(renderComponent, "displayName", {
    value: displayName,
    enumerable: false,
  });
  Object.defineProperty(renderComponent, "factory", {
    value: factory,
    enumerable: false,
  });
  debugState.components += 1;

  if (displayName && displayName !== "AnonymousComponent") {
    registerComponent(displayName, renderComponent);
  }

  return renderComponent;
}

/**
 * Materializes a component render request into a DOM range.
 *
 * @remarks
 * This is intentionally separate from `component()` so component calls are lazy.
 * Lazy component requests make context propagation and component tags possible:
 * the component owner is created when the request is appended inside the current
 * parent owner, not when the user builds a value object.
 *
 * @param request - Deferred component request.
 * @returns DocumentFragment containing component boundary comments and content.
 *
 * @example Input
 * ```ts
 * materializeComponent(Button({ children: "Save" }));
 * ```
 *
 * @example Output shape
 * ```html
 * <!--fabrica:component:Button:start-->
 * <button>Save</button>
 * <!--fabrica:component:Button:end-->
 * ```
 */
export function materializeComponent<Props extends object>(
  request: ComponentRenderRequest<Props>,
): DocumentFragment {
  const displayName =
    request.component.displayName ||
    request.component.factory?.name ||
    "AnonymousComponent";
  const factory = request.component.factory as
    | ((
        props: Props & { children?: RenderValue | readonly RenderValue[] },
        context: ComponentContext,
      ) => RenderValue)
    | undefined;

  if (!factory) {
    throw new Error(`[Fabrica] Component ${displayName} has no factory.`);
  }

  const mountCallbacks: Array<() => void | Cleanup> = [];
  const start = document.createComment(
    `fabrica:component:${displayName}:start`,
  );
  const end = document.createComment(`fabrica:component:${displayName}:end`);
  const fragment = document.createDocumentFragment();

  let componentDispose: Cleanup | null = null;

  const [content, dispose] = createRoot<RenderValue>(
    (disposeOwner, owner) => {
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

      try {
        return factory(request.props, context);
      } catch (error) {
        if (!handleOwnerError(error, owner)) {
          throw error;
        }

        return null;
      }
    },
    { name: displayName },
  );

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
      try {
        const cleanup = mountCallbacks[index]?.();

        if (typeof cleanup === "function") {
          registerCleanup(start, cleanup);
        }
      } catch (error) {
        handleOwnerError(error, null);
      }
    }

    mountCallbacks.length = 0;
  });

  return fragment;
}
