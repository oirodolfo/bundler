import {
  css,
  inline,
  setup,
  theme,
  registerAlias,
  registerHelper,
  recipe,
  cipo,
  explain,
} from '../src/index'

setup({
  prefix: 'rod',
  layers: true,
  minify: false,
  rem: { enabled: true, baseFontSize: 16 },
  colorMode: 'oklch',
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

theme({ colors: { success: '#84cc16' } })

registerHelper('outlineGlow', (args, context) => `0 0 0 3px ${context.resolveValue(`alpha(${args || '$brand'} / 25%)`)}`)

registerAlias('glassCard', `
  bg: alpha($panel / 72%);
  border: 1px solid alpha($ink / 12%);
  backdrop-filter: blur(18px);
`)

const card = css`
  glassCard;
  px: 4;
  py: 3;
  rounded: $xl;
  shadow: $panel;
  color: $ink;

  text(size: lg, weight: 800, lh: 1.1, color: $ink);

  x:hover {
    bg: alpha($brand / 18%);
  }

  x:md {
    px: 6;
  }
`

const inlineStyle = inline.css`
  px: 2;
  py: 1;
  bg: alpha($brand / 16%);
  color: saturate($brand, 20%);
`

const buttonRecipe = recipe({
  base: 'buttonBase;focusRing;',
  variants: {
    tone: {
      primary: 'bg:$brand;color:$ink;',
      danger: 'bg:$danger;color:white;',
    },
  },
  defaults: { tone: 'primary' },
})

const Button = (cipo as any).button.css`
  buttonBase;
  focusRing;
  bg: $brand;
  color: $ink;
`

console.log(String(card))
console.log(String(inlineStyle))
console.log(String(buttonRecipe({ tone: 'danger' })))
console.log(Button({ children: 'Save' }))
console.log(explain(String(card).split(' ')[0] ?? ''))
