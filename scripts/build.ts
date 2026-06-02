import fs from "node:fs/promises";
import path from "node:path";
import { glob } from "node:fs/promises";
import { build } from "esbuild";

import {
  DEFAULT_ENTRYPOINT,
  DEFAULT_GLOBAL_NAME,
  DIST_DIR,
  readBooleanEnv,
  readEnv,
} from "./config";

type DocsExample = {
  title: string;
  language: string;
  code: string;
  source: string;
};

const entrypoint = readEnv("BUILD_ENTRYPOINT", DEFAULT_ENTRYPOINT);
const globalName = readEnv("BUILD_GLOBAL_NAME", DEFAULT_GLOBAL_NAME);
const minify = readBooleanEnv("BUILD_MINIFY", true);

/**
 * Builds browser bundles, individual modules, docs examples, and landing page.
 *
 * @returns A promise that resolves after the build finishes.
 *
 * @example
 * ```ts
 * await main();
 * // dist/index.html is created with extracted TSDoc examples.
 * ```
 */
async function main(): Promise<void> {
  await fs.rm(DIST_DIR, { recursive: true, force: true });
  await fs.mkdir(DIST_DIR, { recursive: true });

  await build({
    entryPoints: [entrypoint],
    outfile: path.join(DIST_DIR, "bundle.esm.js"),
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    sourcemap: true,
    minify,
    legalComments: "none",
    logLevel: "info",
  });

  await build({
    entryPoints: [entrypoint],
    outfile: path.join(DIST_DIR, "bundle.iife.js"),
    bundle: true,
    format: "iife",
    globalName,
    platform: "browser",
    target: "es2022",
    sourcemap: true,
    minify,
    legalComments: "none",
    logLevel: "info",
  });

  const entryPoints = await collectModuleEntryPoints();

  const result = await build({
    entryPoints,
    outdir: DIST_DIR,
    outbase: "src",
    bundle: false,
    format: "iife",
    platform: "browser",
    target: "es2022",
    sourcemap: true,
    minify: false,
    legalComments: "none",
    metafile: true,
    write: true,
    logLevel: "info",
  });

  const outputs = Object.keys(result.metafile.outputs);
  const examples = await extractDocsExamples("src");

  await fs.writeFile(
    path.join(DIST_DIR, "metafile-outputs.json"),
    JSON.stringify(outputs, null, 2),
    "utf8",
  );

  await fs.writeFile(
    path.join(DIST_DIR, "docs-examples.json"),
    JSON.stringify(examples, null, 2),
    "utf8",
  );

  await fs.writeFile(
    path.join(DIST_DIR, "release-assets.txt"),
    outputs.join("\n"),
    "utf8",
  );

  await fs.writeFile(
    path.join(DIST_DIR, "index.html"),
    createIndexHtml(globalName, outputs, examples),
    "utf8",
  );

  console.log(`✅ Built private TypeScript entrypoint: ${entrypoint}`);
  console.log(`📚 Extracted docs examples: ${examples.length}`);
}

/**
 * Collects every TypeScript source file except root src/index.ts.
 *
 * @returns Source files that should be emitted as individual modules.
 *
 * @example
 * ```ts
 * const files = await collectModuleEntryPoints();
 * // ["src/cell.ts", "src/world.ts"]
 * ```
 */
async function collectModuleEntryPoints(): Promise<string[]> {
  const files: string[] = [];

  for await (const file of glob("src/**/*.ts")) {
    if (file === "src/index.ts") {
      continue;
    }

    files.push(file);
  }

  return files;
}

/**
 * Extracts fenced TSDoc @example blocks from TypeScript source files.
 *
 * @param rootDirectory - Source directory to scan.
 * @returns Extracted examples ready for docs rendering.
 *
 * @example
 * ```ts
 * const examples = await extractDocsExamples("src");
 * console.log(examples[0]?.title);
 * ```
 */
