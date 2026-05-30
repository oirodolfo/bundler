/*
 * ============================================================================
 * Cipó Runtime Usage Examples
 * ============================================================================
 *
 * 1. Basic atomic CSS
 *
 * const button = css`
 *   color: white;
 *   background: #111827;
 *   padding: 12px 16px;
 *   border-radius: 12px;
 * `;
 *
 * Output class:
 *
 * "cipo-a-xxxxx cipo-a-yyyyy cipo-a-zzzzz cipo-a-wwwww"
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{color:white;}
 * .cipo-a-yyyyy{background:#111827;}
 * .cipo-a-zzzzz{padding:12px 16px;}
 * .cipo-a-wwwww{border-radius:12px;}
 *
 * ----------------------------------------------------------------------------
 *
 * 2. Configure runtime
 *
 * configure({
 *   prefix: "rod",
 *   debug: false,
 *   important: true,
 *   adapter: "solid",
 *   darkSelector: ".dark",
 *   themeRootSelector: ":root",
 *   breakpoints: {
 *     md: "(min-width: 768px)",
 *   },
 * });
 *
 * Output CSS when important is true:
 *
 * .rod-a-xxxxx{color:white !important;}
 *
 * ----------------------------------------------------------------------------
 *
 * 3. Theme tokens and shorthand variables
 *
 * theme({
 *   colors: {
 *     brand: "#22c55e",
 *   },
 *   spacing: "0.25rem",
 *   radius: {
 *     xl: "18px",
 *   },
 * });
 *
 * const card = css`
 *   color: $theme.colors.brand;
 *   padding: calc($spacing * 4);
 *   border-radius: $radius-xl;
 * `;
 *
 * Output CSS:
 *
 * :root{--cipo-colors-brand:#22c55e;--cipo-spacing:0.25rem;--cipo-radius-xl:18px;}
 * .cipo-a-xxxxx{color:var(--cipo-colors-brand);}
 * .cipo-a-yyyyy{padding:calc(var(--cipo-spacing) * 4);}
 * .cipo-a-zzzzz{border-radius:var(--cipo-radius-xl);}
 *
 * Note:
 * $spacing and $radius-xl are replaced only when they were registered by
 * theme() or already exist as CSS variables with the configured prefix.
 * Unknown variables are left untouched.
 *
 * ----------------------------------------------------------------------------
 *
 * 4. Global CSS injection
 *
 * injectGlobal`
 *   *, *::before, *::after {
 *     box-sizing: border-box;
 *   }
 *
 *   body {
 *     margin: 0;
 *     background: $theme.colors.brand;
 *   }
 * `;
 *
 * Output CSS:
 *
 * *, *::before, *::after{box-sizing:border-box;}
 * body{margin:0;background:var(--cipo-colors-brand);}
 *
 * ----------------------------------------------------------------------------
 *
 * 5. Global CSS injection with local important mode
 *
 * injectGlobal(
 *   { important: true },
 *   `
 *     body {
 *       margin: 0;
 *       color: white;
 *     }
 *   `,
 * );
 *
 * Output CSS:
 *
 * body{margin:0 !important;color:white !important;}
 *
 * ----------------------------------------------------------------------------
 *
 * 6. Utility directive
 *
 * const card = css`
 *   @with(
 *     bg(#111827),
 *     color(white),
 *     px(16px),
 *     py(12px),
 *     rounded(18px),
 *     shadow(0 24px 80px rgb(0 0 0 / 0.2))
 *   );
 * `;
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{background:#111827;}
 * .cipo-a-yyyyy{color:white;}
 * .cipo-a-zzzzz{padding-inline:16px;}
 * .cipo-a-wwwww{padding-block:12px;}
 * .cipo-a-vvvvv{border-radius:18px;}
 * .cipo-a-uuuuu{box-shadow:0 24px 80px rgb(0 0 0 / 0.2);}
 *
 * ----------------------------------------------------------------------------
 *
 * 7. Helpers
 *
 * const fluid = css`
 *   font-size: x:fluid(1.25rem, 3rem, 4vw);
 *   gap: x:spacing(4);
 *   x:size(48px);
 *   background: x:alpha($theme.colors.brand / 18%);
 * `;
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{font-size:clamp(1.25rem,4vw,3rem);}
 * .cipo-a-yyyyy{gap:calc(var(--cipo-spacing) * 4);}
 * .cipo-a-zzzzz{width:48px;}
 * .cipo-a-wwwww{height:48px;}
 * .cipo-a-vvvvv{background:color-mix(in oklab,var(--cipo-colors-brand) 18%,transparent);}
 *
 * ----------------------------------------------------------------------------
 *
 * 8. Responsive block
 *
 * const panel = css`
 *   width: 100%;
 *
 *   x:md {
 *     width: 720px;
 *   }
 * `;
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{width:100%;}
 * @media (min-width: 768px){.cipo-a-yyyyy{width:720px;}}
 *
 * ----------------------------------------------------------------------------
 *
 * 9. Inverted responsive block
 *
 * const mobileOnly = css`
 *   display: block;
 *
 *   x:not(md) {
 *     font-size: 14px;
 *   }
 * `;
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{display:block;}
 * @media not all and (min-width: 768px){.cipo-a-yyyyy{font-size:14px;}}
 *
 * ----------------------------------------------------------------------------
 *
 * 10. Dark mode block
 *
 * const surface = css`
 *   background: white;
 *   color: black;
 *
 *   x:dark {
 *     background: #020617;
 *     color: white;
 *   }
 * `;
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{background:white;}
 * .cipo-a-yyyyy{color:black;}
 * [data-theme="dark"] .cipo-a-zzzzz{background:#020617;}
 * [data-theme="dark"] .cipo-a-wwwww{color:white;}
 *
 * ----------------------------------------------------------------------------
 *
 * 11. Pseudo block
 *
 * const link = css`
 *   color: #38bdf8;
 *
 *   x:hover {
 *     color: #7dd3fc;
 *   }
 * `;
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{color:#38bdf8;}
 * .cipo-a-yyyyy:hover{color:#7dd3fc;}
 *
 * ----------------------------------------------------------------------------
 *
 * 12. Scoped selectors
 *
 * const list = css`
 *   padding: 0;
 *
 *   li {
 *     list-style: none;
 *     padding: 8px;
 *   }
 *
 *   &:hover {
 *     opacity: 0.92;
 *   }
 * `;
 *
 * Output class:
 *
 * "cipo-s-xxxxx cipo-a-yyyyy"
 *
 * Output CSS:
 *
 * .cipo-a-yyyyy{padding:0;}
 * .cipo-s-xxxxx li{list-style:none;padding:8px;}
 * .cipo-s-xxxxx:hover{opacity:0.92;}
 *
 * ----------------------------------------------------------------------------
 *
 * 13. DOM element API
 *
 * const element = document.createElement("div");
 *
 * const styled = cipo(element).css`
 *   color: red;
 *   padding: $spacing;
 * `;
 *
 * Output:
 *
 * styled.element === element
 * element.className includes generated classes
 *
 * ----------------------------------------------------------------------------
 *
 * 14. DOM tag factory API
 *
 * configure({ adapter: "dom" });
 *
 * const Card = cipo.div.css`
 *   padding: 16px;
 *   background: white;
 * `;
 *
 * const element = Card({
 *   class: "extra",
 *   children: "Hello",
 * });
 *
 * Output DOM:
 *
 * <div class="cipo-a-xxxxx cipo-a-yyyyy extra">Hello</div>
 *
 * ----------------------------------------------------------------------------
 *
 * 15. Framework component API
 *
 * configure({ adapter: "react" });
 *
 * const Button = cipo.button.css`
 *   color: white;
 *   background: black;
 * `;
 *
 * Output props for React or Preact:
 *
 * { className: "cipo-a-xxxxx cipo-a-yyyyy ..." }
 *
 * configure({ adapter: "solid" });
 *
 * Output props for Solid:
 *
 * { class: "cipo-a-xxxxx cipo-a-yyyyy ..." }
 *
 * ----------------------------------------------------------------------------
 *
 * 16. Component wrapper API
 *
 * const StyledComponent = cipo(MyComponent).css`
 *   color: red;
 * `;
 *
 * const ReactOnly = cipo(MyComponent, { adapter: "react" }).css`
 *   color: blue;
 * `;
 *
 * const SolidOnly = cipo(MyComponent, { adapter: "solid" }).css`
 *   color: green;
 * `;
 *
 * ----------------------------------------------------------------------------
 *
 * 17. Browser globals
 *
 * window.Cipo.css`
 *   color: red;
 * `;
 *
 * window.Cipo.cipo.div.css`
 *   color: blue;
 * `;
 *
 * window.Cipo.injectGlobal`
 *   body {
 *     margin: 0;
 *   }
 * `;
 *
 * window.RodK points to the same API by default.
 *
 * ============================================================================
 */

