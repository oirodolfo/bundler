import { batch, computed, effect, memo, signal, untrack, configureScheduler, flushSync, scheduleTask } from "../broto/reactivity";
import { resource } from "../broto/resources";
import { $, createDomBag } from "./bag";
import { component } from "./component";
import { clearComponents, listComponents, registerComponent, resolveComponent, unregisterComponent } from "./component-registry";
import { boundary } from "./boundary";
import { createFabricaContext, provide, useContext } from "./context";
import { css } from "./css";
import { debug, setDebug } from "./debug";
import { classMap, ref, repeat, styleMap, virtualRepeat, when } from "./directives";
import { html, mount, render } from "./dom";
import { defineElement, elements } from "./elements";
import { install as installGlobal, noConflict as restoreGlobals } from "./install";
import { config } from "./install-state";
import { rawHtml, sanitizedHtml, trustedHtml, unsafeHtml } from "./raw";
import type { Component, DebugSnapshot, DomBag, InstallOptions, RawHtml, RenderValue } from "./types";

/** Public FabricaDOM API shape. */
export type FabricaApi = {
  html: typeof html & {
    jsx(strings: TemplateStringsArray, ...values: RenderValue[]): DocumentFragment;
    raw(value: string): RawHtml;
    sanitized(value: string): RawHtml;
    trusted(value: string): RawHtml;
    unsafe(value: string): RawHtml;
  };
  render: typeof render;
  mount: typeof mount;
  signal: typeof signal;
  effect: typeof effect;
  computed: typeof computed;
  memo: typeof memo;
  batch: typeof batch;
  untrack: typeof untrack;
  resource: typeof resource;
  configureScheduler: typeof configureScheduler;
  flushSync: typeof flushSync;
  scheduleTask: typeof scheduleTask;
  component: typeof component;
  registerComponent: typeof registerComponent;
  unregisterComponent: typeof unregisterComponent;
  resolveComponent: typeof resolveComponent;
  listComponents: typeof listComponents;
  clearComponents: typeof clearComponents;
  boundary: typeof boundary;
  createContext: typeof createFabricaContext;
  provide: typeof provide;
  useContext: typeof useContext;
  when: typeof when;
  repeat: typeof repeat;
  virtualRepeat: typeof virtualRepeat;
  ref: typeof ref;
  classMap: typeof classMap;
  styleMap: typeof styleMap;
  css: typeof css;
  elements: typeof elements;
  defineElement: typeof defineElement;
  $: typeof $;
  config: typeof config;
  install(options?: InstallOptions): FabricaApi;
  noConflict(): FabricaApi;
  setDebug(enabled: boolean): void;
  debug(): Readonly<DebugSnapshot>;
};

/**
 * Creates the frozen public API object.
 *
 * @returns Public API.
 *
 * @example Micro-JSX components
 * ```ts
 * const Dock = component(function Dock() {
 *   return html`<button>Open</button>`;
 * });
 *
 * render(document.body, html.jsx`<Dock />`);
 * ```
 */
export function createFabricaApi(): FabricaApi {
  const htmlWithRaw = html as FabricaApi["html"];
  htmlWithRaw.raw = rawHtml;
  htmlWithRaw.sanitized = sanitizedHtml;
  htmlWithRaw.trusted = trustedHtml;
  htmlWithRaw.unsafe = unsafeHtml;

  Object.assign($, {
    html: htmlWithRaw,
    css,
    raw: rawHtml,
    sanitizedHtml,
    trustedHtml,
    unsafeHtml,
    signal,
    effect,
    computed,
    memo,
    batch,
    untrack,
    resource,
    component,
    registerComponent,
    unregisterComponent,
    resolveComponent,
    listComponents,
    clearComponents,
    boundary,
    createContext: createFabricaContext,
    provide,
    useContext,
    when,
    repeat,
    virtualRepeat,
    ref,
    classMap,
    styleMap,
    createDomBag,
  });

  const api = {
    html: htmlWithRaw,
    render,
    mount,
    signal,
    effect,
    computed,
    memo,
    batch,
    untrack,
    resource,
    configureScheduler,
    flushSync,
    scheduleTask,
    component,
    registerComponent,
    unregisterComponent,
    resolveComponent,
    listComponents,
    clearComponents,
    boundary,
    createContext: createFabricaContext,
    provide,
    useContext,
    when,
    repeat,
    virtualRepeat,
    ref,
    classMap,
    styleMap,
    css,
    elements,
    defineElement,
    $,
    config,
    install(options?: InstallOptions): FabricaApi {
      return installGlobal(api, options);
    },
    noConflict(): FabricaApi {
      return restoreGlobals(api);
    },
    setDebug,
    debug,
  } satisfies FabricaApi;

  return Object.freeze(api);
}

/** Convenience public aliases used in examples. */
export type { Component, DomBag, InstallOptions, RawHtml, RenderValue };
