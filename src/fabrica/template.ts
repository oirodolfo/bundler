import { ATTR_MARKER_PREFIX, ATTR_MARKER_SUFFIX, TEXT_MARKER_PREFIX } from "./constants";
import { debugState } from "./debug";
import { isComponent } from "./guards";
import type { CompiledTemplate, RenderValue, TemplatePart } from "./types";

/** Template compilation cache keyed by the browser-owned TemplateStringsArray. */
const templateCache = new WeakMap<TemplateStringsArray, CompiledTemplate>();
const jsxTemplateCache = new WeakMap<TemplateStringsArray, CompiledTemplate>();

const JSX_COMPONENT_NAME = "[A-Z][A-Za-z0-9_$.-]*";

export function getCompiledTemplate(strings: TemplateStringsArray, values: readonly RenderValue[] = []): CompiledTemplate {
  return getCompiledTemplateWithMode(strings, values, false);
}

export function getCompiledJsxTemplate(strings: TemplateStringsArray, values: readonly RenderValue[] = []): CompiledTemplate {
  return getCompiledTemplateWithMode(strings, values, true);
}

function getCompiledTemplateWithMode(strings: TemplateStringsArray, values: readonly RenderValue[], jsx: boolean): CompiledTemplate {
  const cache = jsx ? jsxTemplateCache : templateCache;
  const cached = cache.get(strings);

  if (cached) {
    return cached;
  }

  const template = document.createElement("template");
  template.innerHTML = buildTemplateSource(strings, values, { jsx });
  removeUserAuthoredComments(template.content);

  const parts = compileParts(template.content);
  const compiled: CompiledTemplate = { template, parts };

  cache.set(strings, compiled);
  debugState.templates += 1;
  debugState.parts += parts.length;

  return compiled;
}

/**
 * Builds template HTML with text, attribute and component markers.
 *
 * @param strings - Static template chunks.
 * @param values - Runtime values.
 * @returns HTML source with markers.
 */
export function buildTemplateSource(
  strings: TemplateStringsArray,
  values: readonly RenderValue[] = [],
  options: { jsx?: boolean } = {},
): string {
  let source = "";
  let skipNextPrefix = "";

  for (let index = 0; index < strings.length; index += 1) {
    let chunk = strings[index] ?? "";

    if (skipNextPrefix && chunk.startsWith(skipNextPrefix)) {
      chunk = chunk.slice(skipNextPrefix.length);
      skipNextPrefix = "";
    }

    source += chunk;

    if (index >= strings.length - 1) {
      continue;
    }

    const value = values[index];
    const canBeComponent = isComponent(value) || typeof value === "function";

    if (canBeComponent && chunk.endsWith("<")) {
      const nextChunk = strings[index + 1] ?? "";
      const selfClose = nextChunk.match(/^\s*\/\s*>/);

      if (selfClose) {
        source += `template data-fabrica-component="${index}"></template`;
        skipNextPrefix = selfClose[0];
        continue;
      }

      source += `template data-fabrica-component="${index}"`;
      continue;
    }

    if (canBeComponent && chunk.endsWith("</")) {
      source += "template";
      continue;
    }

    source += isAttributePosition(chunk)
      ? `${ATTR_MARKER_PREFIX}${index}${ATTR_MARKER_SUFFIX}`
      : `<!--${TEXT_MARKER_PREFIX}${index}-->`;
  }

  const uncommented = stripReactStyleComments(stripHtmlComments(source));

  return options.jsx ? transformMicroJsxChunk(uncommented) : uncommented;
}

function transformMicroJsxChunk(chunk: string): string {
  if (!chunk || (chunk.indexOf("<") === -1 && chunk.indexOf("</") === -1)) {
    return chunk;
  }

  let output = rewriteExplicitComponentTags(chunk);

  output = output.replace(
    new RegExp(`<(${JSX_COMPONENT_NAME})([^<>]*?)\\/\\s*>`, "g"),
    (_match, name: string, attrs: string) => `<template data-fabrica-component-name="${escapeComponentName(name)}"${attrs || ""}></template>`,
  );

  output = output.replace(
    new RegExp(`<(${JSX_COMPONENT_NAME})([^<>]*?)>`, "g"),
    (_match, name: string, attrs: string) => `<template data-fabrica-component-name="${escapeComponentName(name)}"${attrs || ""}>`,
  );

  output = output.replace(new RegExp(`</(${JSX_COMPONENT_NAME})\\s*>`, "g"), "</template>");

  return output;
}

function rewriteExplicitComponentTags(chunk: string): string {
  return chunk
    .replace(/<f-component\b([^<>]*?)\/\s*>/g, (_match, attrs: string) => `<template data-fabrica-explicit-component="true"${attrs || ""}></template>`)
    .replace(/<f-component\b([^<>]*?)>/g, (_match, attrs: string) => `<template data-fabrica-explicit-component="true"${attrs || ""}>`)
    .replace(/<\/f-component\s*>/g, "</template>");
}

