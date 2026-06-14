import { describe, it, expect } from 'vitest'
import { nextPatternToPathToRegexp } from '../../src/core/pattern'

describe('nextPatternToPathToRegexp', () => {
  it('leaves static segments untouched', () => {
    expect(nextPatternToPathToRegexp('/notizie')).toBe('/notizie')
  })

  it('converts a dynamic segment', () => {
    expect(nextPatternToPathToRegexp('/news/[slug]')).toBe('/news/:slug')
  })

  it('converts a catch-all segment', () => {
    expect(nextPatternToPathToRegexp('/docs/[...path]')).toBe('/docs/*path')
  })

  it('converts an optional catch-all segment', () => {
    expect(nextPatternToPathToRegexp('/shop/[[...path]]')).toBe('/shop{/*path}')
  })

  it('converts multiple dynamic segments', () => {
    expect(nextPatternToPathToRegexp('/news/[category]/[slug]')).toBe('/news/:category/:slug')
  })
})
