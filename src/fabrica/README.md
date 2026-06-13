# Fábrica

Fábrica is the HTML/UI runtime of the Rod browser ecosystem. It owns template parsing, DOM parts, rendering, directives, components, lifecycle hooks, composition and hydration-oriented UI work.

Reactivity lives in **Broto**. Fábrica consumes Broto internally and accepts Broto signals in render values, but state primitives are not owned by Fábrica.

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
 ├── component tags
 ├── context
 ├── lifecycle
 ├── error boundaries
 └── hydration
```

## Basic fine-grained rendering

Input:

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

Output:

```html
<button>Count: 0</button>
```

When `count.set(1)` runs, only the text node is updated.

## Component direct composition

Input:

```ts
const Button = component(function Button(props) {
  return html`
    <button type=${props.type ?? "button"} class=${props.class}>
      ${props.children}
    </button>
  `;
});

render(
  document.body,
  html`${Button({ class: "primary", children: "Save" })}`,
);
```

Output:

```html
<button type="button" class="primary">Save</button>
```

## Component tag composition

Component tags are now enabled. The template compiler turns component tags into hidden template placeholders and passes their content as `props.children`.

Input:

```ts
render(
  document.body,
  html`
    <${Button} class="primary" type="submit">
      Save
    </${Button}>
  `,
);
```

Output:

```html
<button type="submit" class="primary">Save</button>
```

## Micro-JSX string component tags

`html.jsx` enables uppercase component tags inside template strings without Babel, TSX, or a virtual DOM. Components are resolved from a registry. `component(function Name(){})` registers itself automatically under `Name`; minified or anonymous components can be registered manually.

Input:

```ts
const Dock = component(function Dock(props) {
  return html`<button type="button">${props.label}</button>`;
});

render(
  document.body,
  html.jsx`
    <Dock label="Open" />
  `,
);
```

Output:

```html
<button type="button">Open</button>
```

Dynamic props work through normal Fabrica attribute parts:

```ts
const label = signal("Open");

render(document.body, html.jsx`<Dock label=${label} />`);
label.set("Close");
```

For fully parser-safe templates, use the explicit fallback element:

```ts
render(document.body, html.jsx`
  <f-component name="Dock" label="Open" />
`);
```

If a component cannot be resolved, Fabrica renders a visible error element instead of stringifying the component function:

```html
<fabrica-component-error data-fabrica-error="missing-component">
  [Fabrica] Missing component: MissingDock
</fabrica-component-error>
```

Manual registry aliases:

```ts
const TinyDock = component(function Dock() {
  return html`<button>Dock</button>`;
});

registerComponent("TinyDock", TinyDock);
render(document.body, html.jsx`<TinyDock />`);
```

## Dynamic children inside component tags

Input:

```ts
const label = signal("Save");

render(
  document.body,
  html`
    <${Button} class="primary">
      ${label}
    </${Button}>
  `,
);

label.set("Saved");
```

Output before update:

```html
<button class="primary">Save</button>
```

Output after update:

```html
<button class="primary">Saved</button>
```

## Component lifecycle

Input:

```ts
const Clock = component(function Clock(_props, ctx) {
  const now = ctx.signal(Date.now());

  ctx.onMount(() => {
    const id = setInterval(() => now.set(Date.now()), 1000);
    return () => clearInterval(id);
  });

  ctx.onUnmount(() => console.log("clock removed"));

  return html`<time>${now}</time>`;
});
```

Output:

```html
<time>1710000000000</time>
```

When the component range is removed, interval cleanup and unmount cleanup run.

## Owned resources

Input:

```ts
const Profile = component(function Profile(props, ctx) {
  const profile = ctx.resource(
    (abort, id) => fetch(`/users/${id}`, { signal: abort }).then((response) => response.json()),
    { source: () => props.id, cacheKey: (id) => `user:${id}`, retries: 1 },
  );

  return html`${() => {
    const state = profile();
    if (state.loading) return "Loading";
    if (state.error) return "Failed";
    return state.value?.name;
  }}`;
});
```

Output while loading:

```html
Loading
```

Output after success:

```html
Rod
```

When the component unmounts, the request is aborted.

## Context

Input:

```ts
const Theme = createContext("dark", "Theme");

const Provider = component(function Provider(props, ctx) {
  ctx.provide(Theme, "forest");
  return html`${props.children}`;
});

const Consumer = component(function Consumer(_props, ctx) {
  const theme = ctx.useContext(Theme);
  return html`<p>${theme}</p>`;
});

render(document.body, html`
  <${Provider}>
    <${Consumer}></${Consumer}>
  </${Provider}>
`);
```

Output:

```html
<p>forest</p>
```

## Error boundary

Input:

```ts
const Risky = component(function Risky() {
  throw new Error("boom");
});

render(document.body, html`${boundary({
  children: () => html`<${Risky}></${Risky}>`,
  fallback: (error, retry) => html`<button @click=${retry}>Retry</button>`,
})}`);
```

Output:

```html
<button>Retry</button>
```

Boundaries catch synchronous render errors plus Broto owner errors from effects, lifecycle callbacks and resources.

## Refs

Input:

```ts
const FocusInput = component(function FocusInput(_props, ctx) {
  return html`<input ${ctx.ref((node) => (node as HTMLInputElement).focus())}>`;
});
```

Output:

```html
<input>
```

The input receives focus on mount.

## Directives

### `when`

Input:

```ts
html`${when(isOpen, () => html`<p>Open</p>`, () => html`<p>Closed</p>`)}`
```

Output:

```html
<p>Open</p>
```

### `repeat`

Input:

```ts
html`${repeat(items, (item) => item.id, ({ item }) => html`<li>${() => item().label}</li>`)}`
```

Output:

```html
<li>First</li>
<li>Second</li>
```

### `virtualRepeat`

Input:

```ts
html`${virtualRepeat(bigList, (item) => item.id, ({ item }) => html`<div>${() => item().name}</div>`, {
  height: 360,
  itemHeight: 32,
  overscan: 8,
})}`
```

Output shape:

```html
<div style="overflow: auto; max-height: 360px; contain: content;">
  <!-- visible window only -->
</div>
```

## Public API

```ts
html`...`
render(target, value)
mount(target, value)
component(factory)
boundary(options)
createContext(defaultValue, description?)
provide(context, value)
useContext(context)
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

## Why components instead of direct DOM?

Use direct DOM for static one-off nodes. Use components when you need:

- composition
- cleanup ownership
- async cancellation
- error boundaries
- context propagation
- lifecycle hooks
- refs
- fine-grained bindings
- reusable UI contracts

## Preferred micro-JSX entrypoint

`jsx.html` is now the recommended component-template syntax because editors tend to highlight it better than `html.jsx`. The old API stays available.

```ts
const Button = component("Button", function Button(props) {
  return html`<button class=${props.tone}>${props.children}</button>`;
});

render(root, jsx.html`
  <Button tone="primary">Save</Button>
`);
```

Dynamic component props preserve their original runtime value:

```ts
const TabButton = component("TabButton", function TabButton(props) {
  const plugin = props.plugin;
  return html`<button>${() => plugin().title}</button>`;
});

jsx.html`<TabButton plugin=${item} />`;
```

`html.jsx` remains an alias for existing code.
