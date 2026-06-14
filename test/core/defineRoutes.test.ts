import { describe, it, expect } from 'vitest'
import { defineRoutes } from '../../src/core/defineRoutes'

describe('defineRoutes', () => {
  const valid = {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routes: {
      home: { it: '/', en: '/' },
      news: { it: '/notizie', en: '/news' }
    }
  }

  it('returns the config unchanged when valid', () => {
    expect(defineRoutes(valid)).toEqual(valid)
  })

  it('throws when defaultLocale is not in locales', () => {
    expect(() => defineRoutes({ ...valid, defaultLocale: 'fr' })).toThrow(/defaultLocale/)
  })

  it('throws when a route is missing a locale', () => {
    const broken = { ...valid, routes: { ...valid.routes, news: { it: '/notizie' } } }
    expect(() => defineRoutes(broken)).toThrow(/news.*en/)
  })
})