async function extractDocsExamples(rootDirectory: string): Promise<DocsExample[]> {
  const examples: DocsExample[] = [];

  for await (const file of glob(`${rootDirectory}/**/*.ts`)) {
    const source = await fs.readFile(file, "utf8");
    const comments = source.match(/\/\*\*[\s\S]*?\*\//g) ?? [];

    for (const comment of comments) {
      examples.push(...extractExamplesFromComment(comment, file));
    }
  }

  return examples;
}

/**
 * Extracts all @example fenced code blocks from one TSDoc comment.
 *
 * @param comment - Full TSDoc comment.
 * @param sourceFile - File where the comment was found.
 * @returns Parsed examples from that comment.
 *
 * @example
 * ```ts
 * const examples = extractExamplesFromComment(comment, "src/index.ts");
 * ```
 */
function extractExamplesFromComment(
  comment: string,
  sourceFile: string,
): DocsExample[] {
  const cleaned = comment
    .replace(/^\/\*\*/, "")
    .replace(/\*\/$/, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .join("\n");

  const examples: DocsExample[] = [];
  const examplePattern =
    /@example\s*([^\n]*)\n+```(\w+)?\n([\s\S]*?)```/g;

  for (const match of cleaned.matchAll(examplePattern)) {
    const [, rawTitle, rawLanguage, rawCode] = match;

    examples.push({
      title: rawTitle?.trim() || "Example",
      language: rawLanguage?.trim() || "ts",
      code: rawCode?.trimEnd() ?? "",
      source: sourceFile,
    });
  }

  return examples;
}

/**
 * Creates the landing page for generated browser artifacts and docs examples.
 *
 * @param globalName - Name exposed by the IIFE build.
 * @param outputs - Output files generated by esbuild.
 * @param examples - TSDoc examples extracted from source files.
 * @returns HTML content for dist/index.html.
 *
 * @example
 * ```ts
 * createIndexHtml("Rod", ["dist/bundle.esm.js"], []);
 * ```
 */
function createIndexHtml(
  globalName: string,
  outputs: string[],
  examples: DocsExample[],
): string {
  const moduleLinks = outputs
    .filter((output) => output.endsWith(".js"))
    .map((output) => {
      const href = output /**output.startsWith(`${DIST_DIR}/`)
        ? output.slice(DIST_DIR.length + 1)
        : output;**/ 

      return `<p><a href="./${escapeHtml(href)}">${escapeHtml(href)}</a></p>`;
    })
    .join("\n");

  const exampleBlocks = examples
    .map(
      (example) => `
        <article class="example-card">
          <div class="example-header">
            <h3>${escapeHtml(example.title)}</h3>
            <span>${escapeHtml(example.source)}</span>
          </div>
          <pre><code class="language-${escapeHtml(example.language)}">${escapeHtml(example.code)}</code></pre>
        </article>
      `,
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Private TS Bundle</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/default.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>


<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/typescript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/html.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/languages/css.min.js"></script>
<script>hljs.highlightAll();</script>
    <style>
      body {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        margin: 0;
        background: #09090b;
        color: #f8fafc;
      }

      main {
        max-width: 980px;
        margin: 0 auto;
        padding: 32px 18px 72px;
      }

      a {
        color: #93c5fd;
      }

      .hero {
        padding: 28px;
        border: 1px solid #27272a;
        border-radius: 24px;
        background:
          radial-gradient(circle at top left, rgba(148, 163, 184, 0.14), transparent 34rem),
          #111113;
      }

      .example-card {
        margin-top: 18px;
        border: 1px solid #27272a;
        border-radius: 18px;
        overflow: hidden;
        background: #111113;
      }

      .example-header {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 16px;
        border-bottom: 1px solid #27272a;
      }

      .example-header h3 {
        margin: 0;
        font-size: 15px;
      }

      .example-header span {
        color: #a1a1aa;
        font-size: 12px;
      }

      pre {
        margin: 0;
        padding: 16px;
        overflow: auto;
        background: #050506;
      }

      code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 13px;
        line-height: 1.7;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Private TS Bundle</h1>
        <p>ESM: <a href="./bundle.esm.js">bundle.esm.js</a></p>
        <p>IIFE: <a href="./bundle.iife.js">bundle.iife.js</a></p>
        <p>Global name: <code>window.${escapeHtml(globalName)}</code></p>
      </section>

      <section>
        <h2>Individual modules</h2>
        ${moduleLinks}
      </section>

      <section>
        <h2>Examples</h2>
        ${exampleBlocks || "<p>No TSDoc examples found.</p>"}
      </section>
    </main>

    <script type="module">

import { codeToHtml } from "https://esm.run/shiki@3.0.0";
document.querySelectorAll("code").forEach(
  (code) =>
    (code.innerHTML = await codeToHtml(code.innerText, {
      lang: "js",
      theme: "rose-pine",
    })),
);

  </script>
  </body>
</html>`;
}

/**
 * Escapes HTML-sensitive characters for safe landing page rendering.
 *
 * @param value - Raw string value.
 * @returns HTML-safe text.
 *
 * @example
 * ```ts
 * escapeHtml("<script>");
 * // "&lt;script&gt;"
 * ```
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

await main();
