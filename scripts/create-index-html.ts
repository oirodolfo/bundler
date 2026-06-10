import type { RootEntry } from "./config";
import type { SourceExample } from "./example-extractor";

export type LandingInput = {
  entries: RootEntry[];
  outputs: string[];
  namespace: string;
  examples?: Record<string, SourceExample[]>;
};

export function createIndexHtml(input: LandingInput): string {
  const cards = input.entries.map((entry) => createToolCard(entry, input.outputs, input.examples?.[entry.name] || [])).join("\n");
  const toolCount = input.entries.length;

  return `<!doctype html>
<html lang="en">
<head>
${createHead()}
</head>
<body>
  <div class="aurora aurora-one"></div>
  <div class="aurora aurora-two"></div>
  <main class="shell">
    <section class="hero">
      <p class="eyebrow">Root IIFE toolchain</p>
      <h1>One root file, one browser global.</h1>
      <p class="lede">A mobile-first build system for publishing TypeScript, TSX, JSX and ESM imports as standalone IIFE files for userscripts, Safari coding sessions and CDN experiments.</p>
      <div class="stats">
        <span><strong>${toolCount}</strong> tools</span>
        <span><strong>IIFE</strong> normal + min</span>
        <span><strong>ESM</strong> normal + min</span>
      </div>
    </section>
    <section class="grid">
${cards}
    </section>
  </main>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/highlight.min.js"></script>
  <script>window.hljs && window.hljs.highlightAll();</script>
</body>
</html>`;
}

function createHead(): string {
  return `  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rod Browser Tools</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/tokyo-night-dark.min.css" />
  <style>${createStyles()}</style>`;
}

function createToolCard(entry: RootEntry, outputs: string[], examples: SourceExample[]): string {
  const files = outputs.filter((output) => output.startsWith(`${entry.name}.`));
  const links = files
    .filter((file) => file.endsWith(".js"))
    .map((file) => `<a href="./${escapeHtml(file)}">${escapeHtml(file)}</a>`)
    .join("");
  const requireLine = `// @require https://OWNER.github.io/REPO/${entry.name}.iife.js\nconst ${entry.globalName} = window.${entry.globalName};`;
  const importLine = `import * as ${entry.globalName} from "https://OWNER.github.io/REPO/${entry.name}.esm.js";`;
  const tags = entry.tool.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const exampleBlocks = examples.slice(0, 12).map(createExampleBlock).join("");

  return `      <article class="card">
        <div class="card-top">
          <p class="tool-name">${escapeHtml(entry.tool.name)}</p>
          <code>window.${escapeHtml(entry.globalName)}</code>
        </div>
        <p class="description">${escapeHtml(entry.tool.description)}</p>
        <div class="tags">${tags || "<span>browser</span><span>iife</span>"}</div>
        <div class="links">${links}</div>
        <div class="code-stack">
          <pre><code class="language-js">${escapeHtml(requireLine)}</code></pre>
          <pre><code class="language-js">${escapeHtml(importLine)}</code></pre>
        </div>
        ${exampleBlocks ? `<details class="examples" open><summary>Examples from every source file</summary>${exampleBlocks}</details>` : ""}
      </article>`;
}


function createExampleBlock(example: SourceExample): string {
  return `<section class="example-block">
    <header><strong>${escapeHtml(example.title)}</strong><span>${escapeHtml(example.file)}</span></header>
    ${example.comment ? `<p>${escapeHtml(example.comment)}</p>` : ""}
    <pre><code class="language-ts">${escapeHtml(example.code)}</code></pre>
  </section>`;
}