/* ============================================================================
 * Constants
 * ========================================================================== */

const STYLE_ELEMENT_ID = "cipo-runtime-style";
const HASH_SEED = 5381;
const HASH_MASK = 0xffffffff;
const DEFAULT_PREFIX = "cipo";
const EMPTY_STRING = "";
const CLASS_PROP = "class";
const CLASS_NAME_PROP = "className";
const CHILDREN_PROP = "children";

const HTML_TAGS = [
  "a",
  "abbr",
  "address",
  "area",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "bdi",
  "bdo",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
] as const;

/* ============================================================================
 * Public Types
 * ========================================================================== */

export type CipoPrimitive = string | number | boolean | null | undefined;

export type CipoAdapterName = "dom" | "solid" | "react" | "preact";

export type CipoComponent<P extends CipoAnyRecord = CipoAnyRecord> = (
  props: P,
) => unknown;

export type CipoTarget =
  | Element
  | string
  | CipoComponent
  | ((...args: never[]) => unknown);

export type CipoCssInterpolation =
  | CipoPrimitive
  | CipoCssArtifact
  | CipoStyleObject;

export type CipoHtmlTagName = (typeof HTML_TAGS)[number];

export type CipoAnyRecord = Record<string, unknown>;

export interface CipoStyleObject {
  readonly [property: string]:
    | string
    | number
    | CipoStyleObject
    | null
    | undefined;
}

export interface CipoAdapter {
  readonly name?: string;
  readonly classProp: "class" | "className";
  mergeProps(
    props: CipoAnyRecord | null | undefined,
    className: string,
  ): CipoAnyRecord;
  createElement?(
    tag: string,
    props: CipoAnyRecord | null | undefined,
    className: string,
  ): unknown;
  wrapComponent?(
    component: unknown,
    className: string,
  ): CipoComponent;
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
}

export interface CipoTargetOptions {
  readonly adapter?: CipoAdapterName | CipoAdapter;
}

