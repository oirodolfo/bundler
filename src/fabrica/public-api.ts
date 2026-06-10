import { $, createDomBag } from "./bag";
import { component } from "./component";
import { css } from "./css";
import { debug, setDebug } from "./debug";
import { classMap, ref, repeat, styleMap, virtualRepeat, when } from "./directives";
import { html, mount, render } from "./dom";
import { defineElement, elements } from "./elements";
import { install as installGlobal, noConflict as restoreGlobals } from "./install";
import { config } from "./install-state";
import { rawHtml, sanitizedHtml, trustedHtml, unsafeHtml } from "./raw";
import { batch, computed, configureScheduler, effect, memo, onCleanup, signal, untrack } from "./reactivity";
import type { DebugSnapshot, DomBag, InstallOptions, RawHtml, RenderValue, Signal } from "./types";

/** Public FabricaDOM API shape. */
export type FabricaApi = {
  html: typeof html & { raw(value: string): RawHtml; sanitized(value: string): RawHtml; trusted(value: string): RawHtml; unsafe(value: string): RawHtml };
  render: typeof render;
  mount: typeof mount;
  component: typeof component;
  signal: typeof signal;
  effect: typeof effect;
  onCleanup: typeof onCleanup;
  computed: typeof computed;
  memo: typeof memo;
  untrack: typeof untrack;
  batch: typeof batch;
  configureScheduler: typeof configureScheduler;
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
    signal,
    effect,
    computed,
    memo,
    batch,
    untrack,
    component,
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
    signal,
    effect,
    onCleanup,
    computed,
    memo,
    untrack,
    batch,
    configureScheduler,
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
export type { DomBag, InstallOptions, RawHtml, RenderValue, Signal };
