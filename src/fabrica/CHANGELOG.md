# Fábrica Changelog


## Next

- Added official component tag composition: `html`<${Button}>Save</${Button}>``.
- Changed `component()` to return lazy component render requests so context is captured at mount time.
- Added component materialization with ownership boundaries, lifecycle cleanup and child propagation.
- Added component placeholder compilation through `<template data-fabrica-component>`.
- Added dynamic child support inside component tags.
- Added Broto owner error propagation and boundary integration for effects, resources and lifecycle callbacks.
- Upgraded Broto resources with reactive source support, cache keys, retries, timeouts and owner error propagation.
- Added owner-scoped child part effects so fine-grained bindings can be disposed by DOM range lifecycle.

- Extracted reactivity ownership into Broto.
- Kept Fábrica focused on HTML, rendering, directives, DOM parts, components and hydration-oriented UI.
- Updated internal imports to consume Broto for renderer bindings and component context ergonomics.
- Removed public signal/effect/computed/batch exports from Fábrica's singleton API.

## 1.1.0

- Added component ownership boundaries powered by Broto.
- Added owned effects, resources, cleanup stack, mount/unmount lifecycle, context and refs.
- Added `boundary()` for render error recovery.
- Added public context helpers: `createContext`, `provide`, `useContext`.