export interface CipoInjectGlobalOptions {
  readonly important?: boolean;
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
  readonly kind: "cipo.css";
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

export interface CipoDomStyledResult<E extends Element = Element> {
  readonly element: E;
  readonly artifact: CipoCssArtifact;
  readonly className: string;
}

export interface CipoStyledBuilder<T = unknown> {
  css(
    strings: TemplateStringsArray,
    ...values: readonly CipoCssInterpolation[]
  ): T;
}

export interface CipoStyledTagFactory {
  css(
    strings: TemplateStringsArray,
    ...values: readonly CipoCssInterpolation[]
  ): CipoComponent;
  attrs(defaultProps: CipoAnyRecord): CipoStyledTagFactory;
}

export interface CipoCallable {
  <E extends Element>(
    target: E,
    options?: CipoTargetOptions,
  ): CipoStyledBuilder<CipoDomStyledResult<E>>;
  <P extends CipoAnyRecord>(
    target: CipoComponent<P>,
    options?: CipoTargetOptions,
  ): CipoStyledBuilder<CipoComponent<P>>;
  (
    target: string,
    options?: CipoTargetOptions,
  ): CipoStyledTagFactory;
  css: typeof css;
  html: typeof html;
  theme: typeof theme;
  configure: typeof configure;
  injectGlobal: typeof injectGlobal;
  explain: typeof explain;
  getCssText: typeof getCssText;
  reset: typeof reset;
  createBrowserGlobal: typeof createBrowserGlobal;
  installBrowserGlobal: typeof installBrowserGlobal;
}

export interface CipoBrowserGlobal {
  readonly cipo: CipoCallable;
  readonly configure: typeof configure;
  readonly theme: typeof theme;
  readonly css: typeof css;
  readonly html: typeof html;
  readonly injectGlobal: typeof injectGlobal;
  readonly explain: typeof explain;
  readonly getCssText: typeof getCssText;
  readonly reset: typeof reset;
  readonly createBrowserGlobal: typeof createBrowserGlobal;
  readonly installBrowserGlobal: typeof installBrowserGlobal;
}

export type CipoAstNode =
  | CipoDeclarationNode
  | CipoBlockNode
  | CipoDirectiveNode;

export interface CipoDeclarationNode {
  readonly type: "declaration";
  readonly property: string;
  readonly value: string;
  readonly source: string;
}

export interface CipoBlockNode {
  readonly type: "block";
  readonly name: string;
  readonly body: readonly CipoAstNode[];
  readonly source: string;
}

export interface CipoDirectiveNode {
  readonly type: "directive";
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
  };
  sheet: CSSStyleSheet | null;
  insertedCss: Set<string>;
  atomicCache: Map<string, CipoAtomicRule>;
  debugAtoms: Map<string, CipoAtomicRule>;
  themeKeys: Set<string>;
  warningSink: CipoWarning[];
}

declare global {
  interface Window {
    Cipo?: CipoBrowserGlobal;
    RodK?: CipoBrowserGlobal;
  }
}

/* ============================================================================
 * Runtime State
 * ========================================================================== */

const DOM_ADAPTER: CipoAdapter = {
  name: "dom",
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
  name: "solid",
  classProp: CLASS_PROP,
  mergeProps(props, className) {
    return mergeClassIntoProps(props, CLASS_PROP, className);
  },
  wrapComponent(component, className) {
    return createGenericWrappedComponent(component, className, CLASS_PROP);
  },
};

const REACT_ADAPTER: CipoAdapter = {
  name: "react",
  classProp: CLASS_NAME_PROP,
  mergeProps(props, className) {
    return mergeClassIntoProps(props, CLASS_NAME_PROP, className);
  },
  wrapComponent(component, className) {
    return createGenericWrappedComponent(component, className, CLASS_NAME_PROP);
  },
};

const PREACT_ADAPTER: CipoAdapter = {
  name: "preact",
  classProp: CLASS_NAME_PROP,
  mergeProps(props, className) {
    return mergeClassIntoProps(props, CLASS_NAME_PROP, className);
  },
  wrapComponent(component, className) {
    return createGenericWrappedComponent(component, className, CLASS_NAME_PROP);
  },
};

const runtime: CipoRuntimeState = {
  config: {
    prefix: DEFAULT_PREFIX,
    debug: false,
    important: false,
    adapter: "dom",
    darkSelector: '[data-theme="dark"]',
    themeRootSelector: ":root",
    breakpoints: {
      base: null,
      sm: null,
      md: "(min-width: 768px)",
      lg: "(min-width: 1024px)",
      xl: "(min-width: 1280px)",
      "2xl": "(min-width: 1536px)",
    },
    onWarning: undefined,
  },
  sheet: null,
  insertedCss: new Set<string>(),
  atomicCache: new Map<string, CipoAtomicRule>(),
  debugAtoms: new Map<string, CipoAtomicRule>(),
  themeKeys: new Set<string>(),
  warningSink: [],
};

/* ============================================================================
 * Public API
 * ========================================================================== */

export function configure(config: CipoRuntimeConfig): void {
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
  };
}

export function theme(tokens: CipoThemeDefinition): void {
  const pairs = flattenTheme(tokens);
  let declarations = EMPTY_STRING;

  for (let index = 0; index < pairs.length; index += 1) {
    const pair = pairs[index];
    const name = pair[0];
    const value = pair[1];

    runtime.themeKeys.add(name);
    declarations += "--";
    declarations += runtime.config.prefix;
    declarations += "-";
    declarations += name;
    declarations += ":";
    declarations += String(value);
    declarations += ";";
  }

  insertCss(runtime.config.themeRootSelector + "{" + declarations + "}");
}

export function css(
  strings: TemplateStringsArray,
  ...values: readonly CipoCssInterpolation[]
): CipoCssArtifact {
  return createCssArtifact(strings, values);
}

