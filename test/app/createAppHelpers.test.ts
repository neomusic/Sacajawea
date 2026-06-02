import { describe, it, expect } from 'vitest'
import { defineRoutes } from '../../src/core/defineRoutes'
import { createAppHelpers } from '../../src/app/createAppHelpers'

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

describe('alternatesMetadata', () => {
  it('returns canonical, languages and x-default for generateMetadata', () => {
    const { alternatesMetadata } = createAppHelpers(config)
    expect(alternatesMetadata({ route: 'news', locale: 'en' })).toEqual({
      canonical: 'https://example.com/en/news',
      languages: {
        it: 'https://example.com/it/notizie',
        en: 'https://example.com/en/news',
        'x-default': 'https://example.com/it/notizie'
      }
    })
  })
})

describe('buildSitemap', () => {
  it('returns a sitemap entry with per-locale alternates', () => {
    const { buildSitemap } = createAppHelpers(config)
    expect(buildSitemap({ route: 'news', locale: 'it' })).toEqual({
      url: 'https://example.com/it/notizie',
      alternates: {
        languages: {
          it: 'https://example.com/it/notizie',
          en: 'https://example.com/en/news',
          'x-default': 'https://example.com/it/notizie'
        }
      }
    })
  })
})

describe('generateLocaleParams', () => {
  it('returns one params object per locale', () => {
    const { generateLocaleParams } = createAppHelpers(config)
    expect(generateLocaleParams()).toEqual([{ locale: 'it' }, { locale: 'en' }])
  })
})

describe('createProxy / createMiddleware', () => {
  const makeRequest = (pathname: string, acceptLanguage = '') => ({
    nextUrl: { pathname },
    headers: new Map([['accept-language', acceptLanguage]])
  })

  it('are the same function under both names', () => {
    const { createProxy, createMiddleware } = createAppHelpers(config)
    expect(createProxy).toBe(createMiddleware)
  })

  it('redirects "/" to the accept-language-detected locale', () => {
    const { createProxy } = createAppHelpers(config)
    const result = createProxy(makeRequest('/', 'en'))
    expect(result.redirect).toBe('/en')
  })

  it('falls back to defaultLocale when accept-language matches nothing configured', () => {
    const { createProxy } = createAppHelpers(config)
    const result = createProxy(makeRequest('/', 'fr'))
    expect(result.redirect).toBe('/it')
  })

  it('rewrites a pretty localized path to the internal default-locale-shaped path', () => {
    const { createProxy } = createAppHelpers(config)
    const result = createProxy(makeRequest('/en/news/hello'))
    expect(result.rewrite).toBe('/en/notizie/hello')
  })

  it('passes through unmatched paths untouched', () => {
    const { createProxy } = createAppHelpers(config)
    const result = createProxy(makeRequest('/it/notizie/hello'))
    expect(result).toEqual({})
  })
})
