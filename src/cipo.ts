/**
 * ============================================================================
 * Cipó
 * ============================================================================
 *
 * Atomic CSS Runtime + CSS DSL + Theme Engine + Inline Styles
 *
 * ---------------------------------------------------------------------------
 * CORE
 * ---------------------------------------------------------------------------
 *
 * css`...`
 * injectGlobal`...`
 * theme({...})
 * configure({...})
 *
 * ---------------------------------------------------------------------------
 * ATOMIC CSS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   color: red;
 *   background: black;
 *   padding: 16px;
 * `
 *
 * ---------------------------------------------------------------------------
 * RESPONSIVE VALUES
 * ---------------------------------------------------------------------------
 *
 * css`
 *   width: x:sm(100%);
 *   width: x:md(768px);
 *   width: x:lg(1024px);
 * `
 *
 * css`
 *   font-size:
 *     x:sm(12px),
 *     x:md(14px),
 *     x:lg(16px);
 * `
 *
 * ---------------------------------------------------------------------------
 * RESPONSIVE BLOCKS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   x:sm {
 *     color: red;
 *   }
 *
 *   x:md {
 *     color: blue;
 *   }
 *
 *   x:lg {
 *     color: green;
 *   }
 * `
 *
 * ---------------------------------------------------------------------------
 * NEGATED BREAKPOINTS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   x:not(md) {
 *     display: none;
 *   }
 * `
 *
 * ---------------------------------------------------------------------------
 * DARK MODE
 * ---------------------------------------------------------------------------
 *
 * css`
 *   x:dark {
 *     color: white;
 *     bg: black;
 *   }
 * `
 *
 * ---------------------------------------------------------------------------
 * PSEUDOS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   x:hover {
 *     opacity: .8;
 *   }
 *
 *   x:focus {
 *     outline: none;
 *   }
 *
 *   x:active {}
 *   x:visited {}
 *   x:checked {}
 *   x:disabled {}
 *   x:focus-visible {}
 *   x:focus-within {}
 * `
 *
 * ---------------------------------------------------------------------------
 * SCOPED SELECTORS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   li {
 *     list-style: none;
 *   }
 *
 *   button {}
 *
 *   svg {}
 *
 *   &:hover {}
 *
 *   &::before {}
 *
 *   & > div {}
 *
 *   & + div {}
 * `
 *
 * ---------------------------------------------------------------------------
 * THEME TOKENS
 * ---------------------------------------------------------------------------
 *
 * theme({
 *   colors: {
 *     brand: "#3b82f6",
 *   },
 *   spacing: "0.25rem",
 * });
 *
 * css`
 *   color: $theme.colors.brand;
 *   gap: x:spacing(4);
 * `
 *
 * ---------------------------------------------------------------------------
 * UTILITIES
 * ---------------------------------------------------------------------------
 *
 * css`
 *   @with(
 *     hidden,
 *     block,
 *     flex,
 *     inline-flex,
 *     grid,
 *     center,
 *     items-center,
 *     justify-center
 *   );
 * `
 *
 * ---------------------------------------------------------------------------
 * SPACING
 * ---------------------------------------------------------------------------
 *
 * css`
 *   p(16px);
 *   px(16px);
 *   py(16px);
 *
 *   m(16px);
 *   mx(16px);
 *   my(16px);
 *
 *   pt(16px);
 *   pr(16px);
 *   pb(16px);
 *   pl(16px);
 *
 *   mt(16px);
 *   mr(16px);
 *   mb(16px);
 *   ml(16px);
 * `
 *
 * ---------------------------------------------------------------------------
 * SIZE
 * ---------------------------------------------------------------------------
 *
 * css`
 *   w(100%);
 *   h(50px);
 *
 *   size(48px);
 *
 *   x:size(64px);
 * `
 *
 * ---------------------------------------------------------------------------
 * BORDER
 * ---------------------------------------------------------------------------
 *
 * css`
 *   rounded(12px);
 *
 *   rounded(sm);
 *   rounded(md);
 *   rounded(lg);
 *   rounded(xl);
 *
 *   border(red);
 *   border(1px solid red);
 * `
 *
 * ---------------------------------------------------------------------------
 * COLORS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   bg(red);
 *   bg(#ff0000);
 *
 *   color(white);
 *
 *   color:
 *     x:alpha(red / 50%);
 * `
 *
 * ---------------------------------------------------------------------------
 * COLOR HELPERS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   color:
 *     x:alpha(red / 50%);
 *
 *   color:
 *     x:lighten(red, 20%);
 *
 *   color:
 *     x:darken(red, 20%);
 *
 *   color:
 *     x:saturate(red, 20%);
 *
 *   color:
 *     x:desaturate(red, 20%);
 *
 *   color:
 *     x:mix(red, blue, 50%);
 * `
 *
 * ---------------------------------------------------------------------------
 * TEXT
 * ---------------------------------------------------------------------------
 *
 * css`
 *   text(
 *     size: sm,
 *     lh: 2,
 *     color: red
 *   );
 * `
 *
 * css`
 *   text(
 *     size: lg,
 *     lh: 1.5,
 *     weight: 700,
 *     align: center,
 *     transform: uppercase,
 *     decoration: underline,
 *     shadow: 0 2px 4px rgb(0 0 0 / .2)
 *   );
 * `
 *
 * ---------------------------------------------------------------------------
 * GRADIENTS
 * ---------------------------------------------------------------------------
 *
 * css`
 *   bg(
 *     gradient(
 *       linear,
 *       red,
 *       blue
 *     )
 *   );
 * `
 *
 * css`
 *   bg(
 *     gradient(
 *       radial,
 *       white,
 *       black
 *     )
 *   );
 * `
 *
 * ---------------------------------------------------------------------------
 * FLUID VALUES
 * ---------------------------------------------------------------------------
 *
 * css`
 *   font-size:
 *     x:fluid(
 *       1rem,
 *       2rem,
 *       4vw
 *     );
 * `
 *
 * ---------------------------------------------------------------------------
 * REM AUTO CONVERSION
 * ---------------------------------------------------------------------------
 *
 * configure({
 *   rem: true,
 *   remBase: 16,
 * });
 *
 * 16px -> 1rem
 * 32px -> 2rem
 * 48px -> 3rem
 *
 * ---------------------------------------------------------------------------
 * INLINE STYLE DSL
 * ---------------------------------------------------------------------------
 *
 * element.style.css = css.inline`
 *   px: 2;
 *
 *   color:
 *     x:saturate(
 *       $theme.colors.primary,
 *       100%
 *     );
 *
 *   bg:
 *     x:lighten(
 *       $theme.colors.brand,
 *       20%
 *     );
 *
 *   text(
 *     size: sm,
 *     lh: 2,
 *     color: red
 *   );
 * `;
 *
 * ---------------------------------------------------------------------------
 * INLINE OBJECT DSL
 * ---------------------------------------------------------------------------
 *
 * css.inline({
 *   px: 2,
 *   color: "$theme.colors.primary",
 * });
 *
 * ---------------------------------------------------------------------------
 * CSS LAYERS
 * ---------------------------------------------------------------------------
 *
 * @layer reset
 * @layer tokens
 * @layer base
 * @layer components
 * @layer utilities
 * @layer overrides
 *
 * ---------------------------------------------------------------------------
 * GLOBAL CSS
 * ---------------------------------------------------------------------------
 *
 * injectGlobal`
 *   body {
 *     margin: 0;
 *   }
 * `
 *
 * ---------------------------------------------------------------------------
 * DOM API
 * ---------------------------------------------------------------------------
 *
 * cipo.div.css`...`
 *
 * cipo.button.css`...`
 *
 * cipo.section.css`...`
 *
 * ---------------------------------------------------------------------------
 * COMPONENT API
 * ---------------------------------------------------------------------------
 *
 * cipo(MyComponent).css`...`
 *
 * ---------------------------------------------------------------------------
 * INLINE STRING INTERPOLATION
 * ---------------------------------------------------------------------------
 *
 * const card = css`
 *   color: red;
 * `;
 *
 * html`
 *   <div class="${card}">
 * `
 *
 * String(card)
 *
 * `${card}`
 *
 * card.toString()
 *
 * ---------------------------------------------------------------------------
 * DEBUG
 * ---------------------------------------------------------------------------
 *
 * explain(className)
 *
 * getCssText()
 *
 * reset()
 *
 * ---------------------------------------------------------------------------
 * OUTPUT MODES
 * ---------------------------------------------------------------------------
 *
 * configure({
 *   pretty: true,
 * });
 *
 * configure({
 *   minify: true,
 * });
 *
 * ============================================================================
 */
 *
 * This file intentionally keeps the public API from the previous implementation:
 *
 * - configure()
 * - css``
 * - html``
 * - theme()
 * - injectGlobal``
 * - explain()
 * - getCssText()
 * - reset()
 * - cipo(element).css``
 * - cipo.div.css``
 * - cipo(Component).css``
 * - browser globals: window.Cipo and window.RodK
 *
 * And adds the new features discussed for 1.0.0:
 *
 * - setup(), as an ergonomic alias for configure().
 * - Pretty CSS output by default, with minify: true opt-in.
 * - Cascade layers by default.
 * - REM conversion by default, configurable with rem.enabled/baseFontSize.
 * - Color helper output mode configuration.
 * - inline.css`` for style="..." output with the same compiler features.
 * - Data-driven property aliases inspired by Tailwind coverage, without adopting
 *   Tailwind class-authoring as the public API.
 * - text(...) helper with size, line-height, color, decoration, shadow, tracking,
 *   weight, align, transform, wrap, underline and gradient fill support.
 * - CSS helpers: spacing(), fluid(), alpha(), lighten(), darken(), saturate(),
 *   gradient(), rem(), size(). The x: prefix remains supported.
 * - Shadow/local style injection through injectStyle().
 *
 * The code is a single-file runtime on purpose. Sections are kept large and
 * explicit to make extraction into modules easy later.
 * ============================================================================
 */

/* ============================================================================
 * Constants
 * ========================================================================== */

