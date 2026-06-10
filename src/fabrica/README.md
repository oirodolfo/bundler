# Fábrica

Fábrica is the HTML/UI runtime of the Rod browser ecosystem. It owns template parsing, DOM parts, rendering, directives, components, lifecycle hooks and hydration-oriented UI work.

Reactivity now lives in **Broto**. Fábrica consumes Broto internally and accepts Broto signals in render values, but it no longer owns or exports the reactive primitives from its public API.

## Package boundaries

```txt
Broto
 ├── signal
 ├── computed
 ├── effect
 ├── batch
 ├── store
 ├── graph
 ├── scheduler
 ├── async
 └── resources

Fabrica
 ├── html
 ├── template parser
 ├── renderer
 ├── directives
 ├── DOM parts
 ├── components
 └── hydration
```

## Basic usage

```ts
import { signal } from "../broto";
import { html, render } from "../fabrica";

const count = signal(0);

render(
  document.body,
  html`
    <button @click=${() => count.update((value) => value + 1)}>
      Count: ${count}
    </button>
  `,
);
```

## Public API

```ts
html`...`
render(target, value)
mount(target, value)
component(factory)
when(condition, truthy, falsy?)
repeat(items, key, render)
virtualRepeat(items, key, render, options)
ref(callback)
classMap(record)
styleMap(record)
css`...`
elements.div(...)
defineElement(...)
$ bag API
```

## Why signals moved out

Keeping Broto separate makes both packages smaller and clearer:

- Broto can run in DOM-free environments.
- Fábrica can focus on rendering and UI.
- Tests for reactivity no longer need DOM concerns.
- Future renderers can consume the same reactive runtime.

## Compatibility note

Component context still exposes Broto helpers for ergonomics:

```ts
const Counter = component((_props, ctx) => {
  const count = ctx.signal(0);

  return html`${count}`;
});
```

This is pass-through from Broto, not Fábrica-owned state.

## Ownership components

Fabrica components are ownership boundaries, not virtual-DOM rerender containers.
Each component creates a Broto owner. Local effects, resources, refs and lifecycle
callbacks are disposed when the component DOM range is removed.

```ts
const Counter = component(function Counter() {
  const count = signal(0)

  return html`
    <button @click=${() => count.update((value) => value + 1)}>
      ${count}
    </button>
  `
})
```

## Lifecycle

```ts
const Clock = component(function Clock(_props, ctx) {
  const now = ctx.signal(Date.now())

  ctx.onMount(() => {
    const id = setInterval(() => now.set(Date.now()), 1000)
    return () => clearInterval(id)
  })

  ctx.onUnmount(() => console.log('clock removed'))

  return html`<time>${now}</time>`
})
```

## Owned resources

```ts
const Profile = component(function Profile(_props, ctx) {
  const profile = ctx.resource((signal) => {
    return fetch('/me', { signal }).then((response) => response.json())
  })

  return html`${() => profile().loading ? 'Loading' : profile().value?.name}`
})
```

## Context

```ts
const Theme = createContext('dark', 'Theme')

const Provider = component(function Provider(props, ctx) {
  ctx.provide(Theme, 'forest')
  return html`${props.children}`
})

const Consumer = component(function Consumer(_props, ctx) {
  const theme = ctx.useContext(Theme)
  return html`<p>${theme}</p>`
})
```

## Boundary

```ts
html`${boundary({
  children: () => html`<risky-view></risky-view>`,
  fallback: (error, retry) => html`<button @click=${retry}>Retry</button>`,
})}`
```

## Why components instead of direct DOM?

Use direct DOM for static one-off nodes. Use components when you need composition,
cleanup ownership, async cancellation, context, lifecycle, refs or fine-grained bindings.
