/**
 * Small demo entrypoint used to prove the private TypeScript bundling pipeline.
 * Replace this file with your real library entrypoint, for example FabricaHTML.
 */
export interface GreetingOptions {
  readonly name: string;
  readonly emoji?: string;
}

/**
 * Creates a tiny browser-safe greeting string.
 *
 * @param options - Greeting options used by the browser bundle.
 * @returns A formatted greeting.
 *
 * @example
 * ```ts
 * createGreeting({ name: "Rod", emoji: "🌶️" });
 * // "Hello, Rod 🌶️"
 * ```
 */
export function createGreeting(options: GreetingOptions): string {
  return `Hello, ${options.name} ${options.emoji ?? "✨"}`;
}

/**
 * Browser global installer for userscript `@require` usage.
 *
 * @remarks
 * The build can expose this module as `window.FabricaHTML` or any other global
 * name through the BUILD_GLOBAL_NAME environment variable.
 *
 * @example
 * ```ts
 * installBrowserGlobal("MigosDemo");
 * console.log(window.MigosDemo.createGreeting({ name: "Rod" }));
 * ```
 */
export function installBrowserGlobal(globalName = "MigosDemo"): void {
  const target = globalThis as typeof globalThis & Record<string, unknown>;
  target[globalName] = { createGreeting, installBrowserGlobal };
}