export function html(
  strings: TemplateStringsArray,
  ...values: readonly unknown[]
): string {
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

export function injectGlobal(
  strings: TemplateStringsArray,
  ...values: readonly CipoCssInterpolation[]
): string;

export function injectGlobal(
  options: CipoInjectGlobalOptions,
  cssText: string,
): string;

export function injectGlobal(
  artifact: CipoCssArtifact,
  ...artifacts: readonly CipoCssArtifact[]
): string;

export function injectGlobal(
  first:
    | TemplateStringsArray
    | CipoInjectGlobalOptions
    | CipoCssArtifact,
  ...values: readonly (CipoCssInterpolation | CipoCssArtifact | string)[]
): string {
  const warnings: CipoWarning[] = [];
  let important = runtime.config.important;
  let rawCss = EMPTY_STRING;

  if (isCssArtifact(first)) {
    rawCss = first.compiledCss;

    for (let index = 0; index < values.length; index += 1) {
      const value = values[index];

      if (isCssArtifact(value)) {
        rawCss += "\n";
        rawCss += value.compiledCss;
      }
    }
  } else if (isInjectGlobalOptions(first)) {
    important = first.important ?? important;
    rawCss = String(values[0] ?? EMPTY_STRING);
  } else {
    rawCss = buildCss(first, values as readonly CipoCssInterpolation[]);
  }

  const transformedCss = transformCss(rawCss, warnings);
  const compiledCss = important ? addImportantToCssText(transformedCss) : transformedCss;

  insertCss(compiledCss);

  return compiledCss;
}

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

export function reset(): void {
  runtime.sheet = null;
  runtime.insertedCss.clear();
  runtime.atomicCache.clear();
  runtime.debugAtoms.clear();
  runtime.themeKeys.clear();
  runtime.warningSink = [];

  if (hasDocument()) {
    document.getElementById(STYLE_ELEMENT_ID)?.remove();
  }
}

export function createBrowserGlobal(): CipoBrowserGlobal {
  return {
    cipo,
    configure,
    theme,
    css,
    html,
    injectGlobal,
    explain,
    getCssText,
    reset,
    createBrowserGlobal,
    installBrowserGlobal,
  };
}

export function installBrowserGlobal(globalName = "Cipo"): CipoBrowserGlobal {
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
  base.injectGlobal = injectGlobal;
  base.explain = explain;
  base.getCssText = getCssText;
  base.reset = reset;
  base.createBrowserGlobal = createBrowserGlobal;
  base.installBrowserGlobal = installBrowserGlobal;

  if (typeof Proxy === "undefined") {
    installTagFactories(base);
    return base;
  }

  return new Proxy(base, {
    get(target, property, receiver) {
      if (property in target) {
        return Reflect.get(target, property, receiver);
      }

      if (typeof property === "string") {
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

function cipoCore(
  target: CipoTarget,
  options?: CipoTargetOptions,
): CipoStyledBuilder {
  if (isElement(target)) {
    return createDomElementBuilder(target);
  }

  if (typeof target === "string") {
    return createStyledTagFactory(target, options);
  }

  return createComponentBuilder(target, options);
}

function createDomElementBuilder<E extends Element>(
  element: E,
): CipoStyledBuilder<CipoDomStyledResult<E>> {
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

function createComponentBuilder<P extends CipoAnyRecord>(
  component: CipoComponent<P>,
  options?: CipoTargetOptions,
): CipoStyledBuilder<CipoComponent<P>> {
  return {
    css(strings, ...values) {
      const artifact = createCssArtifact(strings, values);
      const adapter = resolveAdapter(options?.adapter);

      if (adapter.wrapComponent) {
        return adapter.wrapComponent(component, artifact.className) as CipoComponent<P>;
      }

      return createGenericWrappedComponent(
        component,
        artifact.className,
        adapter.classProp,
      ) as CipoComponent<P>;
    },
  };
}

function createStyledTagFactory(
  tag: string,
  options?: CipoTargetOptions,
  defaultProps?: CipoAnyRecord,
): CipoStyledTagFactory {
  return {
    css(strings, ...values) {
      const artifact = createCssArtifact(strings, values);
      const adapter = resolveAdapter(options?.adapter);

      return function CipoStyledTag(props: CipoAnyRecord = {}) {
        const mergedBaseProps = defaultProps
          ? mergeObjects(defaultProps, props)
          : props;

        if (adapter.createElement) {
          return adapter.createElement(tag, mergedBaseProps, artifact.className);
        }

        const nextProps = adapter.mergeProps(mergedBaseProps, artifact.className);
        return createPlainComponentPayload(tag, nextProps);
      };
    },
    attrs(nextDefaultProps) {
      return createStyledTagFactory(
        tag,
        options,
        defaultProps ? mergeObjects(defaultProps, nextDefaultProps) : nextDefaultProps,
      );
    },
  };
}

function createPlainComponentPayload(tag: string, props: CipoAnyRecord): CipoAnyRecord {
  return {
    tag,
    props,
  };
}

function createGenericWrappedComponent(
  component: unknown,
  className: string,
  classProp: "class" | "className",
): CipoComponent {
  return function CipoWrappedComponent(props: CipoAnyRecord = {}) {
    const nextProps = mergeClassIntoProps(props, classProp, className);

    if (typeof component === "function") {
      return (component as CipoComponent)(nextProps);
    }

    return {
      component,
      props: nextProps,
    };
  };
}

function createDomElement(
  tag: string,
  props: CipoAnyRecord | null | undefined,
  className: string,
): Element {
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

    if (key === "style" && isPlainObject(value)) {
      applyStyleObject(element as HTMLElement, value as Record<string, unknown>);
      continue;
    }

    if (key.startsWith("on") && typeof value === "function") {
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

function applyStyleObject(element: HTMLElement, styles: Record<string, unknown>): void {
  for (const key in styles) {
    const value = styles[key];

    if (value === null || value === undefined) {
      continue;
    }

    element.style.setProperty(toKebabCase(key), String(value));
  }
}

function applyClassNameToElement(element: Element, className: string): void {
  if (!className) {
    return;
  }

  const parts = className.split(" ");

  for (let index = 0; index < parts.length; index += 1) {
    const item = parts[index];

    if (item) {
      element.classList.add(item);
    }
  }
}

function mergeClassIntoProps(
  props: CipoAnyRecord | null | undefined,
  classProp: "class" | "className",
  className: string,
): CipoAnyRecord {
  const nextProps = props ? { ...props } : {};
  const existing = nextProps[classProp];

  nextProps[classProp] = existing
    ? String(existing) + " " + className
    : className;

  return nextProps;
}

function mergeObjects(
  left: CipoAnyRecord,
  right: CipoAnyRecord,
): CipoAnyRecord {
  return { ...left, ...right };
}

function resolveAdapter(adapter?: CipoAdapterName | CipoAdapter): CipoAdapter {
  const selected = adapter ?? runtime.config.adapter;

  if (typeof selected !== "string") {
    return selected;
  }

  switch (selected) {
    case "solid":
      return SOLID_ADAPTER;
    case "react":
      return REACT_ADAPTER;
    case "preact":
      return PREACT_ADAPTER;
    case "dom":
    default:
      return DOM_ADAPTER;
  }
}

/* ============================================================================
 * CSS Artifact Build
 * ========================================================================== */

function createCssArtifact(
  strings: TemplateStringsArray,
  values: readonly CipoCssInterpolation[],
): CipoCssArtifact {
  const warnings: CipoWarning[] = [];
  const rawCss = buildCss(strings, values);
  const transformedCss = transformCss(rawCss, warnings);
  const ast = parseStylesheet(transformedCss, warnings);
  const scopeClassName = runtime.config.prefix + "-s-" + hashString(transformedCss);
  const atoms: CipoAtomicRule[] = [];
  const scopedRules: CipoScopedRule[] = [];

  collectRules(ast, {}, atoms, scopedRules, warnings, scopeClassName);

  const className = joinClassNames(
    atoms,
    scopedRules.length > 0 ? scopeClassName : EMPTY_STRING,
  );

  const compiledCss = compileCss(atoms, scopedRules);
  const artifactId = runtime.config.prefix + "-artifact-" + hashString(rawCss);

  insertCss(compiledCss);

  return {
    kind: "cipo.css",
    className,
    scopeClassName,
    atoms,
    scopedRules,
    rawCss,
    transformedCss,
    compiledCss,
    debug: {
      id: artifactId,
      atoms,
      scopedRules,
      ast,
      warnings,
    },
    toString: () => className,
    [Symbol.toPrimitive]: () => className,
    [Symbol.toStringTag]: "CipoCssArtifact",
  };
}

/* ============================================================================
 * CSS Build + Transform
 * ========================================================================== */

function buildCss(
  strings: TemplateStringsArray,
  values: readonly CipoCssInterpolation[],
): string {
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

    if (isPlainObject(value)) {
      output += styleObjectToCss(value);
      continue;
    }

    output += String(value ?? EMPTY_STRING);
  }

  return output;
}

function transformCss(input: string, warnings: CipoWarning[]): string {
  return replaceWithDirectives(
    replaceSizeFunctions(
      replaceFluidFunctions(
        replaceAlphaFunctions(
          replaceSpacingFunctions(replaceThemeTokens(stripComments(input))),
          warnings,
        ),
      ),
    ),
    warnings,
  );
}

function stripComments(input: string): string {
  return input.replace(/\/\*[\s\S]*?\*\//g, EMPTY_STRING);
}

function replaceThemeTokens(input: string): string {
  return input
    .replace(/\$theme\.([a-zA-Z0-9._-]+)/g, (_match, tokenPath: string) => {
      return "var(--" + runtime.config.prefix + "-" + tokenPath.replaceAll(".", "-") + ")";
    })
    .replace(/\$([a-zA-Z][\w-]*)/g, (match, tokenName: string) => {
      if (runtime.themeKeys.has(tokenName) || hasCssVariable(tokenName)) {
        return "var(--" + runtime.config.prefix + "-" + tokenName + ")";
      }

      return match;
    });
}

function replaceSpacingFunctions(input: string): string {
  return input.replace(/x:spacing\((.*?)\)/g, (_match, rawValue: string) => {
    return "calc(var(--" + runtime.config.prefix + "-spacing) * " + rawValue.trim() + ")";
  });
}

function replaceAlphaFunctions(input: string, warnings: CipoWarning[]): string {
  return input.replace(/x:alpha\(([\s\S]*?)\)/g, (_match, rawArgs: string) => {
    const parts = splitTopLevel(rawArgs, "/");

    if (parts.length !== 2) {
      warn(warnings, "invalid-alpha-function", "x:alpha() expects `color / amount`.", rawArgs);
      return rawArgs;
    }

    return "color-mix(in oklab, " + parts[0].trim() + " " + parts[1].trim() + ", transparent)";
  });
}

function replaceFluidFunctions(input: string): string {
  return input.replace(/x:fluid\(([\s\S]*?)\)/g, (_match, rawArgs: string) => {
    const parts = splitTopLevel(rawArgs, ",");
    const min = parts[0]?.trim() || "1rem";
    const max = parts[1]?.trim() || "2rem";
    const preferred = parts[2]?.trim() || "calc(" + min + " + 1vw)";

    return "clamp(" + min + ", " + preferred + ", " + max + ")";
  });
}

function replaceSizeFunctions(input: string): string {
  return input.replace(/x:size\(([\s\S]*?)\)/g, (_match, rawValue: string) => {
    const value = rawValue.trim();

    return "width:" + value + ";height:" + value + ";";
  });
}

function replaceWithDirectives(input: string, warnings: CipoWarning[]): string {
  return input.replace(/@with\(([\s\S]*?)\);?/g, (_match, rawArgs: string) => {
    return expandWithUtilities(rawArgs, warnings);
  });
}

/* ============================================================================
 * Utilities Directive
 * ========================================================================== */

function expandWithUtilities(rawArgs: string, warnings: CipoWarning[]): string {
  const utilities = splitTopLevel(rawArgs, ",");
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
      case "hidden":
        return "display:none;";
      case "block":
        return "display:block;";
      case "flex":
        return "display:flex;";
      case "inline-flex":
        return "display:inline-flex;";
      case "grid":
        return "display:grid;";
      case "center":
        return "display:flex;align-items:center;justify-content:center;";
      case "items-center":
        return "align-items:center;";
      case "justify-center":
        return "justify-content:center;";
      case "sr-only":
        return "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
      default:
        warn(warnings, "unknown-utility", 'Unknown @with utility "' + rawUtility + '".', rawUtility);
        return EMPTY_STRING;
    }
  }

  const value = call.args.join(",").trim();

  switch (call.name) {
    case "bg":
      return "background:" + value + ";";
    case "color":
      return "color:" + value + ";";
    case "font-size":
      return "font-size:" + value + ";";
    case "text":
      return expandTextUtility(value, warnings);
    case "py":
      return "padding-block:" + value + ";";
    case "px":
      return "padding-inline:" + value + ";";
    case "pt":
      return "padding-top:" + value + ";";
    case "pr":
      return "padding-right:" + value + ";";
    case "pb":
      return "padding-bottom:" + value + ";";
    case "pl":
      return "padding-left:" + value + ";";
    case "p":
      return "padding:" + value + ";";
    case "m":
      return "margin:" + value + ";";
    case "mx":
      return "margin-inline:" + value + ";";
    case "my":
      return "margin-block:" + value + ";";
    case "rounded":
      return "border-radius:" + value + ";";
    case "w":
      return "width:" + value + ";";
    case "h":
      return "height:" + value + ";";
    case "size":
      return "width:" + value + ";height:" + value + ";";
    case "shadow":
      return "box-shadow:" + value + ";";
    default:
      warn(warnings, "unknown-utility", 'Unknown @with utility "' + call.name + '".', rawUtility);
      return EMPTY_STRING;
  }
}

function expandTextUtility(value: string, warnings: CipoWarning[]): string {
  const typed = parseTypedArguments(value);

  if (typed.color) {
    return "color:" + typed.color + ";";
  }

  if (typed.length) {
    return "font-size:" + typed.length + ";";
  }

  warn(
    warnings,
    "ambiguous-text-utility",
    "text() needs a typed argument like text(color: red) or text(length: 1rem).",
    value,
  );

  return EMPTY_STRING;
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

    if (char !== "{") {
      buffer += char;
      index += 1;
      continue;
    }

    const blockName = buffer.trim();
    buffer = EMPTY_STRING;

    const endIndex = findMatchingBrace(input, index);

    if (endIndex < 0) {
      warn(warnings, "unclosed-block", 'Block "' + blockName + '" is missing a closing brace.', input.slice(index));
      buffer += input.slice(index);
      break;
    }

    const body = input.slice(index + 1, endIndex);

    nodes.push({
      type: "block",
      name: blockName,
      body: parseBlockBody(body, warnings),
      source: blockName + "{" + body + "}",
    });

    index = endIndex + 1;
  }

  appendDeclarationsAndDirectives(nodes, buffer, warnings);

  return nodes;
}

function appendDeclarationsAndDirectives(
  nodes: CipoAstNode[],
  input: string,
  warnings: CipoWarning[],
): void {
  const chunks = splitTopLevel(input, ";");

  for (let index = 0; index < chunks.length; index += 1) {
    const source = chunks[index].trim();

    if (!source) {
      continue;
    }

    if (source.startsWith("@")) {
      const directive = parseDirective(source, warnings);

      if (directive) {
        nodes.push(directive);
      }

      continue;
    }

    const colonIndex = findTopLevelColon(source);

    if (colonIndex <= 0) {
      warn(warnings, "invalid-declaration", 'Invalid declaration "' + source + '".', source);
      continue;
    }

    nodes.push({
      type: "declaration",
      property: source.slice(0, colonIndex).trim(),
      value: source.slice(colonIndex + 1).trim(),
      source,
    });
  }
}

function parseDeclarationsAndDirectives(
  input: string,
  warnings: CipoWarning[],
): readonly CipoAstNode[] {
  const nodes: CipoAstNode[] = [];

  appendDeclarationsAndDirectives(nodes, input, warnings);

  return nodes;
}

function parseDirective(source: string, warnings: CipoWarning[]): CipoDirectiveNode | null {
  const match = source.match(/^@([a-zA-Z][\w-]*)\(([\s\S]*)\)$/);

  if (!match) {
    warn(warnings, "invalid-directive", 'Invalid directive "' + source + '".', source);
    return null;
  }

  return {
    type: "directive",
    name: match[1],
    args: splitTopLevel(match[2], ","),
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

    if (node.type === "declaration") {
      collectDeclaration(node, context, atoms);
      continue;
    }

    if (node.type === "directive") {
      collectDirective(node, context, atoms, warnings, scopeClassName);
      continue;
    }

    collectBlock(node, context, atoms, scopedRules, warnings, scopeClassName);
  }
}

function collectDeclaration(
  declaration: CipoDeclarationNode,
  context: CipoRuleContext,
  atoms: CipoAtomicRule[],
): void {
  const expanded = expandResponsiveDeclaration(declaration);

  if (!expanded) {
    atoms.push(createAtomicRule(declaration, context));
    return;
  }

  for (let index = 0; index < expanded.length; index += 1) {
    const item = expanded[index];

    atoms.push(
      createAtomicRule(
        {
          type: "declaration",
          property: declaration.property,
          value: item.value,
          source: declaration.property + ":" + item.value,
        },
        resolveBreakpointContext(context, item.breakpoint),
      ),
    );
  }
}

function collectDirective(
  directive: CipoDirectiveNode,
  context: CipoRuleContext,
  atoms: CipoAtomicRule[],
  warnings: CipoWarning[],
  scopeClassName: string,
): void {
  if (directive.name !== "with") {
    warn(warnings, "unknown-directive", 'Unknown directive "@' + directive.name + '".', directive);
    return;
  }

  const expanded = expandWithUtilities(directive.args.join(","), warnings);
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

  if (name.startsWith("x:not(")) {
    const breakpoint = name.replace(/^x:not\(/, EMPTY_STRING).replace(/\)$/, EMPTY_STRING).trim();

    collectRules(
      block.body,
      { ...context, notBreakpoint: breakpoint },
      atoms,
      scopedRules,
      warnings,
      scopeClassName,
    );

    return;
  }

  if (name.startsWith("x:")) {
    const next = name.slice(2).trim();

    if (next in runtime.config.breakpoints) {
      collectRules(
        block.body,
        resolveBreakpointContext(context, next),
        atoms,
        scopedRules,
        warnings,
        scopeClassName,
      );

      return;
    }

    if (next === "dark") {
      collectRules(
        block.body,
        { ...context, dark: true },
        atoms,
        scopedRules,
        warnings,
        scopeClassName,
      );

      return;
    }

    if (isPseudoName(next)) {
      collectRules(
        block.body,
        { ...context, pseudo: ":" + next },
        atoms,
        scopedRules,
        warnings,
        scopeClassName,
      );

      return;
    }
  }

  const declarations: CipoDeclarationNode[] = [];

  for (let index = 0; index < block.body.length; index += 1) {
    const node = block.body[index];

    if (node.type === "declaration") {
      declarations.push(node);
    }
  }

  if (declarations.length === 0) {
    return;
  }

  scopedRules.push({
    selector: resolveScopedSelector(scopeClassName, name),
    declarations,
    context,
  });
}

/* ============================================================================
 * Responsive Values
 * ========================================================================== */

function expandResponsiveDeclaration(
  declaration: CipoDeclarationNode,
): Array<{ readonly breakpoint: string; readonly value: string }> | null {
  const parts = splitTopLevel(declaration.value, ",");
  const result: Array<{ readonly breakpoint: string; readonly value: string }> = [];
  let hasResponsive = false;

  for (let index = 0; index < parts.length; index += 1) {
    const trimmed = parts[index].trim();
    const match = trimmed.match(/^x:([a-zA-Z][\w-]*)\(([\s\S]*)\)$/);

    if (!match) {
      result.push({ breakpoint: "base", value: trimmed });
      continue;
    }

    const breakpoint = match[1];
    const value = match[2].trim();

    if (!(breakpoint in runtime.config.breakpoints)) {
      result.push({ breakpoint: "base", value: trimmed });
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

function createAtomicRule(
  declaration: CipoDeclarationNode,
  context: CipoRuleContext,
): CipoAtomicRule {
  const property = normalizeCss(declaration.property);
  const value = normalizeCss(declaration.value);
  const normalizedValue = runtime.config.important ? addImportant(value) : value;
  const id =
    property +
    "|" +
    normalizedValue +
    "|" +
    (context.mediaQuery ?? EMPTY_STRING) +
    "|" +
    (context.pseudo ?? EMPTY_STRING) +
    "|" +
    (context.dark ? "dark" : EMPTY_STRING) +
    "|" +
    (context.notBreakpoint ?? EMPTY_STRING);

  const cached = runtime.atomicCache.get(id);

  if (cached) {
    return cached;
  }

  const className = runtime.config.prefix + "-a-" + hashString(id);

  const atom: CipoAtomicRule = {
    id,
    className,
    property: declaration.property,
    value: normalizedValue,
    context,
    source: declaration.source,
  };

  runtime.atomicCache.set(id, atom);
  runtime.debugAtoms.set(className, atom);

  return atom;
}

function compileCss(
  atoms: readonly CipoAtomicRule[],
  scopedRules: readonly CipoScopedRule[],
): string {
  let output = EMPTY_STRING;

  for (let index = 0; index < atoms.length; index += 1) {
    output += compileAtomicRule(atoms[index]);
    output += "\n";
  }

  for (let index = 0; index < scopedRules.length; index += 1) {
    output += compileScopedRule(scopedRules[index]);
    output += "\n";
  }

  return output.trim();
}

function compileAtomicRule(atom: CipoAtomicRule): string {
  const selector = compileSelector(atom.className, atom.context);

  return wrapContext(selector + "{" + atom.property + ":" + atom.value + ";}", atom.context);
}

function compileScopedRule(rule: CipoScopedRule): string {
  let declarations = EMPTY_STRING;

  for (let index = 0; index < rule.declarations.length; index += 1) {
    const declaration = rule.declarations[index];
    const value = runtime.config.important ? addImportant(declaration.value) : declaration.value;

    declarations += declaration.property;
    declarations += ":";
    declarations += value;
    declarations += ";";
  }

  return wrapContext(rule.selector + "{" + declarations + "}", rule.context);
}

function compileSelector(className: string, context: CipoRuleContext): string {
  let selector = "." + className;

  if (context.pseudo) {
    selector += context.pseudo;
  }

  if (context.dark) {
    selector = runtime.config.darkSelector + " " + selector;
  }

  return selector;
}

function wrapContext(rule: string, context: CipoRuleContext): string {
  let output = rule;

  if (context.mediaQuery) {
    output = "@media " + context.mediaQuery + "{" + output + "}";
  }

  if (context.notBreakpoint) {
    const query = runtime.config.breakpoints[context.notBreakpoint];

    if (query) {
      output = "@media not all and " + query + "{" + output + "}";
    }
  }

  return output;
}

/* ============================================================================
 * Global CSS Important Transformer
 * ========================================================================== */

function addImportantToCssText(cssText: string): string {
  const chunks = splitTopLevelRules(cssText);
  let output = EMPTY_STRING;

  for (let index = 0; index < chunks.length; index += 1) {
    output += addImportantToRule(chunks[index]);
    output += "\n";
  }

  return output.trim();
}

function addImportantToRule(rule: string): string {
  const openIndex = rule.indexOf("{");
  const closeIndex = rule.lastIndexOf("}");

  if (openIndex < 0 || closeIndex <= openIndex) {
    return rule;
  }

  const head = rule.slice(0, openIndex).trim();
  const body = rule.slice(openIndex + 1, closeIndex);

  if (head.startsWith("@")) {
    return head + "{" + addImportantToCssText(body) + "}";
  }

  const declarations = parseDeclarationsAndDirectives(body, []);
  let nextBody = EMPTY_STRING;

  for (let index = 0; index < declarations.length; index += 1) {
    const node = declarations[index];

    if (node.type !== "declaration") {
      continue;
    }

    nextBody += node.property;
    nextBody += ":";
    nextBody += addImportant(node.value);
    nextBody += ";";
  }

  return head + "{" + nextBody + "}";
}

function addImportant(value: string): string {
  return /\s!important\s*$/i.test(value) ? value : value + " !important";
}

/* ============================================================================
 * DOM Style Injection
 * ========================================================================== */

function insertCss(cssText: string): void {
  if (!hasDocument() || !cssText) {
    return;
  }

  const rules = splitTopLevelRules(cssText);
  const style = ensureStyleElement();
  const sheet = style.sheet;

  for (let index = 0; index < rules.length; index += 1) {
    const rule = rules[index];
    const normalized = normalizeCss(rule);

    if (!normalized || runtime.insertedCss.has(normalized)) {
      continue;
    }

    runtime.insertedCss.add(normalized);

    if (sheet) {
      try {
        sheet.insertRule(rule, sheet.cssRules.length);
        continue;
      } catch {
        style.appendChild(document.createTextNode("\n" + rule + "\n"));
        continue;
      }
    }

    style.appendChild(document.createTextNode("\n" + rule + "\n"));
  }

  runtime.sheet = sheet ?? null;
}

function ensureStyleElement(): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ELEMENT_ID);

  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const element = document.createElement("style");
  element.id = STYLE_ELEMENT_ID;
  element.dataset.cipo = "runtime";

  document.head.appendChild(element);

  return element;
}

/* ============================================================================
 * Utility Helpers
 * ========================================================================== */

function flattenTheme(
  tokens: CipoThemeDefinition,
  path: readonly string[] = [],
): Array<readonly [string, string | number]> {
  const output: Array<readonly [string, string | number]> = [];
  const entries = Object.entries(tokens);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const key = entry[0];
    const value = entry[1];
    const nextPath = path.length === 0 ? [key] : [...path, key];

    if (isPlainObject(value)) {
      const child = flattenTheme(value as CipoThemeDefinition, nextPath);

      for (let childIndex = 0; childIndex < child.length; childIndex += 1) {
        output.push(child[childIndex]);
      }

      continue;
    }

    output.push([nextPath.join("-"), value]);
  }

  return output;
}

function styleObjectToCss(styleObject: CipoStyleObject): string {
  let output = EMPTY_STRING;
  const entries = Object.entries(styleObject);

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const key = entry[0];
    const value = entry[1];

    if (value === null || value === undefined) {
      continue;
    }

    if (isPlainObject(value)) {
      output += key;
      output += "{";
      output += styleObjectToCss(value as CipoStyleObject);
      output += "}";
      continue;
    }

    output += toKebabCase(key);
    output += ":";
    output += String(value);
    output += ";";
  }

  return output;
}

function parseFunctionCall(input: string): null | {
  readonly name: string;
  readonly args: readonly string[];
} {
  const openIndex = input.indexOf("(");
  const closeIndex = input.lastIndexOf(")");

  if (openIndex < 0 || closeIndex <= openIndex) {
    return null;
  }

  return {
    name: input.slice(0, openIndex).trim(),
    args: splitTopLevel(input.slice(openIndex + 1, closeIndex), ","),
  };
}

function parseTypedArguments(input: string): Record<string, string> {
  const result: Record<string, string> = {};
  const parts = splitTopLevel(input, ",");

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

      if (char === quote && input[index - 1] !== "\\") {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      buffer += char;
      continue;
    }

    if (char === "(" || char === "[") {
      depth += 1;
    } else if (char === ")" || char === "]") {
      depth -= 1;
    }

    if (char === separator && depth === 0) {
      if (buffer.trim()) {
        output.push(buffer.trim());
      }

      buffer = EMPTY_STRING;
      continue;
    }

    buffer += char;
  }

  if (buffer.trim()) {
    output.push(buffer.trim());
  }

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
      if (char === quote && input[index - 1] !== "\\") {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }

    if (depth === 0 && char === "}") {
      output.push(input.slice(start, index + 1).trim());
      start = index + 1;
    }
  }

  return output.filter(Boolean);
}

function findMatchingBrace(input: string, startIndex: number): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = startIndex; index < input.length; index += 1) {
    const char = input[index];

    if (quote) {
      if (char === quote && input[index - 1] !== "\\") {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
    }

    if (depth === 0) {
      return index;
    }
  }

  return -1;
}

function findTopLevelColon(input: string): number {
  let depth = 0;
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (quote) {
      if (char === quote && input[index - 1] !== "\\") {
        quote = null;
      }

      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "(" || char === "[") {
      depth += 1;
    } else if (char === ")" || char === "]") {
      depth -= 1;
    } else if (char === ":" && depth === 0) {
      return index;
    }
  }

  return -1;
}

function resolveScopedSelector(scopeClassName: string, selector: string): string {
  const normalized = selector.trim();

  if (!normalized) {
    return "." + scopeClassName;
  }

  if (normalized.includes("&")) {
    return normalized.replaceAll("&", "." + scopeClassName);
  }

  return "." + scopeClassName + " " + normalized;
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

    if (seen.has(className)) {
      continue;
    }

    seen.add(className);
    output += output ? " " + className : className;
  }

  return output;
}

