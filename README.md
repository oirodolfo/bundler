# Rod Browser Toolbox 🌈⚙️

A mobile-first TypeScript build system that turns every public root entry in `src/` into standalone browser bundles, generated docs, metadata and examples. The repo currently ships three cooperating browser runtimes:

| Entry | Global | Responsibility |
|---|---|---|
| `src/cipo.ts` | `window.Cipo` | CSS DSL, atomic classes, stylesheets, inline styles, tokens, helpers, aliases, recipes |
| `src/fabrica.ts` | `window.Fabrica` | reactive HTML templates, render, signals, directives, fine-grained DOM updates |
| `src/fabrica-elements.ts` | `window.FabricaElements` | shared element/component factories, adapters, prop normalization, class merging |
| `src/seiva-state.ts` | `window.Seiva` | small state primitives and timeline helpers |
| `src/index.ts` | `window.Rod` | aggregate namespace for all packages |

## Public entry rule

Only files directly inside `src/` are public packages:

```txt
src/fabrica.ts           -> dist/fabrica.iife.js           -> window.Fabrica
src/cipo.ts              -> dist/cipo.iife.js              -> window.Cipo
src/fabrica-elements.ts  -> dist/fabrica-elements.iife.js  -> window.FabricaElements
src/seiva-state.ts       -> dist/seiva-state.iife.js       -> window.Seiva
src/index.ts             -> dist/index.iife.js             -> window.Rod
```

Nested files are private implementation details and can use normal ESM imports.

## Output per entry

Each root entry emits four browser files and optional esbuild metadata:

```txt
dist/name.iife.js
dist/name.iife.min.js
dist/name.esm.js
dist/name.esm.min.js
dist/name.0.meta.json
dist/name.1.meta.json
dist/name.2.meta.json
dist/name.3.meta.json
```

The normal and minified builds both keep a generated `@tool` banner comment so the file describes itself when opened on mobile.

## Build commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm verify
```

`pnpm build` also generates:

```txt
dist/manifest.json
dist/index.html
```

The landing page now extracts both:

1. the `@example` code block;
2. the surrounding TSDoc prose/comment for that example.

That means examples in source files become real documentation cards with explanation + input/output code.

## Tool comments

Put metadata at the top of each root entry:

```ts
/**
 * @tool Fabrica
 * @global Fabrica
 * @package fabrica
 * @tags dom reactive templates userscripts
 * @description Fine-grained reactive DOM runtime bundled as a standalone browser global.
 */
export * from './fabrica/index'
```

The landing page reads these comments and generates cards, CDN snippets, userscript snippets and ESM snippets.

## Example comments extracted by the builder

Any TSDoc block can include examples like this:

```ts
/**
 * Creates a semantic Cipó class list.
 *
 * @remarks
 * The prose in this comment is displayed above the extracted example code.
 *
 * @example Atomic component CSS
 * This sentence becomes the example comment in the generated landing page.
 * ```ts
 * const card = css`
 *   px: 4
 *   bg: $panel
 * `
 * ```
 */
```

Generated landing card shape:

```txt
Atomic component CSS
src/cipo/examples/index.ts
Creates a semantic Cipó class list.
The prose in this comment is displayed above the extracted example code.
This sentence becomes the example comment in the generated landing page.

const card = css`...`
```

## Cipó overview

Cipó owns CSS only. It supports:

- `css``...```: atomic/component CSS or full stylesheet mode;
- `inline.css``...```: inline `style="..."` output;
- `setup({ theme })`: runtime config + tokens in one call;
- `$token` inference: `$brand`, `$panel`, `$xl`, `$glow`;
- aliases: `glass; buttonBase; focusRing;`;
- property aliases: `px: 4`, `bg: $brand`, `rounded: $xl`;
- helpers: `alpha(...)`, `gradient(...)`, `fluid(...)`, `spacing(...)`;
- variants: `x:hover`, `x:md`, `x:not(md)`, `x:dark`;
- plugins: `registerAlias`, `registerHelper`, `registerProperty`, `registerVariant`;
- recipes: variant-driven class list generation;
- shadow/local injection via `injectStyle()`;
- debug via `explain()` and `inspect()`.

### Cipó input

```ts
import { css, setup } from './src/cipo'

