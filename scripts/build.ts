import fs from "node:fs/promises";
import { glob } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

import {
  DEFAULT_ENTRYPOINT,
  DEFAULT_GLOBAL_NAME,
  DIST_DIR,
  readBooleanEnv,
  readEnv,
} from "./config";
import { createIndexHtml, type DocsExample } from "./create-index-html";

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

  for await (const file of glob("src/*.ts")) {
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
  const examplePattern = /@example\s*([^\n]*)\n+```(\w+)?\n([\s\S]*?)```/g;

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

await main();
