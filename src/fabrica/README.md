# FabricaDOM v7 🌿⚙️

A tiny, strongly typed, fine-grained reactive DOM runtime for userscripts, browser widgets, mobile-first panels, and small UI systems that should feel fast instead of theatrical.

FabricaDOM v7 merges two ideas into one implementation:

1. **Fabrica core**: signals, effects, batching, cleanup, directives, keyed lists, templates, lifecycle.
2. **RodDOM bag API**: a small fluent `$()` layer for query/create/render/css/shadow without taking over global `$`.

It is runtime-only. No compiler. No JSX. No VDOM. No prototype patching.

---

## Installation

```bash
npm install @rod/fabricadom
```

```ts
import Fabrica, { $, html, signal } from "@rod/fabricadom";
```

For userscripts, bundle it once or expose the built IIFE in your own CDN/GitHub Pages flow.

---

## Design goals

- **Fine-grained DOM updates**: text nodes are updated in place where possible.
- **Stable ownership**: every dynamic region has comment boundaries and cleanup ownership.
- **Real disposal**: render replacements dispose effects, events, refs, components, and mounted ranges.
- **Performance-first code**: hot paths avoid chained `Object.entries().map().filter()` style allocation confetti.
- **Strong TypeScript**: semantic generic names, clear public types, strict mode.
- **Userscript-friendly**: safe globals, `noConflict()`, `$el` default alias, no forced `$` takeover.
- **Reusable components**: local state, lifecycle, refs, cleanup, slots via `children` props.

---

## Quick start

```ts
import { $, html, signal } from "@rod/fabricadom";

const count = signal(0);

$("body").html`
  <button @click=${() => count.update((value) => value + 1)}>
    Count: ${count}
  </button>
`;
```

---

## API overview

### `signal(initialValue)`

Creates a writable signal.

```ts
const count = signal(0);

count(); // read
count.set(1); // write
count.update((value) => value + 1); // update
count.peek(); // untracked read
```

Signals are callable because calls are cheap and ergonomic inside expressions.

---

### `effect(callback, options?)`

Runs a reactive effect and returns a disposer.

```ts
const stop = effect((onCleanup) => {
  const value = count();
  console.log(value);

  onCleanup(() => {
    console.log("before next run or dispose");
  });
});

stop();
```

Effects clean stale dependencies every run. Conditional dependency changes do not leak subscriptions.

---

### `computed(getter)` / `memo(getter)`

Creates a derived signal.

```ts
const doubled = computed(() => count() * 2);
```

---

### `batch(callback)`

Groups multiple writes into one microtask flush.

```ts
batch(() => {
  firstName.set("Rod");
  lastName.set("Dev");
});
```

---

### `untrack(callback)`

Reads signals without subscribing the current effect.

```ts
const current = untrack(() => count());
```

---

## Template rendering

### `html\`...\``

Creates a `DocumentFragment` from a cached template.

```ts
const view = html`
  <main>
    <h1>Hello ${name}</h1>
  </main>
`;
```

Supported bindings:

```ts
html`
  <input
    title=${title}
    .value=${value}
    ?disabled=${disabled}
    class=${classMap({ active, muted })}
    style=${styleMap({ opacity })}
    @click.prevent.stop=${onClick}
    ref=${ref((node) => node.focus())}
  />
`;
```

Binding types:

| Syntax | Meaning |
|---|---|
| `${value}` | Child/text/node/directive interpolation |
| `attr=${value}` | Attribute binding |
| `.value=${value}` | DOM property binding |
| `?disabled=${value}` | Boolean attribute binding |
| `@click=${handler}` | Event binding |
| `@click.prevent.stop=${handler}` | Event modifiers |
| `class:active=${value}` | Conditional class |
| `ref=${ref(callback)}` | Element ref |

---

### `render(container, value)`

Clears a container, renders content, and returns a disposer.

```ts
const dispose = render(document.body, html`<h1>Hello</h1>`);
dispose();
```

---

### `mount(container, value)`

Appends content without clearing the container.

