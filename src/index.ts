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
 * html`
 *   <button class="${button}">
 *     Save
 *   </button>
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
 * 2. Theme tokens
 *
 * theme({
 *   colors: {
 *     brand: "#22c55e",
 *   },
 *   spacing: "0.25rem",
 * });
 *
 * const title = css`
 *   color: $theme.colors.brand;
 *   padding: x:spacing(4);
 * `;
 *
 * Output CSS:
 *
 * :root{--cipo-colors-brand:#22c55e;--cipo-spacing:0.25rem;}
 * .cipo-a-xxxxx{color:var(--cipo-colors-brand);}
 * .cipo-a-yyyyy{padding:calc(var(--cipo-spacing) * 4);}
 *
 * ----------------------------------------------------------------------------
 *
 * 3. Utility directive
 *
 * const card = css`
 *   @with(
 *     bg(#111827),
 *     color(white),
 *     px(16px),
 *     py(12px),
 *     rounded(18px)
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
 *
 * ----------------------------------------------------------------------------
 *
 * 4. Responsive block
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
 * 5. Dark mode block
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
 * 6. Pseudo block
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
 * 7. Scoped selector
 *
 * const list = css`
 *   padding: 0;
 *
 *   li {
 *     list-style: none;
 *     padding: 8px;
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
 *
 * ----------------------------------------------------------------------------
 *
 * 8. Scoped self selector with &
 *
 * const button = css`
 *   background: #111827;
 *
 *   &:hover {
 *     background: #1f2937;
 *   }
 * `;
 *
 * Output CSS:
 *
 * .cipo-a-xxxxx{background:#111827;}
 * .cipo-s-yyyyy:hover{background:#1f2937;}
 *
 * ----------------------------------------------------------------------------
 *
 * 9. Browser globals
 *
 * window.Cipo.css`
 *   color: red;
 * `;
 *
 * window.RodK.css`
 *   color: blue;
 * `;
 *
 * installBrowserGlobal("MyCss");
 *
 * window.MyCss.css`
 *   color: green;
 * `;
 *
 * Output globals:
 *
 * window.Cipo.configure
 * window.Cipo.theme
 * window.Cipo.css
 * window.Cipo.html
 * window.Cipo.explain
 * window.Cipo.getCssText
 * window.Cipo.reset
 * window.Cipo.installBrowserGlobal
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

/* ============================================================================
 * Public Types
 * ========================================================================== */

export type CipoPrimitive = string | number | boolean | null | undefined;

export type CipoCssInterpolation =
  | CipoPrimitive
  | CipoCssArtifact
  | CipoStyleObject;

export interface CipoStyleObject {
  readonly [property: string]:
    | string
    | number
    | CipoStyleObject
    | null
    | undefined;
}

export interface CipoRuntimeConfig {
  readonly prefix?: string;
  readonly debug?: boolean;
  readonly darkSelector?: string;
  readonly breakpoints?: Readonly<Record<string, string | null>>;
  readonly themeRootSelector?: string;
  readonly onWarning?: (warning: CipoWarning) => void;
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
    darkSelector: string;
    themeRootSelector: string;
    breakpoints: Readonly<Record<string, string | null>>;
    onWarning?: (warning: CipoWarning) => void;
  };
  sheet: CSSStyleSheet | null;
  insertedCss: Set<string>;
  atomicCache: Map<string, CipoAtomicRule>;
  debugAtoms: Map<string, CipoAtomicRule>;
  warnings: CipoWarning[];
}

/* ============================================================================
 * Runtime State
 * ========================================================================== */

const runtime: CipoRuntimeState = {
  config: {
    prefix: DEFAULT_PREFIX,
    debug: true,
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
  warnings: [],
};

/* ============================================================================
 * Public API
 * ========================================================================== */

export function configure(config: CipoRuntimeConfig): void {
  runtime.config = {
    prefix: config.prefix ?? runtime.config.prefix,
    debug: config.debug ?? runtime.config.debug,
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
  let declarations = "";

  for (let index = 0; index < pairs.length; index += 1) {
    const [name, value] = pairs[index];
    declarations += `--${runtime.config.prefix}-${name}:${String(value)};`;
  }

  insertCss(`${runtime.config.themeRootSelector}{${declarations}}`);
}

export function css(
  strings: TemplateStringsArray,
  ...values: readonly CipoCssInterpolation[]
): CipoCssArtifact {
  const warnings: CipoWarning[] = [];
  const rawCss = buildCss(strings, values);
  const transformedCss = transformCss(rawCss, warnings);
  const ast = parseStylesheet(transformedCss, warnings);
  const scopeClassName = `${runtime.config.prefix}-s-${hashString(transformedCss)}`;
  const atoms: CipoAtomicRule[] = [];
  const scopedRules: CipoScopedRule[] = [];

  collectRules(ast, {}, atoms, scopedRules, warnings, scopeClassName);

  const className = joinClassNames(
    atoms,
    scopedRules.length > 0 ? scopeClassName : "",
  );

  const compiledCss = compileCss(atoms, scopedRules);
  const artifactId = `${runtime.config.prefix}-artifact-${hashString(rawCss)}`;

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

export function html(
  strings: TemplateStringsArray,
  ...values: readonly unknown[]
): string {
  let output = "";

  for (let index = 0; index < strings.length; index += 1) {
    output += strings[index];

    if (index >= values.length) {
      continue;
    }

    const value = values[index];
    output += Array.isArray(value) ? value.join("") : String(value ?? "");
  }

  return output;
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
    return "";
  }

  const style = document.getElementById(STYLE_ELEMENT_ID);

  if (!(style instanceof HTMLStyleElement)) {
    return "";
  }

  return style.textContent ?? "";
}

export function reset(): void {
  runtime.sheet = null;
  runtime.insertedCss.clear();
  runtime.atomicCache.clear();
  runtime.debugAtoms.clear();
  runtime.warnings = [];

  if (hasDocument()) {
    document.getElementById(STYLE_ELEMENT_ID)?.remove();
  }
}

export function installBrowserGlobal(globalName = "RodK"): void {
  const target = globalThis as typeof globalThis & Record<string, unknown>;

  target[globalName] = {
    configure,
    theme,
    css,
    html,
    explain,
    getCssText,
    reset,
  };
}

/* ============================================================================
 * CSS Build + Transform
 * ========================================================================== */

function buildCss(
  strings: TemplateStringsArray,
  values: readonly CipoCssInterpolation[],
): string {
  let output = "";

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

    output += String(value ?? "");
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
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

function replaceThemeTokens(input: string): string {
  return input.replace(/\$theme\.([a-zA-Z0-9._-]+)/g, (_match, tokenPath: string) => {
    return `var(--${runtime.config.prefix}-${tokenPath.replaceAll(".", "-")})`;
  });
}

function replaceSpacingFunctions(input: string): string {
  return input.replace(/x:spacing\((.*?)\)/g, (_match, rawValue: string) => {
    return `calc(var(--${runtime.config.prefix}-spacing) * ${rawValue.trim()})`;
  });
}

function replaceAlphaFunctions(input: string, warnings: CipoWarning[]): string {
  return input.replace(/x:alpha\(([\s\S]*?)\)/g, (_match, rawArgs: string) => {
    const parts = splitTopLevel(rawArgs, "/");

    if (parts.length !== 2) {
      warn(warnings, "invalid-alpha-function", "x:alpha() expects `color / amount`.", rawArgs);
      return rawArgs;
    }

    return `color-mix(in oklab, ${parts[0].trim()} ${parts[1].trim()}, transparent)`;
  });
}

function replaceFluidFunctions(input: string): string {
  return input.replace(/x:fluid\(([\s\S]*?)\)/g, (_match, rawArgs: string) => {
    const parts = splitTopLevel(rawArgs, ",");
    const min = parts[0]?.trim() || "1rem";
    const max = parts[1]?.trim() || "2rem";
    const preferred = parts[2]?.trim() || `calc(${min} + 1vw)`;

    return `clamp(${min}, ${preferred}, ${max})`;
  });
}

function replaceSizeFunctions(input: string): string {
  return input.replace(/x:size\(([\s\S]*?)\)/g, (_match, rawValue: string) => {
    const value = rawValue.trim();

    return `width:${value};height:${value};`;
  });
}

function replaceWithDirectives(input: string, warnings: CipoWarning[]): string {
  return input.replace(/@with\(([\s\S]*?)\);?/g, (_match, rawArgs: string) => {
    return expandWithUtilities(rawArgs, warnings);
  });
}

/* ============================================================================
 * `@with` Utilities
 * ========================================================================== */

function expandWithUtilities(rawArgs: string, warnings: CipoWarning[]): string {
  const utilities = splitTopLevel(rawArgs, ",");
  let output = "";

  for (const utility of utilities) {
    output += expandUtility(utility.trim(), warnings);
  }

  return output;
}

function expandUtility(rawUtility: string, warnings: CipoWarning[]): string {
  if (!rawUtility) {
    return "";
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
        warn(warnings, "unknown-utility", `Unknown @with utility "${rawUtility}".`, rawUtility);
        return "";
    }
  }

  const value = call.args.join(",").trim();

  switch (call.name) {
    case "bg":
      return `background:${value};`;
    case "color":
      return `color:${value};`;
    case "font-size":
      return `font-size:${value};`;
    case "text":
      return expandTextUtility(value, warnings);
    case "py":
      return `padding-block:${value};`;
    case "px":
      return `padding-inline:${value};`;
    case "pt":
      return `padding-top:${value};`;
    case "pr":
      return `padding-right:${value};`;
    case "pb":
      return `padding-bottom:${value};`;
    case "pl":
      return `padding-left:${value};`;
    case "p":
      return `padding:${value};`;
    case "m":
      return `margin:${value};`;
    case "mx":
      return `margin-inline:${value};`;
    case "my":
      return `margin-block:${value};`;
    case "rounded":
      return `border-radius:${value};`;
    case "w":
      return `width:${value};`;
    case "h":
      return `height:${value};`;
    case "size":
      return `width:${value};height:${value};`;
    case "shadow":
      return `box-shadow:${value};`;
    default:
      warn(warnings, "unknown-utility", `Unknown @with utility "${call.name}".`, rawUtility);
      return "";
  }
}

function expandTextUtility(value: string, warnings: CipoWarning[]): string {
  const typed = parseTypedArguments(value);

  if (typed.color) {
    return `color:${typed.color};`;
  }

  if (typed.length) {
    return `font-size:${typed.length};`;
  }

  warn(
    warnings,
    "ambiguous-text-utility",
    "text() needs a typed argument like text(color: red) or text(length: 1rem).",
    value,
  );

  return "";
}

/* ============================================================================
 * Parser
 * ========================================================================== */

function parseStylesheet(input: string, warnings: CipoWarning[]): readonly CipoAstNode[] {
  return parseBlockBody(input, warnings);
}

function parseBlockBody(input: string, warnings: CipoWarning[]): readonly CipoAstNode[] {
  const nodes: CipoAstNode[] = [];
  let buffer = "";
  let index = 0;

  while (index < input.length) {
    const char = input[index];

    if (char !== "{") {
      buffer += char;
      index += 1;
      continue;
    }

    const blockName = buffer.trim();
    buffer = "";

    const endIndex = findMatchingBrace(input, index);

    if (endIndex < 0) {
      warn(warnings, "unclosed-block", `Block "${blockName}" is missing a closing brace.`, input.slice(index));
      buffer += input.slice(index);
      break;
    }

    const body = input.slice(index + 1, endIndex);

    nodes.push({
      type: "block",
      name: blockName,
      body: parseBlockBody(body, warnings),
      source: `${blockName}{${body}}`,
    });

    index = endIndex + 1;
  }

  nodes.push(...parseDeclarationsAndDirectives(buffer, warnings));
  return nodes;
}

function parseDeclarationsAndDirectives(
  input: string,
  warnings: CipoWarning[],
): readonly CipoAstNode[] {
  const nodes: CipoAstNode[] = [];

  for (const chunk of splitTopLevel(input, ";")) {
    const source = chunk.trim();

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
      warn(warnings, "invalid-declaration", `Invalid declaration "${source}".`, source);
      continue;
    }

    nodes.push({
      type: "declaration",
      property: source.slice(0, colonIndex).trim(),
      value: source.slice(colonIndex + 1).trim(),
      source,
    });
  }

  return nodes;
}

function parseDirective(source: string, warnings: CipoWarning[]): CipoDirectiveNode | null {
  const match = source.match(/^@([a-zA-Z][\w-]*)\(([\s\S]*)\)$/);

  if (!match) {
    warn(warnings, "invalid-directive", `Invalid directive "${source}".`, source);
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
  for (const node of nodes) {
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

  for (const item of expanded) {
    atoms.push(
      createAtomicRule(
        {
          type: "declaration",
          property: declaration.property,
          value: item.value,
          source: `${declaration.property}:${item.value}`,
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
    warn(warnings, "unknown-directive", `Unknown directive "@${directive.name}".`, directive);
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
    const breakpoint = name.replace(/^x:not\(/, "").replace(/\)$/, "").trim();

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
        { ...context, pseudo: `:${next}` },
        atoms,
        scopedRules,
        warnings,
        scopeClassName,
      );

      return;
    }
  }

  const declarations = block.body.filter(isDeclarationNode);

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

  for (const part of parts) {
    const trimmed = part.trim();
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
  const id = `${property}|${value}|${context.mediaQuery ?? ""}|${context.pseudo ?? ""}|${context.dark ? "dark" : ""}|${context.notBreakpoint ?? ""}`;
  const cached = runtime.atomicCache.get(id);

  if (cached) {
    return cached;
  }

  const className = `${runtime.config.prefix}-a-${hashString(id)}`;

  const atom: CipoAtomicRule = {
    id,
    className,
    property: declaration.property,
    value: declaration.value,
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
  let output = "";

  for (const atom of atoms) {
    output += compileAtomicRule(atom);
    output += "\n";
  }

  for (const scopedRule of scopedRules) {
    output += compileScopedRule(scopedRule);
    output += "\n";
  }

  return output.trim();
}

function compileAtomicRule(atom: CipoAtomicRule): string {
  const selector = compileSelector(atom.className, atom.context);
  return wrapContext(`${selector}{${atom.property}:${atom.value};}`, atom.context);
}

function compileScopedRule(rule: CipoScopedRule): string {
  let declarations = "";

  for (const declaration of rule.declarations) {
    declarations += `${declaration.property}:${declaration.value};`;
  }

  return wrapContext(`${rule.selector}{${declarations}}`, rule.context);
}

function compileSelector(className: string, context: CipoRuleContext): string {
  let selector = `.${className}`;

  if (context.pseudo) {
    selector += context.pseudo;
  }

  if (context.dark) {
    selector = `${runtime.config.darkSelector} ${selector}`;
  }

  return selector;
}

function wrapContext(rule: string, context: CipoRuleContext): string {
  let output = rule;

  if (context.mediaQuery) {
    output = `@media ${context.mediaQuery}{${output}}`;
  }

  if (context.notBreakpoint) {
    const query = runtime.config.breakpoints[context.notBreakpoint];

    if (query) {
      output = `@media not all and ${query}{${output}}`;
    }
  }

  return output;
}

/* ============================================================================
 * DOM Style Injection
 * ========================================================================== */

function insertCss(cssText: string): void {
  if (!hasDocument()) {
    return;
  }

  const rules = splitTopLevelRules(cssText);
  const style = ensureStyleElement();
  const sheet = style.sheet;

  for (const rule of rules) {
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
        style.appendChild(document.createTextNode(`\n${rule}\n`));
        continue;
      }
    }

    style.appendChild(document.createTextNode(`\n${rule}\n`));
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

  for (const [key, value] of Object.entries(tokens)) {
    const nextPath = [...path, key];

    if (isPlainObject(value)) {
      output.push(...flattenTheme(value as CipoThemeDefinition, nextPath));
      continue;
    }

    output.push([nextPath.join("-"), value]);
  }

  return output;
}

function styleObjectToCss(styleObject: CipoStyleObject): string {
  let output = "";

  for (const [key, value] of Object.entries(styleObject)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (isPlainObject(value)) {
      output += `${key}{${styleObjectToCss(value as CipoStyleObject)}}`;
      continue;
    }

    output += `${toKebabCase(key)}:${String(value)};`;
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

  for (const part of splitTopLevel(input, ",")) {
    const index = findTopLevelColon(part);

    if (index <= 0) {
      continue;
    }

    result[part.slice(0, index).trim()] = part.slice(index + 1).trim();
  }

  return result;
}

function splitTopLevel(input: string, separator: string): string[] {
  const output: string[] = [];
  let buffer = "";
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

    if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth -= 1;

    if (char === separator && depth === 0) {
      if (buffer.trim()) {
        output.push(buffer.trim());
      }

      buffer = "";
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

    if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;

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

    if (char === "{") depth += 1;
    else if (char === "}") depth -= 1;

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

    if (char === "(" || char === "[") depth += 1;
    else if (char === ")" || char === "]") depth -= 1;
    else if (char === ":" && depth === 0) return index;
  }

  return -1;
}

function resolveScopedSelector(scopeClassName: string, selector: string): string {
  const normalized = selector.trim();

  if (!normalized) {
    return `.${scopeClassName}`;
  }

  if (normalized.includes("&")) {
    return normalized.replaceAll("&", `.${scopeClassName}`);
  }

  return `.${scopeClassName} ${normalized}`;
}

function joinClassNames(atoms: readonly CipoAtomicRule[], scopeClassName: string): string {
  const seen = new Set<string>();
  let output = "";

  if (scopeClassName) {
    seen.add(scopeClassName);
    output += scopeClassName;
  }

  for (const atom of atoms) {
    if (seen.has(atom.className)) {
      continue;
    }

    seen.add(atom.className);
    output += output ? ` ${atom.className}` : atom.className;
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
  return input.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}

function warn(
  warnings: CipoWarning[],
  code: string,
  message: string,
  context?: unknown,
): void {
  const warning = { code, message, context };

  warnings.push(warning);
  runtime.warnings.push(warning);
  runtime.config.onWarning?.(warning);

  if (runtime.config.debug) {
    console.warn(`[Cipó:${code}] ${message}`, context ?? "");
  }
}

function hasDocument(): boolean {
  return typeof document !== "undefined" && Boolean(document.head);
}

function isCssArtifact(value: unknown): value is CipoCssArtifact {
  return isPlainObject(value) && value.kind === "cipo.css";
}

function isDeclarationNode(node: CipoAstNode): node is CipoDeclarationNode {
  return node.type === "declaration";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
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

export interface CipoBrowserGlobal {
  readonly configure: typeof configure;
  readonly theme: typeof theme;
  readonly css: typeof css;
  readonly html: typeof html;
  readonly explain: typeof explain;
  readonly getCssText: typeof getCssText;
  readonly reset: typeof reset;
  readonly installBrowserGlobal: typeof installBrowserGlobal;
}

declare global {
  interface Window {
    Cipo?: CipoBrowserGlobal;
    RodK?: CipoBrowserGlobal;
  }
}

export function createBrowserGlobal(): CipoBrowserGlobal {
  return {
    configure,
    theme,
    css,
    html,
    explain,
    getCssText,
    reset,
    installBrowserGlobal,
  };
}

export function installBrowserGlobal(globalName = "Cipo"): CipoBrowserGlobal {
  const api = createBrowserGlobal();
  const target = globalThis as typeof globalThis & Record<string, unknown>;

  target[globalName] = api;

  return api;
}

if (typeof window !== "undefined") {
  window.Cipo = createBrowserGlobal();
  window.RodK = window.Cipo;
}


