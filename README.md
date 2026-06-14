# Rod Browser Toolbox

Browser-first build system for the Rod ecosystem. The project emits one browser global per root entrypoint, plus ESM/IIFE builds, extracted examples, and a generated landing page.

## Packages

| Root entry | Browser global | Ownership |
|---|---:|---|
| `src/broto.ts` | `window.Broto` | reactive runtime: signal, computed, effect, batch, store, graph, scheduler, async resources |
| `src/fabrica.ts` | `window.Fabrica` | HTML/UI runtime: templates, parser, renderer, directives, DOM parts, components and hydration |
| `src/fabrica-elements.ts` | `window.FabricaElements` | element/component factories: createElement, adapters, props, refs, children, wrappers |
| `src/cipo.ts` | `window.Cipo` | CSS runtime: aliases, tokens, atomic engine, stylesheet compiler |
| `src/index.ts` | `window.Rod` | umbrella namespace exporting Broto, Fabrica, FabricaElements and Cipo |

## Architecture

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

Fabrica Elements
 ├── createElement
 ├── adapters
 ├── props
 ├── refs
 ├── children
 └── component wrappers

Cipo
 ├── css runtime
 ├── aliases
 ├── tokens
 ├── atomic engine
 └── stylesheet compiler
```

## Build outputs

```txt
src/broto.ts              -> dist/broto.iife.js              -> window.Broto
src/fabrica.ts            -> dist/fabrica.iife.js            -> window.Fabrica
src/fabrica-elements.ts   -> dist/fabrica-elements.iife.js   -> window.FabricaElements
src/cipo.ts               -> dist/cipo.iife.js               -> window.Cipo
src/index.ts              -> dist/index.iife.js              -> window.Rod
```

Every entry also gets `.iife.min.js`, `.esm.js`, `.esm.min.js`, source maps and build metadata when enabled.

## Commands

```bash
pnpm typecheck
pnpm build
pnpm verify
```

## Example extraction

The builder extracts `@example` blocks from TSDoc. When a single TSDoc comment has multiple examples, the shared summary/remarks text is rendered once for the group instead of being duplicated for every example.

## Landing page

`dist/index.html` uses a responsive forest/mata visual theme with layered gradients, noise, glass panels, modern CSS filters and mobile-safe layouts.

## Fábrica component runtime upgrade

Fábrica now supports deep component composition and ownership-aware rendering.

Input:

```ts
const Button = Fabrica.component(function Button(props) {
  return Fabrica.html`
    <button class=${props.class}>
      ${props.children}
    </button>
  `;
});

Fabrica.render(document.body, Fabrica.html`
  <${Button} class="primary">
    Save
  </${Button}>
`);
```

Output:

```html
<button class="primary">Save</button>
```

The runtime now links DOM ranges to Broto owners, so effects, resources, context, refs, event listeners and lifecycle cleanup are disposed together.

## Fábrica micro-JSX

Fábrica now has a tiny JSX-like syntax inside template strings. It is still browser-native: no Babel, no AST transform, no virtual DOM.

Input:

```ts
const Dock = Fabrica.component(function Dock() {
  return Fabrica.html`<button>Open</button>`;
});

Fabrica.render(document.body, Fabrica.html.jsx`
  <Dock />
`);
```

Output:

```html
<button>Open</button>
```

For explicit parser-safe composition:

```ts
Fabrica.render(document.body, Fabrica.html.jsx`
  <f-component name="Dock" />
`);
```

Unregistered components render a visible `<fabrica-component-error>` fallback, which makes broken names obvious during userscript debugging.

## Error boundaries and owned async resources

Input:

```ts
const Profile = Fabrica.component(function Profile(props, ctx) {
  const profile = ctx.resource(
    (abort, id) => fetch(`/users/${id}`, { signal: abort }).then((r) => r.json()),
    { source: () => props.id, cacheKey: (id) => `user:${id}`, retries: 1 },
  );

  return Fabrica.html`${() => profile().loading ? "Loading" : profile().value?.name}`;
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

## Fabrica micro-JSX, preferred syntax

Use `Fabrica.jsx.html` for component templates. It keeps the runtime browser-native and usually gives better syntax highlighting than `html.jsx`.

```ts
const Panel = Fabrica.component("Panel", function Panel(props) {
  return Fabrica.html`<section>${props.children}</section>`;
});

Fabrica.render(document.body, Fabrica.jsx.html`
  <Panel>Inspector</Panel>
`);
```

`Fabrica.html.jsx` still works. Dynamic props on component tags are passed as raw values, so objects, signals and functions are not stringified.
