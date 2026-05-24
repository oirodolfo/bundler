import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import {
  DEFAULT_ENTRYPOINT,
  DEFAULT_GLOBAL_NAME,
  DIST_DIR,
  readBooleanEnv,
  readEnv,
} from "./config";

const entrypoint = readEnv("BUILD_ENTRYPOINT", DEFAULT_ENTRYPOINT);
const globalName = readEnv("BUILD_GLOBAL_NAME", DEFAULT_GLOBAL_NAME);
const minify = readBooleanEnv("BUILD_MINIFY", true);

/**
 * Builds both ESM and IIFE artifacts for browser and userscript usage.
 *
 * @returns A promise that resolves after all output files are written.
 *
 * @example
 * ```ts
 * await main();
 * // dist/bundle.esm.js and dist/bundle.iife.js are created.
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

  await fs.writeFile(
    path.join(DIST_DIR, "index.html"),
    createIndexHtml(globalName),
    "utf8",
  );

  console.log(`✅ Built private TypeScript entrypoint: ${entrypoint}`);
  console.log(`📦 ESM:  dist/bundle.esm.js`);
  console.log(`🌍 IIFE: dist/bundle.iife.js as window.${globalName}`);
}

/**
 * Creates a tiny GitHub Pages landing page for generated browser artifacts.
 *
 * @param globalName - Name exposed by the IIFE build.
 * @returns HTML content for dist/index.html.
 *
 * @example
 * ```ts
 * createIndexHtml("FabricaHTML");
 * // "<!doctype html>..."
 * ```
 */
function createIndexHtml(globalName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Private TS Bundle</title>
    <style>
      body { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin: 2rem; background: #0b1020; color: #f8fafc; }
      code { background: #111827; padding: .2rem .4rem; border-radius: .4rem; }
      a { color: #93c5fd; }
    </style>
  </head>
  <body>
    <h1>Private TS Bundle</h1>
    <p>ESM: <a href="./bundle.esm.js">bundle.esm.js</a></p>
    <p>IIFE: <a href="./bundle.iife.js">bundle.iife.js</a></p>
    <p>Global name: <code>window.${globalName}</code></p>
  </body>
</html>`;
}

await main();