const STYLE_ELEMENT_ID = 'cipo-runtime-style';
const HASH_SEED = 5381;
const HASH_MASK = 0xffffffff;
const DEFAULT_PREFIX = 'cipo';
const EMPTY_STRING = '';
const CLASS_PROP = 'class';
const CLASS_NAME_PROP = 'className';
const CHILDREN_PROP = 'children';
const DEFAULT_BASE_FONT_SIZE = 16;
const DEFAULT_SPACING_VALUE = '0.25rem';
const DEFAULT_LAYER_DECLARATION = '@layer cipo.reset, cipo.tokens, cipo.base, cipo.atomic, cipo.scoped, cipo.global, cipo.inline;';

const HTML_TAGS = [
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base',
  'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
  'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del',
  'details', 'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset',
  'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5',
  'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img',
  'input', 'ins', 'kbd', 'label', 'legend', 'li', 'link', 'main', 'map',
  'mark', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol',
  'optgroup', 'option', 'output', 'p', 'picture', 'pre', 'progress', 'q',
  'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'slot',
  'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead',
  'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr',
] as const;

/* ============================================================================
 * Public Types
 * ========================================================================== */

export type CipoPrimitive = string | number | boolean | null | undefined;
export type CipoAdapterName = 'dom' | 'solid' | 'react' | 'preact';
export type CipoHtmlTagName = (typeof HTML_TAGS)[number];
export type CipoAnyRecord = Record<string, unknown>;
export type CipoColorMode = 'oklch' | 'oklab' | 'hsl' | 'rgba' | 'preserve';
export type CipoLayerName = 'reset' | 'tokens' | 'base' | 'atomic' | 'scoped' | 'global' | 'inline';

export type CipoComponent<Props extends CipoAnyRecord = CipoAnyRecord> = (props: Props) => unknown;
export type CipoTarget = Element | string | CipoComponent | ((...args: never[]) => unknown);
export type CipoCssInterpolation = CipoPrimitive | CipoCssArtifact | CipoInlineCssArtifact | CipoStyleObject;

export interface CipoStyleObject {
  readonly [property: string]: string | number | CipoStyleObject | null | undefined;
}

export interface CipoAdapter {
  readonly name?: string;
  readonly classProp: 'class' | 'className';
  mergeProps(props: CipoAnyRecord | null | undefined, className: string): CipoAnyRecord;
  createElement?(tag: string, props: CipoAnyRecord | null | undefined, className: string): unknown;
  wrapComponent?(component: unknown, className: string): CipoComponent;
}

export interface CipoRemConfig {
  readonly enabled?: boolean;
  readonly baseFontSize?: number;
}

export interface CipoColorConfig {
  readonly mode?: CipoColorMode;
}

export interface CipoOutputConfig {
  readonly minify?: boolean;
  readonly layers?: boolean;
  readonly pretty?: boolean;
}

export interface CipoRuntimeConfig {
  readonly prefix?: string;
  readonly debug?: boolean;
  readonly important?: boolean;
  readonly adapter?: CipoAdapterName | CipoAdapter;
  readonly darkSelector?: string;
  readonly breakpoints?: Readonly<Record<string, string | null>>;
  readonly themeRootSelector?: string;
  readonly onWarning?: (warning: CipoWarning) => void;
  readonly minify?: boolean;
  readonly layers?: boolean;
  readonly rem?: boolean | CipoRemConfig;
  readonly baseFontSize?: number;
  readonly colorMode?: CipoColorMode;
  readonly color?: CipoColorConfig;
  readonly output?: CipoOutputConfig;
}

export interface CipoTargetOptions {
  readonly adapter?: CipoAdapterName | CipoAdapter;
}

export interface CipoInjectGlobalOptions {
  readonly important?: boolean;
  readonly layer?: CipoLayerName | false;
}

export interface CipoInjectStyleOptions {
  readonly nonce?: string;
  readonly dedupe?: boolean;
  readonly position?: 'append' | 'prepend';
}

export interface CipoWarning {
  readonly code: string;
  readonly message: string;
  readonly context?: unknown;
}

export interface CipoThemeDefinition {
  readonly [key: string]: string | number | CipoThemeDefinition;
}

export interface CipoAtomicRule {
  readonly id: string;
  readonly className: string;
  readonly property: string;
  readonly value: string;
  readonly context: CipoRuleContext;
  readonly source: string;
}

export interface CipoScopedRule {
  readonly selector: string;
  readonly declarations: readonly CipoDeclarationNode[];
  readonly context: CipoRuleContext;
}

export interface CipoRuleContext {
  readonly breakpoint?: string;
  readonly mediaQuery?: string;
  readonly pseudo?: string;
  readonly dark?: boolean;
  readonly notBreakpoint?: string;
}

export interface CipoCssArtifact {
  readonly kind: 'cipo.css';
  readonly className: string;
  readonly scopeClassName: string;
  readonly atoms: readonly CipoAtomicRule[];
  readonly scopedRules: readonly CipoScopedRule[];
  readonly rawCss: string;
  readonly transformedCss: string;
  readonly compiledCss: string;
  readonly debug: CipoDebugArtifact;
  toString(): string;
  [Symbol.toPrimitive](): string;
  readonly [Symbol.toStringTag]: string;
}

export interface CipoInlineCssArtifact {
  readonly kind: 'cipo.inline-css';
  readonly rawCss: string;
  readonly transformedCss: string;
  readonly cssText: string;
  toString(): string;
  [Symbol.toPrimitive](): string;
  readonly [Symbol.toStringTag]: string;
}

export interface CipoDebugArtifact {
  readonly id: string;
  readonly atoms: readonly CipoAtomicRule[];
  readonly scopedRules: readonly CipoScopedRule[];
  readonly ast: readonly CipoAstNode[];
  readonly warnings: readonly CipoWarning[];
}

export interface CipoExplainResult {
  readonly className: string;
  readonly atom?: CipoAtomicRule;
  readonly css?: string;
  readonly found: boolean;
}

export interface CipoDomStyledResult<ElementType extends Element = Element> {
  readonly element: ElementType;
  readonly artifact: CipoCssArtifact;
  readonly className: string;
}

export interface CipoStyledBuilder<ResultType = unknown> {
  css(strings: TemplateStringsArray, ...values: readonly CipoCssInterpolation[]): ResultType;
}

export interface CipoStyledTagFactory {
  css(strings: TemplateStringsArray, ...values: readonly CipoCssInterpolation[]): CipoComponent;
  attrs(defaultProps: CipoAnyRecord): CipoStyledTagFactory;
}

export interface CipoCallable {
  <ElementType extends Element>(target: ElementType, options?: CipoTargetOptions): CipoStyledBuilder<CipoDomStyledResult<ElementType>>;
  <Props extends CipoAnyRecord>(target: CipoComponent<Props>, options?: CipoTargetOptions): CipoStyledBuilder<CipoComponent<Props>>;
  (target: string, options?: CipoTargetOptions): CipoStyledTagFactory;
  css: typeof css;
  html: typeof html;
  theme: typeof theme;
  configure: typeof configure;
  setup: typeof setup;
  inline: typeof inline;
  injectGlobal: typeof injectGlobal;
  injectStyle: typeof injectStyle;
  explain: typeof explain;
  getCssText: typeof getCssText;
  reset: typeof reset;
  createBrowserGlobal: typeof createBrowserGlobal;
  installBrowserGlobal: typeof installBrowserGlobal;
}

export interface CipoBrowserGlobal {
  readonly cipo: CipoCallable;
  readonly configure: typeof configure;
  readonly setup: typeof setup;
  readonly theme: typeof theme;
  readonly css: typeof css;
  readonly inline: typeof inline;
  readonly html: typeof html;
  readonly injectGlobal: typeof injectGlobal;
  readonly injectStyle: typeof injectStyle;
  readonly explain: typeof explain;
  readonly getCssText: typeof getCssText;
  readonly reset: typeof reset;
  readonly createBrowserGlobal: typeof createBrowserGlobal;
  readonly installBrowserGlobal: typeof installBrowserGlobal;
}

export type CipoAstNode = CipoDeclarationNode | CipoBlockNode | CipoDirectiveNode;

export interface CipoDeclarationNode {
  readonly type: 'declaration';
  readonly property: string;
  readonly value: string;
  readonly source: string;
}

export interface CipoBlockNode {
  readonly type: 'block';
  readonly name: string;
  readonly body: readonly CipoAstNode[];
  readonly source: string;
}

export interface CipoDirectiveNode {
  readonly type: 'directive';
  readonly name: string;
  readonly args: readonly string[];
  readonly source: string;
}

interface CipoRuntimeState {
  config: {
    prefix: string;
    debug: boolean;
    important: boolean;
    adapter: CipoAdapterName | CipoAdapter;
    darkSelector: string;
    themeRootSelector: string;
    breakpoints: Readonly<Record<string, string | null>>;
    onWarning?: (warning: CipoWarning) => void;
    minify: boolean;
    layers: boolean;
    rem: Required<CipoRemConfig>;
    colorMode: CipoColorMode;
  };
  sheet: CSSStyleSheet | null;
  insertedCss: Set<string>;
  atomicCache: Map<string, CipoAtomicRule>;
  debugAtoms: Map<string, CipoAtomicRule>;
  themeKeys: Set<string>;
  warningSink: CipoWarning[];
  layerHeaderInserted: boolean;
}

declare global {
  interface Window {
    Cipo?: CipoBrowserGlobal;
    RodK?: CipoBrowserGlobal;
  }
}

/* ============================================================================
 * Adapters
 * ========================================================================== */

const DOM_ADAPTER: CipoAdapter = {
  name: 'dom',
  classProp: CLASS_PROP,
  mergeProps(props, className) {
    return mergeClassIntoProps(props, CLASS_PROP, className);
  },
  createElement(tag, props, className) {
    return createDomElement(tag, props, className);
  },
  wrapComponent(component, className) {
    return createGenericWrappedComponent(component, className, CLASS_PROP);
  },
};

const SOLID_ADAPTER: CipoAdapter = {
  name: 'solid',
  classProp: CLASS_PROP,
  mergeProps(props, className) {
    return mergeClassIntoProps(props, CLASS_PROP, className);
  },
  wrapComponent(component, className) {
    return createGenericWrappedComponent(component, className, CLASS_PROP);
  },
};

