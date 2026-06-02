import { $ } from "./bag";
import { config } from "./install-state";
import type { InstallOptions } from "./types";
import type { FabricaApi } from "./public-api";

const previousDollar = globalThis.$;
const previousDollarEl = globalThis.$el;

/**
 * Installs FabricaDOM on globalThis with safe alias handling.
 *
 * @param api - Fabrica API object.
 * @param options - Installation options.
 * @returns The same API object.
 *
 * @example Safe alias
 * ```ts
 * Fabrica.install({ dollarAlias: "$rod" });
 * $rod("body").html`<h1>Hello</h1>`;
 * ```
 */
export function install(api: FabricaApi, options: InstallOptions = {}): FabricaApi {
  Object.assign(config, options);

  globalThis.Fabrica = api;

  if (config.exposeDollar && (config.forceAlias || !globalThis.$)) {
    globalThis.$ = $;
  }

  if (config.exposeDollarEl) {
    const alias = config.dollarAlias || "$el";

    if (config.forceAlias || !(alias in globalThis)) {
      (globalThis as unknown as Record<string, unknown>)[alias] = $;
    }
  }

  return api;
}

/**
 * Restores previous `$` and `$el` globals when FabricaDOM owns them.
 *
 * @param api - Fabrica API object.
 * @returns The same API object.
 */
export function noConflict(api: FabricaApi): FabricaApi {
  if (globalThis.$ === $) {
    globalThis.$ = previousDollar;
  }

  if (globalThis.$el === $) {
    globalThis.$el = previousDollarEl;
  }

  return api;
}
