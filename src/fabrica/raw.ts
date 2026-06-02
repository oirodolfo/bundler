import type { RawHtml } from "./types";

/**
 * Creates a trusted raw HTML wrapper.
 *
 * @remarks
 * This is intentionally explicit. It documents that the caller accepts the XSS
 * risk and owns sanitization. Normal interpolations are rendered as text.
 *
 * @param value - Trusted HTML string.
 * @returns Raw HTML value.
 *
 * @example
 * ```ts
 * html`<article>${rawHtml("<strong>Trusted</strong>")}</article>`;
 * ```
 */
export function rawHtml(value: string): RawHtml {
  return {
    __kind: "rawHtml",
    value: String(value),
  };
}