const REACT_ADAPTER: CipoAdapter = {
  name: 'react',
  classProp: CLASS_NAME_PROP,
  mergeProps(props, className) {
    return mergeClassIntoProps(props, CLASS_NAME_PROP, className);
  },
  wrapComponent(component, className) {
    return createGenericWrappedComponent(component, className, CLASS_NAME_PROP);
  },
};

const PREACT_ADAPTER: CipoAdapter = {
  name: 'preact',
  classProp: CLASS_NAME_PROP,
  mergeProps(props, className) {
    return mergeClassIntoProps(props, CLASS_NAME_PROP, className);
  },
  wrapComponent(component, className) {
    return createGenericWrappedComponent(component, className, CLASS_NAME_PROP);
  },
};

/* ============================================================================
 * Runtime State
 * ========================================================================== */

const runtime: CipoRuntimeState = {
  config: {
    prefix: DEFAULT_PREFIX,
    debug: true,
    important: false,
    adapter: 'dom',
    darkSelector: '[data-theme="dark"]',
    themeRootSelector: ':root',
    breakpoints: {
      base: null,
      sm: null,
      md: '(min-width: 768px)',
      lg: '(min-width: 1024px)',
      xl: '(min-width: 1280px)',
      '2xl': '(min-width: 1536px)',
    },
    onWarning: undefined,
    minify: false,
    layers: true,
    rem: {
      enabled: true,
      baseFontSize: DEFAULT_BASE_FONT_SIZE,
    },
    colorMode: 'oklch',
  },
  sheet: null,
  insertedCss: new Set<string>(),
  atomicCache: new Map<string, CipoAtomicRule>(),
  debugAtoms: new Map<string, CipoAtomicRule>(),
  themeKeys: new Set<string>(),
  warningSink: [],
  layerHeaderInserted: false,
};

/* ============================================================================
 * Data Driven Alias Tables
 * ========================================================================== */

type AliasScale = 'spacing' | 'radius' | 'shadow' | 'text' | 'color' | 'none';

interface PropertyAliasDefinition {
  readonly property: string;
  readonly scale: AliasScale;
}

const PROPERTY_ALIASES: Record<string, PropertyAliasDefinition> = {
  p: { property: 'padding', scale: 'spacing' },
  px: { property: 'padding-inline', scale: 'spacing' },
  py: { property: 'padding-block', scale: 'spacing' },
  ps: { property: 'padding-inline-start', scale: 'spacing' },
  pe: { property: 'padding-inline-end', scale: 'spacing' },
  pt: { property: 'padding-top', scale: 'spacing' },
  pr: { property: 'padding-right', scale: 'spacing' },
  pb: { property: 'padding-bottom', scale: 'spacing' },
  pl: { property: 'padding-left', scale: 'spacing' },
  m: { property: 'margin', scale: 'spacing' },
  mx: { property: 'margin-inline', scale: 'spacing' },
  my: { property: 'margin-block', scale: 'spacing' },
  ms: { property: 'margin-inline-start', scale: 'spacing' },
  me: { property: 'margin-inline-end', scale: 'spacing' },
  mt: { property: 'margin-top', scale: 'spacing' },
  mr: { property: 'margin-right', scale: 'spacing' },
  mb: { property: 'margin-bottom', scale: 'spacing' },
  ml: { property: 'margin-left', scale: 'spacing' },
  gap: { property: 'gap', scale: 'spacing' },
  gapx: { property: 'column-gap', scale: 'spacing' },
  gapy: { property: 'row-gap', scale: 'spacing' },
  w: { property: 'width', scale: 'spacing' },
  h: { property: 'height', scale: 'spacing' },
  minw: { property: 'min-width', scale: 'spacing' },
  minh: { property: 'min-height', scale: 'spacing' },
  maxw: { property: 'max-width', scale: 'spacing' },
  maxh: { property: 'max-height', scale: 'spacing' },
  bg: { property: 'background', scale: 'color' },
  bgColor: { property: 'background-color', scale: 'color' },
  'bg-color': { property: 'background-color', scale: 'color' },
  color: { property: 'color', scale: 'color' },
  fill: { property: 'fill', scale: 'color' },
  stroke: { property: 'stroke', scale: 'color' },
  rounded: { property: 'border-radius', scale: 'radius' },
  radius: { property: 'border-radius', scale: 'radius' },
  shadow: { property: 'box-shadow', scale: 'shadow' },
  z: { property: 'z-index', scale: 'none' },
  lh: { property: 'line-height', scale: 'none' },
  leading: { property: 'line-height', scale: 'none' },
  tracking: { property: 'letter-spacing', scale: 'none' },
  opacity: { property: 'opacity', scale: 'none' },
  flex: { property: 'flex', scale: 'none' },
  grid: { property: 'grid-template-columns', scale: 'none' },
  inset: { property: 'inset', scale: 'spacing' },
  top: { property: 'top', scale: 'spacing' },
  right: { property: 'right', scale: 'spacing' },
  bottom: { property: 'bottom', scale: 'spacing' },
  left: { property: 'left', scale: 'spacing' },
};

