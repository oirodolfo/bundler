import { createElementFactory, createDomElement } from '../fabrica-elements'
import { component } from './component'
import type { Component, RenderValue } from './types'
import type { ElementsRecord } from '../fabrica-elements'

/**
 * Shared Fábrica element factory backed by `fabrica-elements`.
 *
 * @remarks
 * Fábrica remains the owner of `html`, reactivity and rendering, while the
 * static element/component factory behavior is shared with Cipó. This gives both
 * runtimes the same props, class, children, refs and events behavior without
 * copying DOM factory code.
 *
 * @example Static element for render()
 * ```ts
 * render(document.body, elements.button({ class: 'primary', children: 'Save' }))
 * ```
 *
 * @example Component wrapper
 * ```ts
 * const Button = defineElement('button', { class: 'primary' })
 * render(document.body, Button({ children: 'Save' }))
 * ```
 */
export const elements = createElementFactory<RenderValue>({
  createElement(tag, props) {
    return createDomElement(tag, props) as RenderValue
  },
})

/**
 * Creates a Fábrica component that renders a shared element factory tag.
 *
 * @param tag - HTML tag name.
 * @param defaultProps - Default props merged before user props.
 * @returns Fábrica component.
 *
 * @example
 * ```ts
 * const Card = defineElement('section', { class: 'card' })
 * html`${Card({ children: 'Hello' })}`
 * ```
 */
export function defineElement<Props extends ElementsRecord = ElementsRecord>(
  tag: string,
  defaultProps: ElementsRecord = {},
): Component<Props> {
  return component((props: Props) => createDomElement(tag, { ...defaultProps, ...props }) as RenderValue)
}