```ts
const dispose = mount(document.body, html`<button>Extra</button>`);
dispose();
```

---

## Directives

### `when(condition, truthy, falsy?)`

```ts
html`
  ${when(
    open,
    () => html`<section>Open</section>`,
    () => html`<section>Closed</section>`,
  )}
`;
```

The current branch is replaced only when the branch changes.

---

### `repeat(items, key, renderItem, options?)`

Keyed list rendering with DOM movement instead of full recreation.

```ts
const items = signal([
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
]);

html`
  <ul>
    ${repeat(
      items,
      (item) => item.id,
      ({ item, index }) => html`
        <li>${() => index() + 1}. ${() => item().label}</li>
      `,
      { empty: () => html`<li>Empty</li>` },
    )}
  </ul>
`;
```

Each item receives signal-backed context:

- `item()` current item
- `index()` current index
- `key()` current key

---

### `ref(callback)`

```ts
html`<input ref=${ref((node) => node.focus())} />`;
```

Return a function to clean up when the node is disposed.

```ts
html`
  <div
    ref=${ref((node) => {
      const controller = new AbortController();
      node.addEventListener("click", log, { signal: controller.signal });
      return () => controller.abort();
    })}
  ></div>
`;
```

---

### `classMap(map)`

```ts
html`<button class=${classMap({ active, disabled })}>Save</button>`;
```

It diffs previous keys and removes stale classes.

---

### `styleMap(map)`

```ts
html`
  <div style=${styleMap({ opacity: () => open() ? "1" : "0.4" })}></div>
`;
```

It diffs previous keys and removes stale styles.

---

### `rawHtml(value)` / `html.raw(value)`

Explicit raw HTML insertion.

```ts
html`<article>${rawHtml("<strong>Trusted</strong>")}</article>`;
```

Use only with trusted/sanitized content.

---

## Components

Components are plain functions with a lifecycle context.

```ts
const Button = component<{
  label: string;
  onClick: () => void;
  variant?: "primary" | "ghost";
}>(({ label, onClick, variant = "primary" }) => html`
  <button
    class=${classMap({ btn: true, [`btn-${variant}`]: true })}
    @click=${onClick}
  >
    ${label}
  </button>
`);

render(document.body, html`
  ${Button({ label: "Save", onClick: () => alert("Saved") })}
`);
```

### Local state

```ts
const Counter = component(() => {
  const count = signal(0);

  return html`
    <button @click=${() => count.update((value) => value + 1)}>
      ${count}
    </button>
  `;
});
```

### Lifecycle

```ts
const Clock = component((_props, context) => {
  const now = context.signal(Date.now());

  context.onMount(() => {
    const timer = window.setInterval(() => now.set(Date.now()), 1000);
    return () => window.clearInterval(timer);
  });

  context.onDispose(() => {
    console.log("disposed");
  });

  return html`<time>${now}</time>`;
});
```

### Slots through props

```ts
const Card = component<{
  title: string;
  children: RenderValue;
}>(({ title, children }) => html`
  <article class="card">
    <h2>${title}</h2>
    <section>${children}</section>
  </article>
`);

html`
  ${Card({
    title: "Profile",
    children: html`<p>Rod</p>`,
  })}
`;
```

---

## Fluent DOM bag API

### `$()`

```ts
$("button")({
  text: "Save",
  class: "primary",
  attrs: { type: "button" },
  dataset: { action: "save" },
  on: { click: save },
});
```

### `$.create(expression)`

```ts
$.create("button.primary#save")
  .html`Save`
  .appendTo(document.body);
```

### `$.find(selector)`

Query-only, never creates on miss.

```ts
$.find(".card").css({ display: "block" });
```

### `$(element).html\`...\``

```ts
$(document.body).html`
  <main>Hello</main>
`;
```

### Shadow DOM

```ts
$.create("section.panel")
  .shadow.html`
    <style>
      button { color: white; }
    </style>
    <button>Inside shadow</button>
  `
  .appendTo(document.body);
```

### CSS helper