const TEXT_SIZE_TOKENS = new Set(['xs', 'sm', 'base', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', '8xl', '9xl']);
const RADIUS_TOKENS = new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']);
const SHADOW_TOKENS = new Set(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', 'inner']);

/* ============================================================================
 * Public API
 * ========================================================================== */

/**
 * Configures the runtime while keeping the previous configure() API intact.
 *
 * @param config Runtime options.
 * @returns Nothing.
 *
 * @example
 * configure({ prefix: 'rod', important: true, adapter: 'solid' })
 *
 * @example
 * configure({ minify: true, rem: { enabled: true, baseFontSize: 16 } })
 */
export function configure(config: CipoRuntimeConfig): void {
  const remConfig = normalizeRemConfig(config.rem, config.baseFontSize);

  runtime.config = {
    prefix: config.prefix ?? runtime.config.prefix,
    debug: config.debug ?? runtime.config.debug,
    important: config.important ?? runtime.config.important,
    adapter: config.adapter ?? runtime.config.adapter,
    darkSelector: config.darkSelector ?? runtime.config.darkSelector,
    themeRootSelector: config.themeRootSelector ?? runtime.config.themeRootSelector,
    breakpoints: {
      ...runtime.config.breakpoints,
      ...(config.breakpoints ?? {}),
    },
    onWarning: config.onWarning ?? runtime.config.onWarning,
    minify: config.minify ?? config.output?.minify ?? runtime.config.minify,
    layers: config.layers ?? config.output?.layers ?? runtime.config.layers,
    rem: remConfig ?? runtime.config.rem,
    colorMode: config.colorMode ?? config.color?.mode ?? runtime.config.colorMode,
  };
}

/**
 * Friendly alias for configure(). It exists for the new 1.0 API while keeping
 * configure() fully compatible.
 *
 * @param config Runtime options.
 * @returns Nothing.
 *
 * @example
 * setup({ minify: true, colorMode: 'hsl' })
 */
export function setup(config: CipoRuntimeConfig): void {
  configure(config);
}

/**
 * Registers theme tokens and makes shorthand variables available.
 *
 * @param tokens Theme object.
 * @returns Nothing.
 *
 * @example
 * theme({ colors: { brand: '#22c55e' }, spacing: '0.25rem' })
 */
export function theme(tokens: CipoThemeDefinition): void {
  const pairs = flattenTheme(tokens);
  let declarations = EMPTY_STRING;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const name = pair[0];
    const value = normalizeDeclarationValue('theme-token', String(pair[1]));

    runtime.themeKeys.add(name);
    declarations += createDeclaration('--' + runtime.config.prefix + '-' + name, value);
  }

  insertCss(wrapLayer('tokens', runtime.config.themeRootSelector + '{' + declarations + '}'));
}

/**
 * Main CSS tagged template. It preserves the old API and now also understands
 * aliases, helpers, layers, REM conversion and pretty/minified output settings.
 *
 * @param strings Template strings.
 * @param values Interpolated values.
 * @returns CSS artifact whose string value is the generated class list.
 *
 * @example
 * const card = css`px: 4; bg: $theme.colors.brand;`
 */
export function css(strings: TemplateStringsArray, ...values: readonly CipoCssInterpolation[]): CipoCssArtifact {
  return createCssArtifact(strings, values);
}

/**
 * Minimal HTML tag kept for compatibility. Fábrica owns the real HTML runtime.
 *
 * @param strings Template strings.
 * @param values Interpolated values.
 * @returns HTML string.
 */
export function html(strings: TemplateStringsArray, ...values: readonly unknown[]): string {
  let output = EMPTY_STRING;

  for (let index = 0; index < strings.length; index += 1) {
    output += strings[index];

    if (index < values.length) {
      const value = values[index];
      output += Array.isArray(value) ? value.join(EMPTY_STRING) : String(value ?? EMPTY_STRING);
    }
  }

  return output;
}

/**
 * Inline CSS namespace. inline.css`` preserves editor CSS syntax highlighting
 * and produces a string-safe artifact for style={...} / style="..." usage.
 */
export const inline = {
  /**
   * Compiles a style string with the same features as css`` but returns inline
   * declarations instead of classes.
   *
   * @param strings Template strings.
   * @param values Interpolated values.
   * @returns Inline CSS artifact.
   *
   * @example
   * const style = inline.css`px: 2; color: saturate($colors.primary, 100%);`
   */
  css(strings: TemplateStringsArray, ...values: readonly CipoCssInterpolation[]): CipoInlineCssArtifact {
    const warnings: CipoWarning[] = [];
    const rawCss = buildCss(strings, values);
    const transformedCss = transformCss(rawCss, warnings);
    const ast = parseStylesheet(transformedCss, warnings);
    const declarations = collectInlineDeclarations(ast, warnings);
    const cssText = formatInlineDeclarations(declarations);

    return {
      kind: 'cipo.inline-css',
      rawCss,
      transformedCss,
      cssText,
      toString: () => cssText,
      [Symbol.toPrimitive]: () => cssText,
      [Symbol.toStringTag]: 'CipoInlineCssArtifact',
    };
  },
};

/**
 * Injects global CSS while preserving the previous overloads.
 */
export function injectGlobal(strings: TemplateStringsArray, ...values: readonly CipoCssInterpolation[]): string;
export function injectGlobal(options: CipoInjectGlobalOptions, cssText: string): string;
export function injectGlobal(artifact: CipoCssArtifact, ...artifacts: readonly CipoCssArtifact[]): string;
export function injectGlobal(
  first: TemplateStringsArray | CipoInjectGlobalOptions | CipoCssArtifact,
  ...values: readonly (CipoCssInterpolation | CipoCssArtifact | string)[]
): string {
  const warnings: CipoWarning[] = [];
  let important = runtime.config.important;
  let layer: CipoLayerName | false = 'global';
  let rawCss = EMPTY_STRING;

  if (isCssArtifact(first)) {
    rawCss = first.compiledCss;

    for (let index = 0; index < values.length; index += 1) {
      const value = values[index];

      if (isCssArtifact(value)) {
        rawCss += '\n' + value.compiledCss;
      }
    }
  } else if (isInjectGlobalOptions(first)) {
    important = first.important ?? important;
    layer = first.layer ?? layer;
    rawCss = String(values[0] ?? EMPTY_STRING);
  } else {
    rawCss = buildCss(first, values as readonly CipoCssInterpolation[]);
  }

  const transformedCss = transformCss(rawCss, warnings);
  const formattedCss = formatRawCss(important ? addImportantToCssText(transformedCss) : transformedCss);
  const compiledCss = layer ? wrapLayer(layer, formattedCss) : formattedCss;

  insertCss(compiledCss);

  return compiledCss;
}

/**
 * Injects compiled style into a specific element, document or ShadowRoot.
 * Useful for Shadow DOM, userscripts and iframe-like isolated surfaces.
 *
 * @param target DOM target.
 * @param styles Style artifacts.
 * @param options Injection options.
 * @returns Style element used for injection.
 */
export function injectStyle(
  target: HTMLElement | ShadowRoot | Document,
  styles: CipoCssArtifact | CipoInlineCssArtifact | readonly (CipoCssArtifact | CipoInlineCssArtifact)[],
  options: CipoInjectStyleOptions = {},
): HTMLStyleElement {
  const styleList = Array.isArray(styles) ? styles : [styles];
  const cssText = styleList.map(style => isInlineCssArtifact(style) ? String(style) : style.compiledCss).join('\n');
  const dedupeKey = 'cipo-style-' + hashString(cssText);
  const parent = target instanceof Document ? target.head : target;

  if (options.dedupe !== false) {
    const existing = parent.querySelector?.('style[data-cipo-style="' + dedupeKey + '"]');

    if (existing instanceof HTMLStyleElement) {
      return existing;
    }
  }

  const element = document.createElement('style');
  element.dataset.cipoStyle = dedupeKey;

  if (options.nonce) {
    element.nonce = options.nonce;
  }

  element.textContent = cssText;

  if (options.position === 'prepend') {
    parent.prepend(element);
  } else {
    parent.append(element);
  }

  return element;
}

/**
 * Explains a generated atomic class.
 */
export function explain(className: string): CipoExplainResult {
  const atom = runtime.debugAtoms.get(className);

  if (!atom) {
    return { className, found: false };
  }

  return {
    className,
    atom,
    found: true,
    css: compileAtomicRule(atom),
  };
}

/**
 * Reads generated CSS from the runtime style tag.
 */
export function getCssText(): string {
  if (!hasDocument()) {
    return EMPTY_STRING;
  }

  const style = document.getElementById(STYLE_ELEMENT_ID);

  if (!(style instanceof HTMLStyleElement)) {
    return EMPTY_STRING;
  }

  return style.textContent ?? EMPTY_STRING;
}

/**
 * Clears all runtime caches and generated style tags.
 */
export function reset(): void {
  runtime.sheet = null;
  runtime.insertedCss.clear();
  runtime.atomicCache.clear();
  runtime.debugAtoms.clear();
  runtime.themeKeys.clear();
  runtime.warningSink = [];
  runtime.layerHeaderInserted = false;

  if (hasDocument()) {
    document.getElementById(STYLE_ELEMENT_ID)?.remove();
  }
}

/**
 * Creates the browser global API object.
 */
export function createBrowserGlobal(): CipoBrowserGlobal {
  return {
    cipo,
    configure,
    setup,
    theme,
    css,
    inline,
    html,
    injectGlobal,
    injectStyle,
    explain,
    getCssText,
    reset,
    createBrowserGlobal,
    installBrowserGlobal,
  };
}

/**
 * Installs the browser global API under a configurable global name.
 */
export function installBrowserGlobal(globalName = 'Cipo'): CipoBrowserGlobal {
  const api = createBrowserGlobal();
  const target = globalThis as typeof globalThis & Record<string, unknown>;

  target[globalName] = api;

  return api;
}

/* ============================================================================
 * Callable Styled API
 * ========================================================================== */

function createCipoCallable(): CipoCallable {
  const base = cipoCore as CipoCallable;

  base.css = css;
  base.html = html;
  base.theme = theme;
  base.configure = configure;
  base.setup = setup;
  base.inline = inline;
  base.injectGlobal = injectGlobal;
  base.injectStyle = injectStyle;
  base.explain = explain;
  base.getCssText = getCssText;
  base.reset = reset;
  base.createBrowserGlobal = createBrowserGlobal;
  base.installBrowserGlobal = installBrowserGlobal;

  if (typeof Proxy === 'undefined') {
    installTagFactories(base);
    return base;
  }

  return new Proxy(base, {
    get(target, property, receiver) {
      if (property in target) {
        return Reflect.get(target, property, receiver);
      }

      if (typeof property === 'string') {
        return createStyledTagFactory(property);
      }

      return undefined;
    },
  }) as CipoCallable;
}

function installTagFactories(target: CipoCallable): void {
  for (let index = 0; index < HTML_TAGS.length; index += 1) {
    const tag = HTML_TAGS[index];

    Object.defineProperty(target, tag, {
      configurable: true,
      enumerable: false,
      value: createStyledTagFactory(tag),
    });
  }
}

function cipoCore(target: CipoTarget, options?: CipoTargetOptions): CipoStyledBuilder {
  if (isElement(target)) {
    return createDomElementBuilder(target);
  }

  if (typeof target === 'string') {
    return createStyledTagFactory(target, options);
  }

  return createComponentBuilder(target, options);
}

function createDomElementBuilder<ElementType extends Element>(element: ElementType): CipoStyledBuilder<CipoDomStyledResult<ElementType>> {
  return {
    css(strings, ...values) {
      const artifact = createCssArtifact(strings, values);
      applyClassNameToElement(element, artifact.className);

      return {
        element,
        artifact,
        className: artifact.className,
      };
    },
  };
}

function createComponentBuilder<Props extends CipoAnyRecord>(component: CipoComponent<Props>, options?: CipoTargetOptions): CipoStyledBuilder<CipoComponent<Props>> {
  return {
    css(strings, ...values) {
      const artifact = createCssArtifact(strings, values);
      const adapter = resolveAdapter(options?.adapter);

      if (adapter.wrapComponent) {
        return adapter.wrapComponent(component, artifact.className) as CipoComponent<Props>;
      }

      return createGenericWrappedComponent(component, artifact.className, adapter.classProp) as CipoComponent<Props>;
    },
  };
}

function createStyledTagFactory(tag: string, options?: CipoTargetOptions, defaultProps?: CipoAnyRecord): CipoStyledTagFactory {
  return {
    css(strings, ...values) {
      const artifact = createCssArtifact(strings, values);
      const adapter = resolveAdapter(options?.adapter);

      return function CipoStyledTag(props: CipoAnyRecord = {}) {
        const mergedBaseProps = defaultProps ? mergeObjects(defaultProps, props) : props;

        if (adapter.createElement) {
          return adapter.createElement(tag, mergedBaseProps, artifact.className);
        }

        const nextProps = adapter.mergeProps(mergedBaseProps, artifact.className);
        return createPlainComponentPayload(tag, nextProps);
      };
    },
    attrs(nextDefaultProps) {
      return createStyledTagFactory(tag, options, defaultProps ? mergeObjects(defaultProps, nextDefaultProps) : nextDefaultProps);
    },
  };
}

function createPlainComponentPayload(tag: string, props: CipoAnyRecord): CipoAnyRecord {
  return { tag, props };
}

function createGenericWrappedComponent(component: unknown, className: string, classProp: 'class' | 'className'): CipoComponent {
  return function CipoWrappedComponent(props: CipoAnyRecord = {}) {
    const nextProps = mergeClassIntoProps(props, classProp, className);

    if (typeof component === 'function') {
      return (component as CipoComponent)(nextProps);
    }

    return { component, props: nextProps };
  };
}

function createDomElement(tag: string, props: CipoAnyRecord | null | undefined, className: string): Element {
  if (!hasDocument()) {
    return createPlainComponentPayload(tag, mergeClassIntoProps(props, CLASS_PROP, className)) as unknown as Element;
  }

  const element = document.createElement(tag);
  const mergedProps = mergeClassIntoProps(props, CLASS_PROP, className);

  applyPropsToElement(element, mergedProps);

  return element;
}

function applyPropsToElement(element: Element, props: CipoAnyRecord): void {
  for (const key in props) {
    const value = props[key];

    if (value === null || value === undefined || value === false) {
      continue;
    }

    if (key === CHILDREN_PROP) {
      appendChildren(element, value);
      continue;
    }

    if (key === CLASS_NAME_PROP || key === CLASS_PROP) {
      applyClassNameToElement(element, String(value));
      continue;
    }

    if (key === 'style') {
      applyInlineStyleValue(element as HTMLElement, value);
      continue;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
      continue;
    }

    if (value === true) {
      element.setAttribute(key, EMPTY_STRING);
      continue;
    }

    element.setAttribute(key, String(value));
  }
}

function appendChildren(element: Element, children: unknown): void {
  if (Array.isArray(children)) {
    for (let index = 0; index < children.length; index += 1) {
      appendChildren(element, children[index]);
    }

    return;
  }

  if (children === null || children === undefined || children === false) {
    return;
  }

  if (isNode(children)) {
    element.appendChild(children);
    return;
  }

  element.appendChild(document.createTextNode(String(children)));
}

function applyInlineStyleValue(element: HTMLElement, value: unknown): void {
  if (isInlineCssArtifact(value)) {
    element.setAttribute('style', value.cssText);
    return;
  }

  if (typeof value === 'string') {
    element.setAttribute('style', inline.css([value] as unknown as TemplateStringsArray).cssText);
    return;
  }

  if (isPlainObject(value)) {
    element.setAttribute('style', compileStyleObjectToInlineCss(value));
  }
}

function applyClassNameToElement(element: Element, className: string): void {
  if (!className) {
    return;
  }

  const parts = className.split(' ');

  for (let index = 0; index < parts.length; index += 1) {
    const item = parts[index];

    if (item) {
      element.classList.add(item);
    }
  }
}

function mergeClassIntoProps(props: CipoAnyRecord | null | undefined, classProp: 'class' | 'className', className: string): CipoAnyRecord {
  const nextProps = props ? { ...props } : {};
  const existing = nextProps[classProp];

  nextProps[classProp] = existing ? String(existing) + ' ' + className : className;

  return nextProps;
}

function mergeObjects(left: CipoAnyRecord, right: CipoAnyRecord): CipoAnyRecord {
  return { ...left, ...right };
}

function resolveAdapter(adapter?: CipoAdapterName | CipoAdapter): CipoAdapter {
  const selected = adapter ?? runtime.config.adapter;

  if (typeof selected !== 'string') {
    return selected;
  }

  switch (selected) {
    case 'solid':
      return SOLID_ADAPTER;
    case 'react':
      return REACT_ADAPTER;
    case 'preact':
      return PREACT_ADAPTER;
    case 'dom':
    default:
      return DOM_ADAPTER;
  }
}

/* ============================================================================
 * CSS Artifact Build
 * ========================================================================== */

function createCssArtifact(strings: TemplateStringsArray, values: readonly CipoCssInterpolation[]): CipoCssArtifact {
  const warnings: CipoWarning[] = [];
  const rawCss = buildCss(strings, values);
  const transformedCss = transformCss(rawCss, warnings);
  const ast = parseStylesheet(transformedCss, warnings);
  const scopeClassName = runtime.config.prefix + '-s-' + hashString(transformedCss);
  const atoms: CipoAtomicRule[] = [];
  const scopedRules: CipoScopedRule[] = [];

  collectRules(ast, {}, atoms, scopedRules, warnings, scopeClassName);

  const className = joinClassNames(atoms, scopedRules.length > 0 ? scopeClassName : EMPTY_STRING);
  const compiledCss = compileCss(atoms, scopedRules);
  const artifactId = runtime.config.prefix + '-artifact-' + hashString(rawCss);

  insertCss(compiledCss);

  return {
    kind: 'cipo.css',
    className,
    scopeClassName,
    atoms,
    scopedRules,
    rawCss,
    transformedCss,
    compiledCss,
    debug: { id: artifactId, atoms, scopedRules, ast, warnings },
    toString: () => className,
    [Symbol.toPrimitive]: () => className,
    [Symbol.toStringTag]: 'CipoCssArtifact',
  };
}

/* ============================================================================
 * CSS Build + Transform
 * ========================================================================== */

function buildCss(strings: TemplateStringsArray, values: readonly CipoCssInterpolation[]): string {
  let output = EMPTY_STRING;

  for (let index = 0; index < strings.length; index += 1) {
    output += strings[index];

    if (index >= values.length) {
      continue;
    }

    const value = values[index];

    if (isCssArtifact(value)) {
      output += value.rawCss;
      continue;
    }

    if (isInlineCssArtifact(value)) {
      output += value.rawCss;
      continue;
    }

    if (isPlainObject(value)) {
      output += styleObjectToCss(value);
      continue;
    }

    output += String(value ?? EMPTY_STRING);
  }

  return output;
}

function transformCss(input: string, warnings: CipoWarning[]): string {
  const withoutComments = stripComments(input);
  const withTokens = replaceThemeTokens(withoutComments);
  const withFunctions = replaceFunctionCalls(withTokens, warnings);
  const withDirectives = replaceWithDirectives(withFunctions, warnings);

  return withDirectives;
}

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, EMPTY_STRING).replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function replaceThemeTokens(input: string): string {
  return input
    .replace(/\$theme\.([a-zA-Z0-9._-]+)/g, (_match, tokenPath: string) => 'var(--' + runtime.config.prefix + '-' + tokenPath.replaceAll('.', '-') + ')')
    .replace(/\$([a-zA-Z][\w-]*(?:-[\w]+)*)/g, (match, tokenName: string) => {
      if (runtime.themeKeys.has(tokenName) || hasCssVariable(tokenName)) {
        return 'var(--' + runtime.config.prefix + '-' + tokenName + ')';
      }

      return match;
    })
    .replace(/\$colors\.([a-zA-Z0-9._-]+)/g, (_match, tokenPath: string) => 'var(--' + runtime.config.prefix + '-colors-' + tokenPath.replaceAll('.', '-') + ')');
}

function replaceFunctionCalls(input: string, warnings: CipoWarning[]): string {
  return input.replace(/(?:x:)?([a-zA-Z][\w-]*)\(([\s\S]*?)\)/g, (match, name: string, rawArgs: string) => {
    switch (name) {
      case 'spacing':
        return resolveSpacingFunction(rawArgs);
      case 'fluid':
        return resolveFluidFunction(rawArgs);
      case 'size':
        return 'width:' + normalizeDeclarationValue('width', rawArgs.trim()) + ';height:' + normalizeDeclarationValue('height', rawArgs.trim()) + ';';
      case 'alpha':
        return resolveAlphaFunction(rawArgs, warnings);
      case 'lighten':
      case 'darken':
      case 'saturate':
        return resolveColorAdjustFunction(name, rawArgs);
      case 'gradient':
        return resolveGradientFunction(rawArgs);
      case 'rem':
        return pxToRem(rawArgs.trim());
      default:
        return match;
    }
  });
}

function resolveSpacingFunction(rawValue: string): string {
  return 'calc(var(--' + runtime.config.prefix + '-spacing, ' + DEFAULT_SPACING_VALUE + ') * ' + rawValue.trim() + ')';
}

function resolveFluidFunction(rawArgs: string): string {
  const parts = splitTopLevel(rawArgs, ',');
  const min = normalizeDeclarationValue('fluid', parts[0]?.trim() || '1rem');
  const max = normalizeDeclarationValue('fluid', parts[1]?.trim() || '2rem');
  const preferred = normalizeDeclarationValue('fluid', parts[2]?.trim() || 'calc(' + min + ' + 1vw)');

  return 'clamp(' + min + ', ' + preferred + ', ' + max + ')';
}

function resolveAlphaFunction(rawArgs: string, warnings: CipoWarning[]): string {
  const parts = splitTopLevel(rawArgs, '/');

  if (parts.length !== 2) {
    warn(warnings, 'invalid-alpha-function', 'alpha() expects `color / amount`.', rawArgs);
    return rawArgs;
  }

  const color = parts[0].trim();
  const amount = parts[1].trim();
  const space = runtime.config.colorMode === 'oklab' ? 'oklab' : 'oklch';

  if (runtime.config.colorMode === 'rgba') {
    return 'color-mix(in srgb, ' + color + ' ' + amount + ', transparent)';
  }

  if (runtime.config.colorMode === 'hsl') {
    return 'color-mix(in hsl, ' + color + ' ' + amount + ', transparent)';
  }

  return 'color-mix(in ' + space + ', ' + color + ' ' + amount + ', transparent)';
}

function resolveColorAdjustFunction(name: string, rawArgs: string): string {
  const parts = splitTopLevel(rawArgs, ',');
  const color = parts[0]?.trim() || 'currentColor';
  const amount = parts[1]?.trim() || '10%';
  const signedAmount = name === 'darken' ? '-' + amount.replace(/^-/, '') : amount;

  if (name === 'saturate') {
    return 'oklch(from ' + color + ' l calc(c + ' + amount + ') h)';
  }

  if (runtime.config.colorMode === 'preserve') {
    return color;
  }

  return 'oklch(from ' + color + ' calc(l + ' + signedAmount + ') c h)';
}

function resolveGradientFunction(rawArgs: string): string {
  const parts = splitTopLevel(rawArgs, ',').map(part => part.trim()).filter(Boolean);
  const kind = parts[0] ?? 'linear';

  if (kind === 'radial') {
    return 'radial-gradient(' + parts.slice(1).join(', ') + ')';
  }

  if (kind === 'conic') {
    return 'conic-gradient(' + parts.slice(1).join(', ') + ')';
  }

  return 'linear-gradient(' + parts.slice(1).join(', ') + ')';
}

function replaceWithDirectives(input: string, warnings: CipoWarning[]): string {
  return input.replace(/@with\(([\s\S]*?)\);?/g, (_match, rawArgs: string) => expandWithUtilities(rawArgs, warnings));
}

/* ============================================================================
 * Utilities Directive and Text Helper
 * ========================================================================== */

function expandWithUtilities(rawArgs: string, warnings: CipoWarning[]): string {
  const utilities = splitTopLevel(rawArgs, ',');
  let output = EMPTY_STRING;

  for (let index = 0; index < utilities.length; index += 1) {
    output += expandUtility(utilities[index].trim(), warnings);
  }

  return output;
}

function expandUtility(rawUtility: string, warnings: CipoWarning[]): string {
  if (!rawUtility) {
    return EMPTY_STRING;
  }

  const call = parseFunctionCall(rawUtility);

  if (!call) {
    switch (rawUtility) {
      case 'hidden':
        return 'display:none;';
      case 'block':
        return 'display:block;';
      case 'flex':
        return 'display:flex;';
      case 'inline-flex':
        return 'display:inline-flex;';
      case 'grid':
        return 'display:grid;';
      case 'center':
        return 'display:flex;align-items:center;justify-content:center;';
      case 'items-center':
        return 'align-items:center;';
      case 'justify-center':
        return 'justify-content:center;';
      case 'sr-only':
        return 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
      default:
        warn(warnings, 'unknown-utility', 'Unknown @with utility "' + rawUtility + '".', rawUtility);
        return EMPTY_STRING;
    }
  }

  const value = call.args.join(',').trim();

  if (call.name === 'text') {
    return expandTextUtility(value, warnings);
  }

  const alias = PROPERTY_ALIASES[call.name];

  if (alias) {
    return createDeclaration(alias.property, normalizeDeclarationValue(alias.property, value, alias.scale));
  }

  warn(warnings, 'unknown-utility', 'Unknown @with utility "' + call.name + '".', rawUtility);

  return EMPTY_STRING;
}

function expandTextUtility(value: string, warnings: CipoWarning[]): string {
  const args = splitTopLevel(value, ',');
  const typed = parseTypedArguments(value);
  let output = EMPTY_STRING;
  let inferredColor = EMPTY_STRING;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index].trim();

    if (!arg || arg.includes(':')) {
      continue;
    }

    if (arg === 'underline') {
      output += createDeclaration('text-decoration-line', 'underline');
      continue;
    }

    if (arg === 'no-underline') {
      output += createDeclaration('text-decoration-line', 'none');
      continue;
    }

    if (arg === 'uppercase' || arg === 'lowercase' || arg === 'capitalize') {
      output += createDeclaration('text-transform', arg);
      continue;
    }

    if (isColorLike(arg)) {
      inferredColor = arg;
      continue;
    }

    if (arg.startsWith('gradient(')) {
      output += createDeclaration('background-image', resolveGradientFunction(arg.slice('gradient('.length, -1)));
      output += createDeclaration('-webkit-background-clip', 'text');
      output += createDeclaration('background-clip', 'text');
      output += createDeclaration('color', 'transparent');
    }
  }

  if (typed.size) {
    output += createDeclaration('font-size', resolveTextSize(typed.size));
  }

  if (typed.lh || typed.leading) {
    output += createDeclaration('line-height', typed.lh ?? typed.leading ?? EMPTY_STRING);
  }

  if (typed.color || inferredColor) {
    output += createDeclaration('color', normalizeDeclarationValue('color', typed.color ?? inferredColor, 'color'));
  }

  if (typed.weight) {
    output += createDeclaration('font-weight', typed.weight);
  }

  if (typed.align) {
    output += createDeclaration('text-align', typed.align);
  }

  if (typed.decoration) {
    output += createDeclaration('text-decoration-line', typed.decoration);
  }

  if (typed.shadow) {
    output += createDeclaration('text-shadow', resolveShadowValue(typed.shadow));
  }

  if (typed.tracking) {
    output += createDeclaration('letter-spacing', resolveTrackingValue(typed.tracking));
  }

  if (typed.transform) {
    output += createDeclaration('text-transform', typed.transform);
  }

  if (typed.wrap) {
    output += createDeclaration('text-wrap', typed.wrap);
  }

  if (typed.fill) {
    const fill = typed.fill.startsWith('gradient(') ? resolveGradientFunction(typed.fill.slice('gradient('.length, -1)) : typed.fill;
    output += createDeclaration('background-image', fill);
    output += createDeclaration('-webkit-background-clip', 'text');
    output += createDeclaration('background-clip', 'text');
    output += createDeclaration('color', 'transparent');
  }

  if (!output) {
    warn(warnings, 'ambiguous-text-utility', 'text() needs typed arguments like text(size: sm, lh: 2, color: red).', value);
  }

  return output;
}

