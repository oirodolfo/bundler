import { createContext, provide, useContext } from "../broto/owner";

/**
 * Creates a Fabrica context backed by Broto's owner tree.
 *
 * @param defaultValue - Optional fallback value.
 * @param description - Debug-friendly name.
 * @returns Context token.
 *
 * @example
 * ```ts
 * const ThemeContext = createFabricaContext("dark", "Theme");
 * ```
 */
export const createFabricaContext = createContext;

/** Provides a context value for descendant components. */
export { provide };

/** Reads the nearest context value. */
export { useContext };
