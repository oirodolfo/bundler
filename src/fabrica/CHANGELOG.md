# Changelog

## 7.0.0

### Added

- Full TypeScript rewrite with strict settings.
- Modular source layout by responsibility.
- Fine-grained signal runtime with cleanup and batching.
- Cached template compiler with child and attribute parts.
- DOM-owned cleanup registry.
- Stable dynamic child boundaries.
- `when` directive.
- Keyed `repeat` directive with DOM movement.
- `ref` directive with cleanup.
- `classMap` and `styleMap` diffing.
- Reusable component system with local state and lifecycle context.
- Fluent `$` bag API.
- `$.create`, `$.find`, `.html`, `.mount`, `.css`, `.shadow`, `.important`.
- Safe global install with `$el` default and no `$` overwrite by default.
- `noConflict()` support.
- Vitest test suite covering runtime, DOM, directives, components, and bag API.
- Comprehensive README with API documentation and examples.

### Changed

- Merged the original RodDOM ergonomics into the stronger Fabrica runtime core.
- Replaced object-style signals with callable signals for stronger typing and faster reads.
- Moved repeated DOM cleanup logic into `dom-cleanup.ts`.
- Moved class/style map diff logic into `maps.ts`.

### Security

- Inline string event handlers are intentionally not supported in v7.
- Raw HTML must be explicit through `rawHtml()` or `html.raw()`.

## 7.1.0

### Added

- Configurable signal equality via `signal(value, { equals })`.
- Configurable reactive scheduler via `configureScheduler({ mode })`.
- Effect flush cycle protection for recursive update loops.
- `virtualRepeat()` directive for large keyed lists with viewport windowing.
- Sanitized/trusted/unsafe raw HTML helpers.

### Changed

- `render()` now reuses a persistent root child part instead of always destroying the whole container.
- Delegated events are now Shadow DOM aware through root-level listeners and `composedPath()`.
- CSS declaration parsing now respects quotes and nested function parentheses.
- `classMap()` and `styleMap()` skip unchanged values.