/* ============================================================================
 * Parser
 * ========================================================================== */

function parseStylesheet(input: string, warnings: CipoWarning[]): readonly CipoAstNode[] {
  return parseBlockBody(input, warnings);
}

function parseBlockBody(input: string, warnings: CipoWarning[]): readonly CipoAstNode[] {
  const nodes: CipoAstNode[] = [];
  let buffer = EMPTY_STRING;
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (char !== '{') {
      buffer += char;
      index += 1;
      continue;
    }

    const blockName = buffer.trim();
    buffer = EMPTY_STRING;

    const endIndex = findMatchingBrace(input, index);

    if (endIndex < 0) {
      warn(warnings, 'unclosed-block', 'Block "' + blockName + '" is missing a closing brace.', input.slice(index));
      buffer += input.slice(index);
      break;
    }

    const body = input.slice(index + 1, endIndex);

    nodes.push({
      type: 'block',
      name: blockName,
      body: parseBlockBody(body, warnings),
      source: blockName + '{' + body + '}',
    });

    index = endIndex + 1;
  }

  appendDeclarationsAndDirectives(nodes, buffer, warnings);

  return nodes;
}

function appendDeclarationsAndDirectives(nodes: CipoAstNode[], input: string, warnings: CipoWarning[]): void {
  const chunks = splitTopLevel(input, ';');

  for (let index = 0; index < chunks.length; index += 1) {
    const source = chunks[index].trim();

    if (!source) {
      continue;
    }

    if (source.startsWith('@')) {
      const directive = parseDirective(source, warnings);

      if (directive) {
        nodes.push(directive);
      }

      continue;
    }

    const functionDeclaration = parseDeclarationFunction(source);

    if (functionDeclaration) {
      nodes.push(...parseStylesheet(functionDeclaration, warnings));
      continue;
    }

    const colonIndex = findTopLevelColon(source);

    if (colonIndex <= 0) {
      warn(warnings, 'invalid-declaration', 'Invalid declaration "' + source + '".', source);
      continue;
    }

    const rawProperty = source.slice(0, colonIndex).trim();
    const rawValue = source.slice(colonIndex + 1).trim();
    const normalizedDeclarations = normalizePropertyDeclaration(rawProperty, rawValue);

    for (let childIndex = 0; childIndex < normalizedDeclarations.length; childIndex += 1) {
      nodes.push(normalizedDeclarations[childIndex]);
    }
  }
}