function stripHtmlComments(source: string): string {
  return source.replace(/<!--(?!fabrica:text:)[\s\S]*?-->/g, "");
}

function stripReactStyleComments(source: string): string {
  return source.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
}

function removeUserAuthoredComments(root: DocumentFragment): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
  const comments: Comment[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Comment;
    const value = node.nodeValue ?? "";

    if (!value.startsWith(TEXT_MARKER_PREFIX)) {
      comments.push(node);
    }
  }

  for (let index = 0; index < comments.length; index += 1) {
    comments[index].remove();
  }
}

function escapeComponentName(name: string): string {
  return String(name).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Detects if interpolation appears in an attribute assignment.
 *
 * @param chunk - Static chunk before interpolation.
 * @returns Whether the next value belongs to an attribute.
 */
export function isAttributePosition(chunk: string): boolean {
  return /(?:[.?@:a-zA-Z_][\w:.-]*)\s*=\s*(?:"[^"]*|'[^']*)?$/.test(chunk);
}

/**
 * Compiles child, attribute and component parts from a template root.
 *
 * @param root - Template content root.
 * @returns Template parts.
 */
export function compileParts(root: DocumentFragment): TemplatePart[] {
  const parts: TemplatePart[] = [];

  compileChildParts(root, parts);
  compileAttributeParts(root, parts);
  compileComponentParts(root, parts);

  return parts;
}

function compileChildParts(root: DocumentFragment, parts: TemplatePart[]): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const value = node.nodeValue ?? "";

    if (!value.startsWith(TEXT_MARKER_PREFIX)) {
      continue;
    }

    parts.push({ type: "child", index: Number(value.slice(TEXT_MARKER_PREFIX.length)), path: getNodePath(root, node) });
  }
}

function compileAttributeParts(root: DocumentFragment, parts: TemplatePart[]): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const element = walker.currentNode as Element;
    const attributes = Array.from(element.attributes);

    for (let index = 0; index < attributes.length; index += 1) {
      const attribute = attributes[index];

      if (!attribute) {
        continue;
      }

      const markerIndex = getAttributeMarkerIndex(attribute.value);

      if (markerIndex === -1) {
        continue;
      }

      parts.push({ type: "attribute", index: markerIndex, path: getNodePath(root, element), name: attribute.name });
      element.removeAttribute(attribute.name);
    }
  }
}

function compileComponentParts(root: DocumentFragment, parts: TemplatePart[]): void {
  const templates = Array.from(
    root.querySelectorAll("template[data-fabrica-component], template[data-fabrica-component-name], template[data-fabrica-explicit-component]"),
  );

  for (let index = 0; index < templates.length; index += 1) {
    const element = templates[index] as HTMLTemplateElement;
    const rawIndex = element.getAttribute("data-fabrica-component");
    const rawName = element.getAttribute("data-fabrica-component-name") || element.getAttribute("name") || "";
    const componentIndex = rawIndex == null ? -1 : Number(rawIndex);

    if (rawIndex != null && !Number.isFinite(componentIndex)) {
      continue;
    }

    parts.push({ type: "component", index: componentIndex, path: getNodePath(root, element), name: rawName || undefined });
  }
}

function getAttributeMarkerIndex(value: string): number {
  const start = value.indexOf(ATTR_MARKER_PREFIX);

  if (start === -1) {
    return -1;
  }

  return Number(value.slice(start + ATTR_MARKER_PREFIX.length).split(ATTR_MARKER_SUFFIX)[0]);
}

export function getNodePath(root: Node, node: Node): number[] {
  const path: number[] = [];
  let current: Node | null = node;

  while (current && current !== root) {
    const parentNode: Node | null = current.parentNode;

    if (!parentNode) {
      break;
    }

    path.push(indexOfChild(parentNode, current));
    current = parentNode;
  }

  path.reverse();
  return path;
}

export function resolvePath(root: Node, path: readonly number[]): Node | null {
  let current: Node | null = root;

  for (let index = 0; index < path.length; index += 1) {
    const childIndex = path[index];

    if (childIndex == null) {
      return null;
    }

    current = current.childNodes[childIndex] ?? null;

    if (!current) {
      return null;
    }
  }

  return current;
}

export function comparePathsReverse(left: readonly number[], right: readonly number[]): number {
  const maxLength = Math.max(left.length, right.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftValue = left[index] ?? -1;
    const rightValue = right[index] ?? -1;

    if (leftValue !== rightValue) {
      return rightValue - leftValue;
    }
  }

  return right.length - left.length;
}

function indexOfChild(parentNode: Node, child: Node): number {
  let index = 0;
  let current: ChildNode | null = parentNode.firstChild;

  while (current && current !== child) {
    index += 1;
    current = current.nextSibling;
  }

  return index;
}
