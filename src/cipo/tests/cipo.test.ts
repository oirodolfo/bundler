import { describe, expect, it, beforeEach } from 'vitest'
import { css, getCssText, inline, registerAlias, reset, setup } from '../src/index'

describe('Cipó next', () => {
  beforeEach(() => {
    reset()
    setup({
      prefix: 'test',
      minify: true,
      layers: true,
      theme: {
        colors: { brand: '#f97316', ink: '#fff', panel: '#111' },
        spacing: '0.25rem',
        radius: { xl: '24px' },
      },
    })
  })

  it('keeps css tagged template API', () => {
    const card = css`color:red;`
    expect(String(card)).toContain('test-a-')
    expect(getCssText()).toContain('color:red')
  })

  it('supports token inference and property aliases', () => {
    const card = css`px:4;bg:$brand;rounded:$xl;`
    expect(card.compiledCss).toContain('padding-inline')
    expect(card.compiledCss).toContain('var(--test-colors-brand)')
  })

  it('supports standalone aliases', () => {
    registerAlias('demoGlass', 'bg:alpha($panel / 50%);')
    const card = css`demoGlass;`
    expect(card.compiledCss).toContain('color-mix')
  })

  it('supports inline.css', () => {
    const style = inline.css`px:2;color:$brand;`
    expect(String(style)).toContain('padding-inline')
    expect(String(style)).toContain('var(--test-colors-brand)')
  })

  it('supports variants', () => {
    const button = css`x:hover{bg:$brand;}x:md{px:6;}`
    expect(button.compiledCss).toContain(':hover')
    expect(button.compiledCss).toContain('@media')
  })
})