function parseDeclarationFunction(source: string): string | null {
  const call = parseFunctionCall(source);

  if (!call) {
    return null;
  }

  if (call.name === 'text') {
    return expandTextUtility(call.args.join(','), []);
  }

  return null;
}

function parseDeclarationsAndDirectives(input: string, warnings: CipoWarning[]): readonly CipoAstNode[] {
  const nodes: CipoAstNode[] = [];
  appendDeclarationsAndDirectives(nodes, input, warnings);
  return nodes;
}

function parseDirective(source: string, warnings: CipoWarning[]): CipoDirectiveNode | null {
  const match = source.match(/^@([a-zA-Z][\w-]*)\(([\s\S]*)\)$/);

  if (!match) {
    warn(warnings, 'invalid-directive', 'Invalid directive "' + source + '".', source);
    return null;
  }

  return {
    type: 'directive',
    name: match[1],
    args: splitTopLevel(match[2], ','),
    source,
  };
}

/* ============================================================================
 * AST Collection
 * ========================================================================== */

function collectRules(
  nodes: readonly CipoAstNode[],
  context: CipoRuleContext,
  atoms: CipoAtomicRule[],
  scopedRules: CipoScopedRule[],
  warnings: CipoWarning[],
  scopeClassName: string,
): void {
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index];

    if (node.type === 'declaration') {
      collectDeclaration(node, context, atoms);
      continue;
    }

    if (node.type === 'directive') {
      collectDirective(node, context, atoms, warnings, scopeClassName);
      continue;
    }

    collectBlock(node, context, atoms, scopedRules, warnings, scopeClassName);
  }
}

function collectDeclaration(declaration: CipoDeclarationNode, context: CipoRuleContext, atoms: CipoAtomicRule[]): void {
  const expanded = expandResponsiveDeclaration(declaration);

  if (!expanded) {
    atoms.push(createAtomicRule(declaration, context));
    return;
  }

  for (let index = 0; index < expanded.length; index += 1) {
    const item = expanded[index];

    atoms.push(createAtomicRule({
      type: 'declaration',
      property: declaration.property,
      value: item.value,
      source: declaration.property + ':' + item.value,
    }, resolveBreakpointContext(context, item.breakpoint)));
  }
}

function collectDirective(
  directive: CipoDirectiveNode,
  context: CipoRuleContext,
  atoms: CipoAtomicRule[],
  warnings: CipoWarning[],
  scopeClassName: string,
): void {
  if (directive.name !== 'with') {
    warn(warnings, 'unknown-directive', 'Unknown directive "@' + directive.name + '".', directive);
    return;
  }

  const expanded = expandWithUtilities(directive.args.join(','), warnings);
  const nestedAst = parseDeclarationsAndDirectives(expanded, warnings);

  collectRules(nestedAst, context, atoms, [], warnings, scopeClassName);
}

function collectBlock(
  block: CipoBlockNode,
  context: CipoRuleContext,
  atoms: CipoAtomicRule[],
  scopedRules: CipoScopedRule[],
  warnings: CipoWarning[],
  scopeClassName: string,
): void {
  const name = block.name.trim();

  if (name.startsWith('x:not(')) {
    const breakpoint = name.replace(/^x:not\(/, EMPTY_STRING).replace(/\)$/, EMPTY_STRING).trim();
    collectRules(block.body, { ...context, notBreakpoint: breakpoint }, atoms, scopedRules, warnings, scopeClassName);
    return;
  }

  if (name.startsWith('x:')) {
    const parts = name.slice(2).split(':').map(part => part.trim()).filter(Boolean);
    let nextContext = context;
    let consumed = false;

    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index];

      if (part in runtime.config.breakpoints) {
        nextContext = resolveBreakpointContext(nextContext, part);
        consumed = true;
        continue;
      }

      if (part === 'dark') {
        nextContext = { ...nextContext, dark: true };
        consumed = true;
        continue;
      }

      if (isPseudoName(part)) {
        nextContext = { ...nextContext, pseudo: ':' + part };
        consumed = true;
      }
    }

    if (consumed) {
      collectRules(block.body, nextContext, atoms, scopedRules, warnings, scopeClassName);
      return;
    }
  }

  const declarations: CipoDeclarationNode[] = [];

  for (let index = 0; index < block.body.length; index += 1) {
    const node = block.body[index];

    if (node.type === 'declaration') {
      declarations.push(node);
    }
  }

  if (declarations.length === 0) {
    return;
  }

  scopedRules.push({ selector: resolveScopedSelector(scopeClassName, name), declarations, context });
}

/* ============================================================================
 * Declaration Normalization
 * ========================================================================== */

