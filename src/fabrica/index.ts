export { createFabricaApi } from "./public-api";
export type { FabricaApi } from "./public-api";
export type {
  Cleanup,
  Component,
  ComponentContext,
  DebugSnapshot,
  Directive,
  DomBag,
  InstallOptions,
  RawHtml,
  RenderValue,
  RepeatContext,
  Signal,
  SignalOptions,
  SchedulerMode,
  VirtualRepeatOptions,
} from "./types";

export { $ } from "./bag";
export { css } from "./css";
export { component } from "./component";
export { debug, setDebug } from "./debug";
export { classMap, ref, repeat, styleMap, virtualRepeat, when } from "./directives";
export { html, mount, render } from "./dom";
export { defineElement, elements } from "./elements";
export { rawHtml, sanitizedHtml, trustedHtml, unsafeHtml } from "./raw";
export { batch, computed, configureScheduler, effect, memo, onCleanup, signal, untrack } from "./reactivity";

import { createFabricaApi } from "./public-api";

/** Default singleton API. */
const Fabrica = createFabricaApi();

if (typeof globalThis !== "undefined") {
  Fabrica.install();
}

export default Fabrica;

declare global {
  // eslint-disable-next-line no-var
  var Fabrica: import("./public-api").FabricaApi | undefined;
  // eslint-disable-next-line no-var
  var $: unknown;
  // eslint-disable-next-line no-var
  var $el: unknown;
}
