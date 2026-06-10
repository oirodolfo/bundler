# Fábrica Changelog

## Next

- Extracted reactivity ownership into Broto.
- Kept Fábrica focused on HTML, rendering, directives, DOM parts, components and hydration-oriented UI.
- Updated internal imports to consume Broto for renderer bindings and component context ergonomics.
- Removed public signal/effect/computed/batch exports from Fábrica's singleton API.

## 1.1.0

- Added component ownership boundaries powered by Broto.
- Added owned effects, resources, cleanup stack, mount/unmount lifecycle, context and refs.
- Added `boundary()` for render error recovery.
- Added public context helpers: `createContext`, `provide`, `useContext`.
