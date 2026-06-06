import { describe, it, expect } from 'vitest'
import { defineRoutes } from '../../src/core/defineRoutes'
import { getPathname, getAlternates, matchPathname, internalPathname } from '../../src/core/resolve'

const config = defineRoutes({
  defaultLocale: 'it',
  locales: ['it', 'en'],
  siteUrl: 'https://example.com',
  routes: {
    home: { it: '/', en: '/' },
    news: { it: '/notizie', en: '/news' },
    newsDetail: { it: '/notizie/[slug]', en: '/news/[slug]' }
  }
})

describe('getPathname', () => {
  it('builds the home pathname for a locale', () => {
    expect(getPathname(config, { route: 'home', locale: 'en' })).toBe('/en')
  })

  it('builds a static localized pathname', () => {
    expect(getPathname(config, { route: 'news', locale: 'it' })).toBe('/it/notizie')
  })

  it('substitutes dynamic params', () => {
    expect(getPathname(config, { route: 'newsDetail', locale: 'en', params: { slug: 'hello' } }))
      .toBe('/en/news/hello')
  })

  it('throws for an unknown route', () => {
    expect(() => getPathname(config, { route: 'missing', locale: 'it' })).toThrow(/missing/)
  })
})

describe('getAlternates', () => {
  it('returns one absolute url per locale plus x-default', () => {
    expect(getAlternates(config, { route: 'newsDetail', params: { slug: 'hello' } })).toEqual({
      it: 'https://example.com/it/notizie/hello',
      en: 'https://example.com/en/news/hello',
      'x-default': 'https://example.com/it/notizie/hello'
    })
  })
})

describe('matchPathname', () => {
  it('matches a static localized path', () => {
    expect(matchPathname(config, '/it/notizie')).toEqual({ route: 'news', locale: 'it', params: {} })
  })

  it('matches a dynamic localized path and extracts params', () => {
    expect(matchPathname(config, '/en/news/hello'))
      .toEqual({ route: 'newsDetail', locale: 'en', params: { slug: 'hello' } })
  })

  it('returns null for an unknown locale prefix', () => {
    expect(matchPathname(config, '/fr/news/hello')).toBeNull()
  })

  it('returns null for a path with no matching route', () => {
    expect(matchPathname(config, '/it/does-not-exist')).toBeNull()
  })
})

describe('internalPathname', () => {
  it('rewrites to the default-locale pattern shape, keeping the requested locale segment', () => {
    expect(internalPathname(config, { route: 'newsDetail', locale: 'en', params: { slug: 'hello' } }))
      .toBe('/en/notizie/hello')
  })
})