function normalizeCss(input: string): string {
  return input.replace(/\s+/g, " ").replace(/\s*([{}:;,>+~])\s*/g, "$1").trim();
}

function hashString(input: string): string {
  let hash = HASH_SEED;

  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(index)) & HASH_MASK;
  }

  return (hash >>> 0).toString(36);
}

function toKebabCase(input: string): string {
  return input.replace(/[A-Z]/g, match => "-" + match.toLowerCase());
}

function warn(
  warnings: CipoWarning[],
  code: string,
  message: string,
  context?: unknown,
): void {
  const warning = { code, message, context };

  warnings.push(warning);
  runtime.warningSink.push(warning);
  runtime.config.onWarning?.(warning);

  if (runtime.config.debug) {
    console.warn("[Cipó:" + code + "] " + message, context ?? EMPTY_STRING);
  }
}

function hasCssVariable(tokenName: string): boolean {
  if (!hasDocument()) {
    return false;
  }

  const variableName = "--" + runtime.config.prefix + "-" + tokenName;
  const root = document.querySelector(runtime.config.themeRootSelector) ?? document.documentElement;

  return getComputedStyle(root).getPropertyValue(variableName).trim().length > 0;
}

function hasDocument(): boolean {
  return typeof document !== "undefined" && Boolean(document.head);
}

function isCssArtifact(value: unknown): value is CipoCssArtifact {
  return isPlainObject(value) && value.kind === "cipo.css";
}

function isInjectGlobalOptions(value: unknown): value is CipoInjectGlobalOptions {
  return isPlainObject(value) && "important" in value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return prototype === Object.prototype || prototype === null;
}

function isElement(value: unknown): value is Element {
  return typeof Element !== "undefined" && value instanceof Element;
}

function isNode(value: unknown): value is Node {
  return typeof Node !== "undefined" && value instanceof Node;
}

function isPseudoName(name: string): boolean {
  switch (name) {
    case "hover":
    case "focus":
    case "active":
    case "disabled":
    case "checked":
    case "focus-visible":
    case "focus-within":
    case "visited":
    case "first-child":
    case "last-child":
    case "before":
    case "after":
      return true;
    default:
      return false;
  }
}

/* ============================================================================
 * Public Callable Instance
 * ========================================================================== */

export const cipo = createCipoCallable();

/* ============================================================================
 * Browser Global Install
 * ========================================================================== */

if (typeof window !== "undefined") {
  window.Cipo = createBrowserGlobal();
  window.RodK = window.Cipo;
}
