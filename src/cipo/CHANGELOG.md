# Changelog

## 1.1.0

- Preserved the previous Cipó API.
- Added modular architecture by responsibility.
- Added `configure({ theme })` and `setup()`.
- Added `$token` inference without `$theme` requirement.
- Added `registerAlias`, `registerHelper`, `registerProperty`, `registerVariant` and `recipe`.
- Added runtime JIT cache for CSS and inline CSS.
- Added `inline.css` template/object API.
- Added cascade layers, pretty output and minify mode.
- Added REM conversion by default.
- Added modern helper set for colors, gradients, fluid values and spacing.
- Added aliases for layout, flex, grid, effects, typography and daily utilities.

## 1.1.1

- Fixed the hot helper resolver so nested helpers like `outlineGlow($brand)` and `alpha($brand / 14%)` no longer recurse until the browser freezes.
- Added a bounded iterative helper scanner with manual loops and identifier-aware matching for better mobile Safari performance.
- Added support for standalone `$alias` expansion, so `$glassCard` can resolve registered aliases while `$brand` still resolves theme tokens in values.
- Added raw property escape syntax with `#property: value`, enabling `#box-shadow: outlineGlow($brand)` without alias ambiguity.
- Added `bleed`, `bleedX`, `bleedY` spacing aliases for negative spacing ergonomics.
- Added built-in `glassCard` alias for the `$glassCard` example shape.
- Added regression tests for comments, optional semicolons, helpers, x blocks and alias expansion.