function normalizePropertyDeclaration(rawProperty: string, rawValue: string): CipoDeclarationNode[] {
  const alias = PROPERTY_ALIASES[rawProperty];

  if (!alias) {
    return [{ type: 'declaration', property: rawProperty, value: normalizeDeclarationValue(rawProperty, rawValue), source: rawProperty + ':' + rawValue }];
  }

  const normalizedValue = normalizeDeclarationValue(alias.property, rawValue, alias.scale);

  return [{ type: 'declaration', property: alias.property, value: normalizedValue, source: rawProperty + ':' + rawValue }];
}

function normalizeDeclarationValue(property: string, rawValue: string, scale: AliasScale = 'none'): string {
  const value = rawValue.trim();

  if (!value) {
    return value;
  }

  if (value.includes('var(') || value.includes('calc(') || value.includes('clamp(') || value.includes('color-mix(') || value.includes('gradient(')) {
    return normalizePxValues(value);
  }

  if (value.startsWith('$') || value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl') || value.startsWith('oklch') || value.startsWith('oklab')) {
    return normalizePxValues(value);
  }

  if (value.startsWith('lighten(') || value.startsWith('darken(') || value.startsWith('saturate(') || value.startsWith('alpha(') || value.startsWith('fluid(') || value.startsWith('spacing(') || value.startsWith('rem(')) {
    return normalizePxValues(replaceFunctionCalls(value, []));
  }

  if (scale === 'spacing' && isPlainNumber(value)) {
    return resolveSpacingFunction(value);
  }

  if (scale === 'radius' && RADIUS_TOKENS.has(value)) {
    return 'var(--' + runtime.config.prefix + '-radius-' + value + ')';
  }

  if (scale === 'shadow' && SHADOW_TOKENS.has(value)) {
    return 'var(--' + runtime.config.prefix + '-shadow-' + value + ')';
  }

  if (scale === 'text' && TEXT_SIZE_TOKENS.has(value)) {
    return 'var(--' + runtime.config.prefix + '-text-' + value + ')';
  }

  return normalizePxValues(value);
}

function normalizePxValues(value: string): string {
  if (!runtime.config.rem.enabled) {
    return value;
  }

  return value.replace(/(-?\d*\.?\d+)px\b/g, (_match, amount: string) => pxToRem(amount + 'px'));
}

function pxToRem(value: string): string {
  const numeric = Number(value.replace('px', '').trim());

  if (!Number.isFinite(numeric)) {
    return value;
  }

  const rem = numeric / runtime.config.rem.baseFontSize;
  const rounded = Math.round(rem * 10000) / 10000;

  return String(rounded).replace(/\.0+$/, '') + 'rem';
}

function resolveTextSize(value: string): string {
  if (TEXT_SIZE_TOKENS.has(value)) {
    return 'var(--' + runtime.config.prefix + '-text-' + value + ')';
  }

  return normalizeDeclarationValue('font-size', value);
}

function resolveShadowValue(value: string): string {
  if (SHADOW_TOKENS.has(value)) {
    return 'var(--' + runtime.config.prefix + '-shadow-' + value + ')';
  }

  return normalizeDeclarationValue('text-shadow', value);
}

function resolveTrackingValue(value: string): string {
  if (/^[a-z][\w-]*$/i.test(value)) {
    return 'var(--' + runtime.config.prefix + '-tracking-' + value + ')';
  }

  return normalizeDeclarationValue('letter-spacing', value);
}

/* ============================================================================
 * Responsive Values
 * ========================================================================== */

function expandResponsiveDeclaration(declaration: CipoDeclarationNode): Array<{ readonly breakpoint: string; readonly value: string }> | null {
  const parts = splitTopLevel(declaration.value, ',');
  const result: Array<{ readonly breakpoint: string; readonly value: string }> = [];
  let hasResponsive = false;

  for (let index = 0; index < parts.length; index += 1) {
    const trimmed = parts[index].trim();
    const match = trimmed.match(/^x:([a-zA-Z][\w-]*)\(([\s\S]*)\)$/);

    if (!match) {
      result.push({ breakpoint: 'base', value: trimmed });
      continue;
    }

    const breakpoint = match[1];
    const value = match[2].trim();

    if (!(breakpoint in runtime.config.breakpoints)) {
      result.push({ breakpoint: 'base', value: trimmed });
      continue;
    }

    hasResponsive = true;
    result.push({ breakpoint, value });
  }

  return hasResponsive ? result : null;
}

function resolveBreakpointContext(context: CipoRuleContext, breakpoint: string): CipoRuleContext {
  const mediaQuery = runtime.config.breakpoints[breakpoint];

  if (!mediaQuery) {
    return context;
  }

  return { ...context, breakpoint, mediaQuery };
}

/* ============================================================================
 * Atomic CSS
 * ========================================================================== */

function createAtomicRule(declaration: CipoDeclarationNode, context: CipoRuleContext): CipoAtomicRule {
  const property = normalizeCss(declaration.property);
  const value = normalizeCss(declaration.value);
  const normalizedValue = runtime.config.important ? addImportant(value) : value;
  const id = [property, normalizedValue, context.mediaQuery ?? EMPTY_STRING, context.pseudo ?? EMPTY_STRING, context.dark ? 'dark' : EMPTY_STRING, context.notBreakpoint ?? EMPTY_STRING].join('|');
  const cached = runtime.atomicCache.get(id);

  if (cached) {
    return cached;
  }

  const className = runtime.config.prefix + '-a-' + hashString(id);
  const atom: CipoAtomicRule = { id, className, property: declaration.property, value: normalizedValue, context, source: declaration.source };

  runtime.atomicCache.set(id, atom);
  runtime.debugAtoms.set(className, atom);

  return atom;
}

function compileCss(atoms: readonly CipoAtomicRule[], scopedRules: readonly CipoScopedRule[]): string {
  const chunks: string[] = [];

  for (let index = 0; index < atoms.length; index += 1) {
    chunks.push(compileAtomicRule(atoms[index]));
  }

  for (let index = 0; index < scopedRules.length; index += 1) {
    chunks.push(compileScopedRule(scopedRules[index]));
  }

  const atomicCss = chunks.filter(Boolean).join('\n');

  return formatCss(wrapLayer('atomic', atomicCss));
}

function compileAtomicRule(atom: CipoAtomicRule): string {
  const selector = compileSelector(atom.className, atom.context);

  return wrapContext(selector + '{' + createDeclaration(atom.property, atom.value) + '}', atom.context);
}

function compileScopedRule(rule: CipoScopedRule): string {
  let declarations = EMPTY_STRING;

  for (let index = 0; index < rule.declarations.length; index += 1) {
    const declaration = rule.declarations[index];
    const value = runtime.config.important ? addImportant(declaration.value) : declaration.value;

    declarations += createDeclaration(declaration.property, value);
  }

  return wrapContext(rule.selector + '{' + declarations + '}', rule.context);
}

function compileSelector(className: string, context: CipoRuleContext): string {
  let selector = '.' + className;

  if (context.pseudo) {
    selector += context.pseudo;
  }

  if (context.dark) {
    selector = runtime.config.darkSelector + ' ' + selector;
  }

  return selector;
}

function wrapContext(rule: string, context: CipoRuleContext): string {
  let output = rule;

  if (context.mediaQuery) {
    output = '@media ' + context.mediaQuery + '{' + output + '}';
  }

  if (context.notBreakpoint) {
    const query = runtime.config.breakpoints[context.notBreakpoint];

    if (query) {
      output = '@media not all and ' + query + '{' + output + '}';
    }
  }

  return output;
}

/* ============================================================================
 * Inline CSS
 * ========================================================================== */

function collectInlineDeclarations(ast: readonly CipoAstNode[], warnings: CipoWarning[]): CipoDeclarationNode[] {
  const output: CipoDeclarationNode[] = [];

  for (let index = 0; index < ast.length; index += 1) {
    const node = ast[index];

    if (node.type === 'declaration') {
      output.push(node);
      continue;
    }

    if (node.type === 'directive' && node.name === 'with') {
      output.push(...collectInlineDeclarations(parseDeclarationsAndDirectives(expandWithUtilities(node.args.join(','), warnings), warnings), warnings));
    }
  }

  return output;
}

function formatInlineDeclarations(declarations: readonly CipoDeclarationNode[]): string {
  let output = EMPTY_STRING;

  for (let index = 0; index < declarations.length; index += 1) {
    const declaration = declarations[index];
    output += createDeclaration(declaration.property, declaration.value);
  }

  return runtime.config.minify ? normalizeCss(output) : output.replace(/;/g, '; ').trim();
}

function compileStyleObjectToInlineCss(value: Record<string, unknown>): string {
  const cssText = styleObjectToCss(value as CipoStyleObject);

  return inline.css([cssText] as unknown as TemplateStringsArray).cssText;
}

/* ============================================================================
 * Global CSS Important Transformer
 * ========================================================================== */

function addImportantToCssText(cssText: string): string {
  const chunks = splitTopLevelRules(cssText);
  let output = EMPTY_STRING;

  for (let index = 0; index < chunks.length; index += 1) {
    output += addImportantToRule(chunks[index]) + '\n';
  }

  return output.trim();
}

function addImportantToRule(rule: string): string {
  const openIndex = rule.indexOf('{');
  const closeIndex = rule.lastIndexOf('}');

  if (openIndex < 0 || closeIndex <= openIndex) {
    return rule;
  }

  const head = rule.slice(0, openIndex).trim();
  const body = rule.slice(openIndex + 1, closeIndex);

  if (head.startsWith('@')) {
    return head + '{' + addImportantToCssText(body) + '}';
  }

  const declarations = parseDeclarationsAndDirectives(body, []);
  let nextBody = EMPTY_STRING;

  for (let index = 0; index < declarations.length; index += 1) {
    const node = declarations[index];

    if (node.type !== 'declaration') {
      continue;
    }

    nextBody += createDeclaration(node.property, addImportant(node.value));
  }

  return head + '{' + nextBody + '}';
}

function addImportant(value: string): string {
  return /\s!important\s*$/i.test(value) ? value : value + ' !important';
}

/* ============================================================================
 * CSS Formatting and Layers
 * ========================================================================== */

