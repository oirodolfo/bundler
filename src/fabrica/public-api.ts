import { $, createDomBag } from "./bag";
import { component } from "./component";
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
import type { DebugSnapshot, DomBag, InstallOptions, RawHtml, RenderValue } from "./types";

/** Public FabricaDOM API shape. */
export type FabricaApi = {
  html: typeof html & { raw(value: string): RawHtml; sanitized(value: string): RawHtml; trusted(value: string): RawHtml; unsafe(value: string): RawHtml };
  render: typeof render;
  mount: typeof mount;
  component: typeof component;
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
    component,
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
    component,
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
export type { DomBag, InstallOptions, RawHtml, RenderValue };
