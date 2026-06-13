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

- Added Fabrica `html.jsx` micro-JSX syntax for uppercase registered components without Babel or a virtual DOM.
- Added Fabrica component registry APIs and explicit `<f-component name="...">` fallback composition.
- Added missing component fallback UI so unresolved micro-JSX tags fail visibly and safely.
- Re-exposed Broto signal/effect/computed/batch/resource primitives through `window.Fabrica` for userscript ergonomics.

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

- `npx tsc --noEmit` passed after installing project dependencies.
- `npm run build --silent` passed and emitted updated IIFE/ESM bundles.
- `npx vitest run` still has 2 pre-existing Cipó expectations failing around stylesheet insertion/alias output; these failures are unrelated to the Fabrica micro-JSX changes.

## Fabrica Elements bridge

- Added `src/fabrica-elements` as the shared element/component factory layer used by Cipó and Fábrica.
- Added a new root bundle entry: `src/fabrica-elements.ts`, producing `fabrica-elements.*` outputs with the existing build pipeline.
- Refactored Cipó's styled-component-compatible API to delegate DOM/component creation to `fabrica-elements`.
- Added Fábrica `elements` and `defineElement()` exports backed by `fabrica-elements`.
- Preserved existing public APIs: `cipo.div.css`, `cipo(Component).css`, `cipo(element).css`, `Fabrica.html`, `Fabrica.component`, and all current build entrypoints.

## 1.1.0 - Ownership runtime, component boundaries and composition

### Added

- Added Broto owner graph primitives: `createRoot`, `createOwner`, `disposeOwner`, `cleanupOwner`, `getOwner`, `runWithOwner`, `onOwnerCleanup`, and `inspectOwnerGraph`.
- Added Broto context primitives: `createContext`, `provide`, and `useContext`.
- Added scheduler utilities: `scheduleTask()` and `flushSync()`.
- Upgraded `resource()` with AbortController ownership, stale state, `.abort()` and automatic disposal when the current owner is disposed.
- Upgraded Fabrica `component()` so every component creates a Broto ownership boundary.
- Added component-owned lifecycle APIs: `onMount`, `onUnmount`, `onDispose`, owned `resource`, owned `effect`, context `provide/useContext`, and ref cleanup.
- Added Fabrica `boundary()` for synchronous render error recovery.
- Added Fabrica public context helpers: `createContext`, `provide`, `useContext`.
- Added Fabrica Elements composition helpers: `cx`, `createRef`, `composeRefs`, and `childrenToArray`.

### Changed

- Effects are now attached to the current Broto owner and dispose nested effects/resources created during previous runs.
- Components now dispose local effects, resources, refs, lifecycle callbacks and async work when their DOM boundary is removed.
- Fabrica remains focused on HTML/UI while Broto owns reactive lifecycle and scheduling.

### Compatibility

- Existing APIs remain available: `signal`, `effect`, `computed`, `resource`, `component`, `html`, `render`, `mount`, `ref`, `repeat`, `virtualRepeat`, `cipo`, and `css`.
- Existing component factories still work. The new context/lifecycle fields are additive.
