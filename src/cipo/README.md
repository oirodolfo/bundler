# Cipó Next 🌿

Cipó is the CSS owner in the Rod browser toolbox. It provides a semantic CSS DSL, atomic class generation, full stylesheet compilation, inline style compilation, JIT caching, theme tokens, helpers, aliases, recipes and browser-friendly debug tools.

Cipó does **not** own HTML rendering. Fábrica owns reactivity/templates. `fabrica-elements` owns element/component factories. Cipó consumes that bridge for `cipo.div.css``...`` ` and `cipo(Component).css``...`` `.

## Install / import

```ts
import {
  assertAtomicCssArtifact,
  cipo,
  css,
  explain,
  inline,
  injectGlobal,
  injectStyle,
  recipe,
  registerAlias,
  registerHelper,
  registerProperty,
  setup,
  theme,
} from './src/cipo'
```

Userscript:

```js
// @require https://OWNER.github.io/REPO/cipo.iife.js
const { css, inline, setup } = window.Cipo
```

## Setup with theme

Input:

```ts
setup({
  prefix: 'rod',
  layers: true,
  minify: false,
  rem: { enabled: true, baseFontSize: 16 },
  colorMode: 'oklch',
  jit: { enabled: true, cache: true, maxEntries: 3000 },
  theme: {
    colors: {
      brand: '#f97316',
      panel: '#0f172a',
      ink: '#f8fafc',
      danger: '#ef4444',
    },
    spacing: '0.25rem',
    radius: { md: '12px', xl: '24px' },
    shadow: { panel: '0 24px 80px rgb(0 0 0 / 0.35)' },
    text: { sm: '0.875rem', lg: '1.25rem' },
  },
})
```

Output token layer shape:

```css
@layer cipo.tokens {
  :root {
    --rod-colors-brand: #f97316;
    --rod-colors-panel: #0f172a;
    --rod-radius-xl: 1.5rem;
  }
}
```

## Token inference

Input:

```css
bg: $panel
color: $ink
rounded: $xl
shadow: $panel
```

Output shape:

```css
background: var(--rod-colors-panel);
color: var(--rod-colors-ink);
border-radius: var(--rod-radius-xl);
box-shadow: var(--rod-shadow-panel);
```

Explicit namespaces are also supported:

```css
bg: $colors.panel
rounded: $radius.xl
```

Legacy `$theme.colors.panel` remains supported for compatibility.

## Atomic/component mode

Declaration-first CSS returns a class artifact.

Input:

```ts
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

  x:md {
    px: 6
  }
`
```

Output API:

```ts
String(card)
// 'rod-s-... rod-a-... rod-a-...'

card.kind
// 'cipo.css'
```

Output CSS shape:

```css
@layer cipo.atomic {
  .rod-a-... {
    padding-inline: calc(var(--rod-spacing, 0.25rem) * 4);
  }

  .rod-a-...:hover {
    background: color-mix(in oklch, var(--rod-colors-brand) 18%, transparent);
  }

  @media (min-width: 768px) {
    .rod-a-... {
      padding-inline: calc(var(--rod-spacing, 0.25rem) * 6);
    }
  }
}
```

## Full stylesheet mode

A top-level selector returns stylesheet text instead of a class list.

Input:

```ts
const sheet = css`
  .card {
    px: 4
    bg: $panel

    &:hover {
      bg: alpha($brand / 18%)
    }
  }
`
```

Output:

```ts
String(sheet)
// '.card { padding-inline: ...; background: ... } .card:hover { ... }'

sheet.kind
// 'cipo.stylesheet'
```

Use it with:

```ts
injectGlobal(sheet)
injectStyle(shadowRoot, sheet)
```

## Inline style mode

Input:

```ts
const style = inline.css`
  px: 2
  py: 1
  color: saturate($brand, 20%)
  bg: alpha($brand / 14%)
`
```

Output:

```ts
String(style)
// 'padding-inline: ...; padding-block: ...; color: ...; background: ...;'
```

## Aliases

Built-in aliases:

```css
hidden
flex
grid
center
glass
buttonBase
focusRing
interactive
cardSurface
truncate
balance
pretty
gpu
absolute-fill
screen-safe
sr-only
```

Custom alias:

```ts
registerAlias('elevatedPanel', `
  glass
  rounded: $xl
  shadow: $panel
`)

const panel = css`
  elevatedPanel
  px: 4
`
```

## Property aliases

Input:

```css
px: 4
py: 2
gap: 3
bg: $brand
rounded: $xl
```

Output:

```css
padding-inline: calc(var(--rod-spacing, 0.25rem) * 4);
padding-block: calc(var(--rod-spacing, 0.25rem) * 2);
gap: calc(var(--rod-spacing, 0.25rem) * 3);
background: var(--rod-colors-brand);
border-radius: var(--rod-radius-xl);
```

Custom property alias:

```ts
registerProperty('bleed', { property: 'margin-inline', scale: 'spacing' })

css`
  bleed: -4
`
```

## Helpers

Built-ins include:

```css
alpha($brand / 18%)
gradient(linear, to right, $brand, $danger)
fluid(1rem, 2rem, 4vw)
spacing(4)
lighten($brand, 10%)
darken($brand, 10%)
saturate($brand, 20%)
```

Custom helper:

```ts
registerHelper('outlineGlow', (args, context) => {
  return `0 0 0 3px ${context.resolveValue(`alpha(${args || '$brand'} / 25%)`)}`
})

css`
  x:focus-visible {
    box-shadow: outlineGlow($brand)
  }
`
```

## x variants

`x:` is reserved for runtime contexts:

```css
x:hover { bg: alpha($brand / 18%) }
x:focus-visible { outline: 2px solid $brand }
x:md { px: 6 }
x:not(md) { width: 100% }
x:dark { bg: $panel }
```

## Recipes

```ts
const button = recipe({
  base: 'buttonBase;focusRing;',
  variants: {
    tone: {
      primary: 'bg:$brand;color:$ink;',
      danger: 'bg:$danger;color:white;',
    },
  },
  defaults: { tone: 'primary' },
})

button({ tone: 'danger' }).className
```

## DOM factories via Fabrica Elements

```ts
const Button = cipo.button.css`
  buttonBase
  bg: $brand
  color: $ink
`

const node = Button({ children: 'Save' })
```

## Debug

```ts
const card = css`color: $brand`
assertAtomicCssArtifact(card)
const firstClass = card.className.split(' ')[0] ?? ''

explain(firstClass)
getCssText()
```

## Limitations

- Fábrica owns real HTML rendering. Cipó's `html``...`` helper is compatibility-only.
- Full stylesheet mode is selector-first. Declaration-first input stays atomic/component mode.
- Helpers should be value-level functions. Use aliases for declaration-level macros.
- JIT cache is runtime-only; build-time extraction is a future step.

## Next steps

- Generate API reference pages from TSDoc comments.
- Add perf benchmark fixtures for parser/JIT hot paths.
- Add optional static extraction for production builds.
- Add more recipe examples and visual kitchen-sink pages.
