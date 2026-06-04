# Rod Browser Toolbox 🌈⚙️

A mobile-first TypeScript build system that turns every root file in `src/` into standalone browser bundles.

## Rule

Only files directly inside `src/` are public packages:

```txt
src/fabrica.ts      -> dist/fabrica.iife.js      -> window.Fabrica
src/cipo.ts         -> dist/cipo.iife.js         -> window.Cipo
src/seiva-state.ts  -> dist/seiva-state.iife.js  -> window.Seiva
src/index.ts        -> dist/index.iife.js        -> window.Rod
```

Nested files are private implementation details and can use normal ESM imports.

## Output per entry

Each root entry emits four browser files:

```txt
dist/name.iife.js
dist/name.iife.min.js
dist/name.esm.js
dist/name.esm.min.js
```

The normal and minified builds both keep a generated `@tool` banner comment so the file describes itself when opened on mobile.

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
export * from "./fabrica/index";
```

The landing page reads these comments and generates cards, CDN links, userscript snippets, and ESM snippets.

## JSX / TSX

The build supports `.ts`, `.tsx`, `.js`, `.jsx`, and `.mjs` root entries. Internal imports are bundled by esbuild.

## Commands

```bash
pnpm install
pnpm verify
pnpm build
```

## Userscript

```js
// @require https://OWNER.github.io/REPO/fabrica.iife.js
const { html, render } = window.Fabrica;
```

## GitHub Actions

The included workflow uses Node 24 and pnpm 11.5.1, then publishes `dist/` to:

- GitHub Actions artifact
- GitHub Release assets
- GitHub Pages
- Optional public Gist when `GIST_TOKEN` exists
