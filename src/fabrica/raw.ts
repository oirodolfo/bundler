import type { RawHtml } from "./types";

/**
 * Creates a trusted raw HTML wrapper.
 *
 * @remarks
 * This is explicit by design. Use `sanitizedHtml()` when you want Fabrica's
 * small built-in sanitizer, or `unsafeHtml()` when you intentionally own the
 * full XSS risk.
 *
 * @param value - Trusted HTML string.
 * @returns Raw HTML value.
 *
 * @example Trusted HTML from a safe source
 * ```ts
 * html`<article>${rawHtml("<strong>Trusted</strong>")}</article>`;
 * ```
 */
export function rawHtml(value: string): RawHtml {
  return trustedHtml(value);
}

/**
 * Alias for raw trusted HTML.
 *
 * @param value - Trusted HTML string.
 * @returns Raw HTML value.
 *
 * @example
 * ```ts
 * html`${trustedHtml("<em>Already sanitized elsewhere</em>")}`;
 * ```
 */
export function trustedHtml(value: string): RawHtml {
  return {
    __kind: "rawHtml",
    value: String(value),
  };
}

/**
 * Makes the danger obvious at callsites that really need arbitrary markup.
 *
 * @param value - Unsafe HTML string.
 * @returns Raw HTML value.
 *
 * @example
 * ```ts
 * html`${unsafeHtml(markupFromYourOwnTrustedCompiler)}`;
 * ```
 */
export function unsafeHtml(value: string): RawHtml {
  return trustedHtml(value);
}

/**
 * Creates raw HTML after applying a conservative built-in sanitizer.
 *
 * @remarks
 * This sanitizer is intentionally small and dependency-free for userscripts. It
 * removes script-like elements, inline event handlers, javascript: URLs, and
 * srcdoc. High-security apps should still use a dedicated sanitizer before
 * passing HTML into Fabrica.
 *
 * @param value - Untrusted HTML string.
 * @returns Sanitized raw HTML value.
 *
 * @example
 * ```ts
 * html`${sanitizedHtml(userSuppliedComment)}`;
 * ```
 */
export function sanitizedHtml(value: string): RawHtml {
  return trustedHtml(sanitizeHtml(value));
}

/**
 * Sanitizes a HTML string with a small DOM-based sanitizer.
 *
 * @param value - HTML string.
 * @returns Sanitized HTML string.
 */
function sanitizeHtml(value: string): string {
  const template = document.createElement("template");
  template.innerHTML = String(value);

  const blockedSelector = "script,iframe,object,embed,link[rel='import'],meta,base";
  const blocked = template.content.querySelectorAll(blockedSelector);

  for (let index = 0; index < blocked.length; index += 1) {
    blocked[index]?.remove();
  }

  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ELEMENT);

  while (walker.nextNode()) {
    const element = walker.currentNode as Element;
    const attributes = Array.from(element.attributes);

    for (let index = 0; index < attributes.length; index += 1) {
      const attribute = attributes[index];

      if (!attribute) {
        continue;
      }

      const name = attribute.name.toLowerCase();
      const text = attribute.value.trim();

      if (name.startsWith("on") || name === "srcdoc" || /^javascript:/i.test(text)) {
        element.removeAttribute(attribute.name);
      }
    }
  }

  return template.innerHTML;
}
