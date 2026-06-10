# Changelog

## 1.0.0

- Added root-entry multi-build pipeline.
- Added IIFE normal and minified output for each root source file.
- Added ESM normal and minified output for each root source file.
- Added generated landing page with fancy typography, gradients, syntax highlighting, and tool metadata cards.
- Added GitHub Actions workflow using Node 24 and pnpm 11.5.1.
- Added optional Gist publishing.
- Added JSX/TSX support through esbuild.

## Unreleased

### Added

- Fabrica now includes configurable signal equality and scheduler configuration for microtask, animation-frame, and idle flushing.
- Added effect flush loop protection to fail loudly on recursive signal write loops instead of silently locking the page.
- Added `virtualRepeat()` for viewport-windowed keyed rendering of large lists.
- Added `html.sanitized()`, `html.trusted()`, and `html.unsafe()` alongside `html.raw()`.
- The generated landing page now extracts `@example` blocks from every source file under each tool package, not just root entry files.

### Changed

- `render()` now keeps a persistent root part per container and reconciles future renders instead of always calling `replaceChildren()`.
- Delegated events now use the element root and `event.composedPath()` so Shadow DOM delegation behaves correctly.
- `classMap()` and `styleMap()` now diff values as well as keys to reduce redundant DOM writes.
- CSS declaration parsing now handles quotes, nested functions, `calc()`, gradients, and optional semicolon edge cases more safely.
- Landing page code blocks now preserve code formatting without forcing long source lines to break badly.

### Security

- Added built-in sanitized HTML entry points and made raw/trusted/unsafe HTML intent clearer.

### Validation

- Source-only TypeScript check passed with a local dependency-free tsconfig.
- Full `pnpm install`, `pnpm typecheck`, and `pnpm build` could not be completed in this sandbox because pnpm/esbuild dependencies were unavailable and registry access failed.

## Fabrica Elements bridge

- Added `src/fabrica-elements` as the shared element/component factory layer used by Cipó and Fábrica.
- Added a new root bundle entry: `src/fabrica-elements.ts`, producing `fabrica-elements.*` outputs with the existing build pipeline.
- Refactored Cipó's styled-component-compatible API to delegate DOM/component creation to `fabrica-elements`.
- Added Fábrica `elements` and `defineElement()` exports backed by `fabrica-elements`.
- Preserved existing public APIs: `cipo.div.css`, `cipo(Component).css`, `cipo(element).css`, `Fabrica.html`, `Fabrica.component`, and all current build entrypoints.
