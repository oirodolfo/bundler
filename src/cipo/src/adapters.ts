import { createStyledFactory, type ElementsAdapter, type ElementsAdapterName, type ElementsComponent, type ElementsRecord, type StyledBuilder, type StyledDomResult, type StyledFactory, type StyledTagFactory } from '../../fabrica-elements'
import type { CipoComponent, CipoCssInterpolation, CipoDomStyledResult, CipoRecord, CipoStyledBuilder, CipoStyledTagFactory, CipoTarget } from './types'
import { assertAtomicCssArtifact, css } from './css'
import { runtime } from './runtime'

/**
 * Callable styled API exposed by Cipó.
 *
 * @remarks
 * The implementation is delegated to `fabrica-elements` so Cipó no longer owns
 * DOM/component creation. Cipó remains responsible only for compiling CSS into
 * a class list and validating that `css`` ` was used in atomic/component mode.
 *
 * @example DOM tag factory
 * ```ts
 * const Button = cipo.button.css`
 *   px: 4;
 *   bg: $brand;
 * `
 *
 * const button = Button({ children: 'Save' })
 * ```
 *
 * @example Existing element
 * ```ts
 * const element = document.createElement('div')
 * const styled = cipo(element).css`color:red;`
 * console.log(styled.element === element)
 * // true
 * ```
 */
export interface CipoCallableRuntime extends StyledFactory<CipoCssArtifactForElements> {
  <ElementType extends Element>(target: ElementType): CipoStyledBuilder<CipoDomStyledResult<ElementType>>
  <Props extends CipoRecord>(target: CipoComponent<Props>): CipoStyledBuilder<CipoComponent<Props>>
  (target: string): CipoStyledTagFactory
  [key: string]: unknown
}

type CipoCssArtifactForElements = ReturnType<typeof assertAtomicCssArtifact>

/**
 * Creates Cipó's styled-component-compatible callable API.
 *
 * @returns Cipó callable API.
 */
export function createCipoCallable(): CipoCallableRuntime {
  const factory = createStyledFactory<CipoCssArtifactForElements>({
    adapter: resolveElementsAdapter,
    createStyle(strings, values) {
      const artifact = assertAtomicCssArtifact(css(strings, ...(values as readonly CipoCssInterpolation[])))
      return { artifact, className: artifact.className }
    },
  })

  return factory as unknown as CipoCallableRuntime
}

/**
 * Resolves the current Cipó adapter into the shared Fabrica Elements adapter
 * format.
 *
 * @remarks
 * Custom Cipó adapters already follow the same contract, so they are passed
 * through structurally. Built-in string names are resolved by Fabrica Elements.
 *
 * @returns Adapter name or adapter object.
 */
function resolveElementsAdapter(): ElementsAdapterName | ElementsAdapter {
  return runtime.config.adapter as ElementsAdapterName | ElementsAdapter
}

/** Compatibility aliases for older internal imports. */
export type { ElementsComponent as CipoElementsComponent, ElementsRecord as CipoElementsRecord, StyledBuilder, StyledDomResult, StyledTagFactory }
