import type { Component } from "./types";

const COMPONENT_NAME_RE = /^[A-Z][A-Za-z0-9_$.-]*$/;
const componentRegistry = new Map<string, Component | ((props?: Record<string, unknown>) => unknown)>();

export function normalizeComponentName(name: unknown): string {
  return String(name || "").trim();
}

export function isRegisteredComponentName(name: unknown): boolean {
  return COMPONENT_NAME_RE.test(normalizeComponentName(name));
}

export function registerComponent<T extends Component | ((props?: Record<string, unknown>) => unknown)>(name: string, component: T): T {
  const normalized = normalizeComponentName(name);

  if (!normalized) {
    throw new Error("[Fabrica] registerComponent() needs a non-empty name.");
  }

  componentRegistry.set(normalized, component);
  return component;
}

export function unregisterComponent(name: string): boolean {
  return componentRegistry.delete(normalizeComponentName(name));
}

export function resolveComponent(name: string): Component | ((props?: Record<string, unknown>) => unknown) | undefined {
  return componentRegistry.get(normalizeComponentName(name));
}

export function listComponents(): Map<string, Component | ((props?: Record<string, unknown>) => unknown)> {
  return new Map(componentRegistry);
}

export function clearComponents(): void {
  componentRegistry.clear();
}