function insertCss(cssText: string): void {
  if (!hasDocument() || !cssText) {
    return;
  }

  const style = ensureStyleElement();

  if (runtime.config.layers && !runtime.layerHeaderInserted) {
    appendCssText(style, DEFAULT_LAYER_DECLARATION + '\n');
    runtime.layerHeaderInserted = true;
  }

  const rules = splitTopLevelRules(cssText);

  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];
    const normalized = normalizeCss(rule);

    if (!normalized || runtime.insertedCss.has(normalized)) {
      continue;
    }

    runtime.insertedCss.add(normalized);
    appendCssText(style, formatCss(rule) + '\n');
  }
}

function ensureStyleElement(): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ELEMENT_ID);

  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const element = document.createElement('style');
  element.id = STYLE_ELEMENT_ID;
  element.dataset.cipo = 'runtime';
  document.head.appendChild(element);

  return element;
}

function appendCssText(style: HTMLStyleElement, cssText: string): void {
  style.appendChild(document.createTextNode(cssText));
}

function wrapLayer(layer: CipoLayerName, cssText: string): string {
  if (!runtime.config.layers || !cssText) {
    return cssText;
  }

  return '@layer cipo.' + layer + '{' + cssText + '}';
}

function formatRawCss(cssText: string): string {
  return runtime.config.minify ? normalizeCss(cssText) : cssText.trim();
}

function formatCss(cssText: string): string {
  if (runtime.config.minify) {
    return normalizeCss(cssText);
  }

  return prettyCss(cssText);
}

function prettyCss(cssText: string): string {
  let output = EMPTY_STRING;
  let depth = 0;
  let token = EMPTY_STRING;

  for (let index = 0; index < cssText.length; index += 1) {
    const char = cssText[index];

    if (char === '{') {
      output += token.trim() + ' {\n';
      depth += 1;
      token = indent(depth);
      continue;
    }

    if (char === '}') {
      if (token.trim()) {
        output += token.trim() + '\n';
      }
      depth = Math.max(0, depth - 1);
      output += indent(depth) + '}\n';
      token = indent(depth);
      continue;
    }

    if (char === ';') {
      output += token.trim() + ';\n';
      token = indent(depth);
      continue;
    }

    token += char;
  }

  if (token.trim()) {
    output += token.trim();
  }

  return output.trim();
}

function indent(depth: number): string {
  return '  '.repeat(depth);
}

function createDeclaration(property: string, value: string): string {
  return property + ':' + value + ';';
}

/* ============================================================================
 * Utility Helpers
 * ========================================================================== */

function normalizeRemConfig(rem: boolean | CipoRemConfig | undefined, baseFontSize: number | undefined): Required<CipoRemConfig> | null {
  if (rem === undefined && baseFontSize === undefined) {
    return null;
  }

  if (typeof rem === 'boolean') {
    return { enabled: rem, baseFontSize: baseFontSize ?? runtime.config.rem.baseFontSize };
  }

  return {
    enabled: rem?.enabled ?? runtime.config.rem.enabled,
    baseFontSize: rem?.baseFontSize ?? baseFontSize ?? runtime.config.rem.baseFontSize,
  };
}

function flattenTheme(tokens: CipoThemeDefinition, path: readonly string[] = []): Array<readonly [string, string | number]> {
  const output: Array<readonly [string, string | number]> = [];
  const entries = Object.entries(tokens);

  for (let index = 0; index < entries.length; index += 1) {
    const [key, value] = entries[index];
    const nextPath = path.length === 0 ? [key] : [...path, key];

    if (isPlainObject(value)) {
      const child = flattenTheme(value as CipoThemeDefinition, nextPath);
      output.push(...child);
      continue;
    }

    output.push([nextPath.join('-'), value]);
  }

  return output;
}

function styleObjectToCss(styleObject: CipoStyleObject): string {
  let output = EMPTY_STRING;
  const entries = Object.entries(styleObject);

  for (let index = 0; index < entries.length; index += 1) {
    const [key, value] = entries[index];

    if (value === null || value === undefined) {
      continue;
    }

    if (isPlainObject(value)) {
      output += key + '{' + styleObjectToCss(value as CipoStyleObject) + '}';
      continue;
    }

    const alias = PROPERTY_ALIASES[key];
    const property = alias?.property ?? toKebabCase(key);
    const scale = alias?.scale ?? 'none';

    output += createDeclaration(property, normalizeDeclarationValue(property, String(value), scale));
  }

  return output;
}

function parseFunctionCall(input: string): null | { readonly name: string; readonly args: readonly string[] } {
  const openIndex = input.indexOf('(');
  const closeIndex = input.lastIndexOf(')');

  if (openIndex < 0 || closeIndex <= openIndex) {
    return null;
  }

  return {
    name: input.slice(0, openIndex).trim(),
    args: splitTopLevel(input.slice(openIndex + 1, closeIndex), ','),
  };
}

function parseTypedArguments(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = splitTopLevel(input, ',');

  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    const colonIndex = findTopLevelColon(part);

    if (colonIndex <= 0) {
      continue;
    }

    result[part.slice(0, colonIndex).trim()] = part.slice(colonIndex + 1).trim();
  }

  return result;
}

function splitTopLevel(input: string, separator: string): string[] {
  const output: string[] = [];
  let buffer = EMPTY_STRING;
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quote) {
      buffer += char;
      if (char === quote && input[index - 1] !== '\\') quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }

    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;

    if (char === separator && depth === 0) {
      if (buffer.trim()) output.push(buffer.trim());
      buffer = EMPTY_STRING;
      continue;
    }

    buffer += char;
  }

  if (buffer.trim()) output.push(buffer.trim());
  return output;
}

function splitTopLevelRules(input: string): string[] {
  const output: string[] = [];
  let start = 0;
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quote) {
      if (char === quote && input[index - 1] !== '\\') quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;

    if (depth === 0 && char === '}') {
      output.push(input.slice(start, index + 1).trim());
      start = index + 1;
    }
  }

  const tail = input.slice(start).trim();
  if (tail) output.push(tail);

  return output.filter(Boolean);
}

function findMatchingBrace(input: string, startIndex: number): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = startIndex; index < input.length; index += 1) {
    const char = input[index];

    if (quote) {
      if (char === quote && input[index - 1] !== '\\') quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '{') depth += 1;
    else if (char === '}') depth -= 1;

    if (depth === 0) return index;
  }

  return -1;
}

function findTopLevelColon(input: string): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quote) {
      if (char === quote && input[index - 1] !== '\\') quote = null;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === '(' || char === '[') depth += 1;
    else if (char === ')' || char === ']') depth -= 1;
    else if (char === ':' && depth === 0) return index;
  }

  return -1;
}

function resolveScopedSelector(scopeClassName: string, selector: string): string {
  const normalized = selector.trim();
  if (!normalized) return '.' + scopeClassName;
  if (normalized.includes('&')) return normalized.replaceAll('&', '.' + scopeClassName);
  return '.' + scopeClassName + ' ' + normalized;
}

function joinClassNames(atoms: readonly CipoAtomicRule[], scopeClassName: string): string {
  const seen = new Set<string>();
  let output = EMPTY_STRING;

  if (scopeClassName) {
    seen.add(scopeClassName);
    output += scopeClassName;
  }

  for (let index = 0; index < atoms.length; index += 1) {
    const className = atoms[index].className;

    if (seen.has(className)) continue;

    seen.add(className);
    output += output ? ' ' + className : className;
  }

  return output;
}

function normalizeCss(input: string): string {
  return input.replace(/\s+/g, ' ').replace(/\s*([{}:;,>+~])\s*/g, '$1').trim();
}

function hashString(input: string): string {
  let hash = HASH_SEED;

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) & HASH_MASK;
  }

  return (hash >>> 0).toString(36);
}

function toKebabCase(input: string): string {
  return input.replace(/[A-Z]/g, match => '-' + match.toLowerCase());
}

function warn(warnings: CipoWarning[], code: string, message: string, context?: unknown): void {
  const warning = { code, message, context };
  warnings.push(warning);
  runtime.warningSink.push(warning);
  runtime.config.onWarning?.(warning);

  if (runtime.config.debug) {
    console.warn('[Cipó:' + code + '] ' + message, context ?? EMPTY_STRING);
  }
}

function hasCssVariable(tokenName: string): boolean {
  if (!hasDocument()) return false;

  const variableName = '--' + runtime.config.prefix + '-' + tokenName;
  const root = document.querySelector(runtime.config.themeRootSelector) ?? document.documentElement;

  return getComputedStyle(root).getPropertyValue(variableName).trim().length > 0;
}

function hasDocument(): boolean {
  return typeof document !== 'undefined' && Boolean(document.head);
}

function isCssArtifact(value: unknown): value is CipoCssArtifact {
  return isPlainObject(value) && value.kind === 'cipo.css';
}

function isInlineCssArtifact(value: unknown): value is CipoInlineCssArtifact {
  return isPlainObject(value) && value.kind === 'cipo.inline-css';
}

function isInjectGlobalOptions(value: unknown): value is CipoInjectGlobalOptions {
  return isPlainObject(value) && ('important' in value || 'layer' in value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isElement(value: unknown): value is Element {
  return typeof Element !== 'undefined' && value instanceof Element;
}

function isNode(value: unknown): value is Node {
  return typeof Node !== 'undefined' && value instanceof Node;
}

function isPseudoName(name: string): boolean {
  switch (name) {
    case 'hover':
    case 'focus':
    case 'active':
    case 'disabled':
    case 'checked':
    case 'focus-visible':
    case 'focus-within':
    case 'visited':
    case 'first-child':
    case 'last-child':
    case 'before':
    case 'after':
      return true;
    default:
      return false;
  }
}

function isPlainNumber(value: string): boolean {
  return /^-?\d*\.?\d+$/.test(value);
}

function isColorLike(value: string): boolean {
  return value.startsWith('$colors.') || value.startsWith('$theme.colors.') || value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl') || value.startsWith('oklch') || value.startsWith('oklab') || value === 'transparent' || value === 'currentColor';
}

/* ============================================================================
 * Public Callable Instance
 * ========================================================================== */

export const cipo = createCipoCallable();

/* ============================================================================
 * Browser Global Install
 * ========================================================================== */

if (typeof window !== 'undefined') {
  window.Cipo = createBrowserGlobal();
  window.RodK = window.Cipo;
}
