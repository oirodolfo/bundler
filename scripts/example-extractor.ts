import fs from "node:fs/promises";
import path from "node:path";
import { SRC_DIR, type RootEntry } from "./config";

export type SourceExample = {
  title: string;
  file: string;
  comment: string;
  code: string;
};

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);
const TSDOC_BLOCK_RE = /\/\*\*([\s\S]*?)\*\//g;
const EXAMPLE_TAG_RE = /(?:^|\n)\s*\*?\s*@example\b([\s\S]*?)(?=\n\s*\*\s*@[a-zA-Z][\w-]*\b|\n\s*\*\/|$)/g;
const REMARKS_TAG_RE = /(?:^|\n)\s*\*?\s*@remarks\b([\s\S]*?)(?=\n\s*\*\s*@[a-zA-Z][\w-]*\b|\n\s*\*\/|$)/;

export async function collectExamplesByEntry(entries: readonly RootEntry[]): Promise<Record<string, SourceExample[]>> {
  const files = await collectSourceFiles(SRC_DIR);
  const output: Record<string, SourceExample[]> = {};

  for (const entry of entries) {
    output[entry.name] = [];
  }

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    const examples = extractExamples(source, path.relative(process.cwd(), file));
    const owner = findOwningEntry(file, entries);

    if (!owner || examples.length === 0) {
      continue;
    }

    output[owner.name] ??= [];
    output[owner.name].push(...examples);
  }

  return output;
}

async function collectSourceFiles(directory: string): Promise<string[]> {
  const dirents = await fs.readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const dirent of dirents) {
    const absolutePath = path.join(directory, dirent.name);

    if (dirent.isDirectory()) {
      files.push(...(await collectSourceFiles(absolutePath)));
      continue;
    }

    if (!SOURCE_EXTENSIONS.has(path.extname(dirent.name)) || dirent.name.endsWith(".d.ts")) {
      continue;
    }

    files.push(absolutePath);
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function findOwningEntry(file: string, entries: readonly RootEntry[]): RootEntry | null {
  const relative = path.relative(SRC_DIR, file).replaceAll(path.sep, "/");
  const topLevelName = relative.split("/")[0]?.replace(/\.[^.]+$/, "") ?? "";

  return entries.find((entry) => entry.name === topLevelName) ?? null;
}

function extractExamples(source: string, file: string): SourceExample[] {
  const examples: SourceExample[] = [];
  let blockMatch: RegExpExecArray | null;

  while ((blockMatch = TSDOC_BLOCK_RE.exec(source))) {
    const block = blockMatch[1] ?? "";
    const summary = cleanCommentText(extractSummary(block));
    const remarks = cleanCommentText(block.match(REMARKS_TAG_RE)?.[1] ?? "");
    const blockComment = joinParagraphs(summary, remarks);
    let exampleMatch: RegExpExecArray | null;

    EXAMPLE_TAG_RE.lastIndex = 0;
    while ((exampleMatch = EXAMPLE_TAG_RE.exec(block))) {
      const rawExample = exampleMatch[1] ?? "";
      const parsed = parseExample(rawExample);

      if (!parsed.code) {
        continue;
      }

      examples.push({
        title: parsed.title,
        file,
        comment: joinParagraphs(blockComment, parsed.comment),
        code: parsed.code,
      });
    }
  }

  return examples;
}

function parseExample(rawExample: string): { title: string; comment: string; code: string } {
  const fence = rawExample.match(/```[\w-]*\n([\s\S]*?)```/);
  const code = cleanExampleCode(fence?.[1] ?? rawExample);
  const prose = cleanCommentText(fence ? rawExample.slice(0, fence.index) : "");
  const title = extractExampleTitle(prose);
  const comment = removeExampleTitle(prose, title);

  return { title, comment, code };
}

function extractSummary(block: string): string {
  const firstTagIndex = block.search(/\n\s*\*\s*@[a-zA-Z][\w-]*\b/);
  return firstTagIndex >= 0 ? block.slice(0, firstTagIndex) : block;
}

function extractExampleTitle(prose: string): string {
  const firstLine = prose
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) return "Example";

  return firstLine.replace(/[:.]$/, "") || "Example";
}

function removeExampleTitle(prose: string, title: string): string {
  const lines = prose.split("\n");
  const titleIndex = lines.findIndex((line) => line.trim() === title || line.trim() === `${title}:` || line.trim() === `${title}.`);

  if (titleIndex < 0) return prose;

  return lines
    .filter((_, index) => index !== titleIndex)
    .join("\n")
    .trim();
}

function cleanCommentText(value: string): string {
  return value
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("@"))
    .join("\n")
    .trim();
}

function cleanExampleCode(value: string): string {
  return value
    .split("\n")
    .map((line) => line.replace(/^\s*\* ?/, ""))
    .join("\n")
    .trim();
}

function joinParagraphs(...values: readonly string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join("\n\n");
}