```ts
$("body").css`
  background: #111;
  color: white;
`;

$("body").important.css`
  background: #111;
`;
```

---

## Global safety and `$` collision handling

By default, FabricaDOM installs:

```ts
globalThis.Fabrica = Fabrica;
globalThis.$el = Fabrica.$;
```

It does **not** overwrite `$` by default.

```ts
Fabrica.install({ exposeDollar: true, forceAlias: false });
```

Use a custom alias:

```ts
Fabrica.install({ dollarAlias: "$rod" });
$rod("body").html`<h1>Safe</h1>`;
```

Restore previous globals:

```ts
Fabrica.noConflict();
```

---

## Performance notes

FabricaDOM v7 favors:

- `for` loops in hot paths.
- WeakMap cleanup ownership.
- TemplateStringsArray WeakMap template caching.
- Stable comment boundaries for dynamic parts.
- Text node updates instead of replacement.
- Keyed list movement instead of full list recreation.
- Map diffing for `classMap` and `styleMap`.
- Microtask batching for signal writes.

It intentionally avoids allocation-heavy chains in the renderer, such as nested `Object.entries().map().filter().map()` pipelines.

---

## Tests

```bash
npm test
```

Covered areas:

- signal read/write/update/peek
- effects and cleanup
- stale dependency cleanup
- computed/memo behavior
- batching
- template text rendering
- reactive text update in place
- attributes/properties/boolean attributes
- events and modifiers
- refs and cleanup
- raw HTML
- `when`
- keyed `repeat`
- empty repeat state
- components with local state and lifecycle cleanup
- bag query/create/render/css/shadow/mount

---

## Project structure

```txt
src/
  bag.ts             Fluent $ API and element creation
  component.ts       Reusable components and lifecycle
  constants.ts       Runtime markers and SVG constants
  css.ts             CSS text/declaration helpers
  debug.ts           Debug counters
  directives.ts      when/repeat/ref/classMap/styleMap factories
  dom-cleanup.ts     DOM-owned cleanup registry
  dom.ts             Template application and dynamic parts
  events.ts          Event modifiers and delegation
  guards.ts          Runtime type guards
  index.ts           Public exports and singleton install
  install.ts         Global install/noConflict
  install-state.ts   Mutable config
  maps.ts            classMap/styleMap diffing
  props.ts           Bag object props
  public-api.ts      API assembly
  raw.ts             rawHtml helper
  reactivity.ts      signals/effects/batching
  template.ts        Template compiler
  types.ts           Public/internal types
  value.ts           Reactive value resolution
```

---

## Caveats

- `rawHtml()` is intentionally unsafe unless the caller sanitizes input.
- The inline CSS parser is for declarations, not nested CSS rules. Use a `<style>` tag for full CSS text.
- No compiler means template context detection is still regex-based for attribute position, though improved and covered by tests.


---

## New performance APIs

### `configureScheduler(options)`

```ts
import { configureScheduler } from "@rod/fabricadom";

configureScheduler({ mode: "raf", maxFlushIterations: 500 });
```

Use `"microtask"` for tiny updates, `"raf"` for UI-heavy work, and `"idle"` for background-ish updates.

### `signal(value, { equals })`

```ts
const state = signal({ open: false }, { equals: false });
```

Pass `equals: false` when you intentionally want every `set()` to notify subscribers.

### `virtualRepeat()`

```ts
import { html, signal, virtualRepeat } from "@rod/fabricadom";

const logs = signal(Array.from({ length: 10000 }, (_, id) => ({ id, message: `Log ${id}` })));

const view = html`
  ${virtualRepeat(
    logs,
    (log) => log.id,
    ({ item }) => html`<article>${() => item().message}</article>`,
    { itemHeight: 34, overscan: 10, height: 420 },
  )}
`;
```

### Safer HTML helpers

```ts
html`${html.sanitized(userSuppliedHtml)}`;
html`${html.trusted(serverSanitizedHtml)}`;
html`${html.unsafe(compilerOwnedHtml)}`;
```