function createStyles(): string {
  return `:root {
  color-scheme: dark;
  --bg: #09090f;
  --panel: rgb(255 255 255 / 0.075);
  --panel-strong: rgb(255 255 255 / 0.12);
  --line: rgb(255 255 255 / 0.14);
  --text: #f8fafc;
  --muted: #a7adbd;
  --hot: #ff7a18;
  --pink: #ff4fd8;
  --blue: #53d8ff;
  --green: #97f7c2;
  --radius: 30px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  background:
    radial-gradient(circle at 10% 10%, rgb(255 122 24 / .22), transparent 34rem),
    radial-gradient(circle at 90% 4%, rgb(83 216 255 / .20), transparent 30rem),
    radial-gradient(circle at 60% 100%, rgb(255 79 216 / .16), transparent 34rem),
    var(--bg);
  color: var(--text);
  font-family: Inter, system-ui, sans-serif;
  overflow-x: hidden;
}
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(rgb(255 255 255 / .035) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / .028) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: linear-gradient(to bottom, black, transparent 82%);
}
.aurora {
  position: fixed;
  width: 34rem;
  height: 34rem;
  border-radius: 999px;
  filter: blur(60px);
  opacity: .24;
  pointer-events: none;
  animation: drift 14s ease-in-out infinite alternate;
}
.aurora-one { left: -8rem; top: 18rem; background: var(--hot); }
.aurora-two { right: -10rem; top: 3rem; background: var(--blue); animation-delay: -4s; }
.shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; padding: 70px 0; position: relative; }
.hero { padding: 56px; border: 1px solid var(--line); border-radius: 42px; background: linear-gradient(135deg, rgb(255 255 255 / .12), rgb(255 255 255 / .04)); box-shadow: 0 30px 120px rgb(0 0 0 / .38); backdrop-filter: blur(22px); }
.eyebrow { margin: 0 0 18px; color: var(--green); text-transform: uppercase; letter-spacing: .2em; font-size: 12px; font-weight: 900; }
h1 { margin: 0; max-width: 840px; font-family: "Playfair Display", serif; font-size: clamp(52px, 9vw, 116px); line-height: .84; letter-spacing: -.07em; background: linear-gradient(120deg, #fff 10%, var(--blue), var(--pink), var(--hot)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.lede { max-width: 760px; color: var(--muted); font-size: clamp(17px, 2vw, 22px); line-height: 1.55; }
.stats { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 30px; }
.stats span, .tags span { border: 1px solid var(--line); background: rgb(255 255 255 / .07); border-radius: 999px; padding: 10px 14px; color: var(--muted); }
.stats strong { color: white; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 18px; margin-top: 18px; }
.card { border: 1px solid var(--line); border-radius: var(--radius); background: linear-gradient(180deg, var(--panel), rgb(255 255 255 / .035)); padding: 22px; box-shadow: 0 24px 80px rgb(0 0 0 / .28); backdrop-filter: blur(18px); }
.card-top { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
.tool-name { margin: 0; font-weight: 900; font-size: 22px; }
code, pre { 
  font-family: "JetBrains Mono", ui-monospace, monospace; 
  white-space: pre; 
  word-break: normal;
}
.card-top code { color: var(--blue); border: 1px solid var(--line); padding: 8px 10px; border-radius: 14px; background: rgb(0 0 0 / .28); }
.description { color: var(--muted); line-height: 1.6; }
.tags, .links { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
.tags span { font-size: 12px; padding: 7px 10px; }
.links a { color: white; text-decoration: none; border: 1px solid var(--line); border-radius: 13px; padding: 8px 10px; background: linear-gradient(135deg, rgb(255 122 24 / .18), rgb(83 216 255 / .12)); }
pre { margin: 12px 0 0; border-radius: 20px; overflow: auto; max-width: 100%; border: 1px solid rgb(255 255 255 / .09); background: #070710 !important; }
pre code { display: block; min-width: 0; max-width: 100%; font-size: 12px; white-space: pre; overflow-wrap: normal; word-break: normal; }
.code-stack, .examples, .example-block { min-width: 0; }
.examples { margin-top: 16px; border-top: 1px solid var(--line); padding-top: 14px; }
.examples summary { cursor: pointer; color: var(--green); font-weight: 900; }
.example-block { margin-top: 12px; }
.example-block header { display: flex; gap: 8px; justify-content: space-between; align-items: baseline; color: var(--muted); font-size: 12px; }
.example-block p { color: var(--muted); font-size: 13px; line-height: 1.55; white-space: pre-line; margin: 8px 0 0; }
.example-block header strong { color: var(--text); }
.example-block header span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@keyframes drift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(4rem, -2rem, 0) scale(1.14); } }
@media (max-width: 720px) { .shell { width: min(100% - 20px, 1180px); padding: 24px 0; } .hero { padding: 28px; border-radius: 30px; } .grid { grid-template-columns: 1fr; } }`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