setup({
  prefix: 'rod',
  theme: {
    colors: { brand: '#f97316', panel: '#0f172a', ink: '#f8fafc' },
    spacing: '0.25rem',
    radius: { xl: '24px' },
  },
})

const card = css`
  glass
  px: 4
  py: 3
  bg: $panel
  color: $ink
  rounded: $xl

  x:hover {
    bg: alpha($brand / 18%)
  }
`
```

### Cipó output shape

```css
@layer cipo.atomic {
  .rod-a-... {
    padding-inline: calc(var(--rod-spacing, 0.25rem) * 4);
  }

  .rod-a-...:hover {
    background: color-mix(in oklch, var(--rod-colors-brand) 18%, transparent);
  }
}
```

## Fábrica overview

Fábrica owns reactive HTML and DOM rendering. It supports:

- `signal`, `computed`, `effect`, `batch`, `untrack`;
- `html``...`` template rendering;
- event bindings like `@click.prevent.stop=${handler}`;
- property bindings like `.value=${value}`;
- boolean bindings like `?disabled=${disabled}`;
- class/style maps;
- refs, lifecycle, keyed lists and cleanup;
- a fluent DOM bag API through `$()`.

```ts
import { $, html, signal } from './src/fabrica'

const count = signal(0)

$('body').html`
  <button @click=${() => count.update((value) => value + 1)}>
    Count: ${count}
  </button>
`
```

## Fabrica Elements overview

`fabrica-elements` is the shared bridge used by Cipó and Fábrica. It owns:

- DOM element creation;
- adapter abstraction for DOM/React/Preact/Solid/payload;
- `class`/`className` merging;
- props, events, refs and children;
- styled factories like `styled.button.css``...`` `;
- element factories like `elements.button({ children: 'Save' })`.

```ts
import { createStyledFactory } from './src/fabrica-elements'
import { css } from './src/cipo'

const styled = createStyledFactory({
  createStyle(strings, values) {
    const artifact = css(strings, ...values)
    if (artifact.kind !== 'cipo.css') throw new Error('Expected atomic CSS')
    return { artifact, className: artifact.className }
  },
})

const Button = styled.button.css`
  buttonBase
  bg: $brand
  color: $ink
`
```

## Userscript snippets

### Cipó

```js
// @require https://OWNER.github.io/REPO/cipo.iife.js
const { css, setup } = window.Cipo
```

### Fábrica

```js
// @require https://OWNER.github.io/REPO/fabrica.iife.js
const { html, render, signal } = window.Fabrica
```

### Fabrica Elements

```js
// @require https://OWNER.github.io/REPO/fabrica-elements.iife.js
const { createElementsFactory } = window.FabricaElements
```

## Generated landing page

The landing page (`dist/index.html`) is generated from:

- root `@tool` comments;
- source `@example` blocks;
- TSDoc summary and `@remarks` comments;
- generated output files.

This turns the source itself into living documentation. If an example is useful, put it near the function that owns the behavior.

## GitHub Actions

The included workflow uses Node 24 and pnpm 11.5.1, then publishes `dist/` to:

- GitHub Actions artifact;
- GitHub Release assets;
- GitHub Pages;
- Optional public Gist when `GIST_TOKEN` exists.

## Current limitations

- The build is root-entry based. Nested packages are implementation modules, not independently published npm packages yet.
- Examples are extracted from TSDoc `@example` fenced blocks. Non-fenced examples still work, but fenced examples are strongly recommended.
- Cipó stylesheet mode is designed for top-level selectors and at-rules. Component-scoped CSS should stay declaration-first.
- Fábrica owns HTML rendering. Cipó's `html``...`` helper is compatibility-only.

## Próximos passos

- Add example snapshot tests for generated landing page blocks.
- Add a docs mode that groups examples by exported symbol.
- Generate `.d.ts` API docs from the same TSDoc comments.
- Extract package-specific docs pages in addition to the root landing page.
- Add build badges and perf budgets to the generated manifest.
