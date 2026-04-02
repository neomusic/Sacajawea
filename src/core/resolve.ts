import { compile, match } from 'path-to-regexp'
import { nextPatternToPathToRegexp } from './pattern'
import type { RoutesConfig } from '../types/core'
import type { Params } from '../types/shared'

const normalize = (pattern: string) => (pattern === '/' ? '' : pattern)

const patternFor = (config: RoutesConfig, route: string, locale: string): string => {
  const patterns = config.routes[route]
  if (!patterns) throw new Error(`Unknown route "${route}"`)
  const pattern = patterns[locale]
  if (typeof pattern !== 'string') throw new Error(`Route "${route}" has no pattern for locale "${locale}"`)
  return pattern
}

export const getPathname = (
  config: RoutesConfig,
  { route, locale, params = {} }: { route: string; locale: string; params?: Params }
): string => {
  const pattern = patternFor(config, route, locale)
  const toPath = compile(nextPatternToPathToRegexp(normalize(pattern)))
  return `/${locale}${toPath(params)}`
}

export const getAlternates = (
  config: RoutesConfig,
  { route, params = {} }: { route: string; params?: Params }
): Record<string, string> => {
  const base = config.siteUrl?.replace(/\/$/, '') ?? ''
  const entries = config.locales.map(locale => [locale, `${base}${getPathname(config, { route, locale, params })}`])
  const defaultUrl = `${base}${getPathname(config, { route, locale: config.defaultLocale, params })}`
  return { ...Object.fromEntries(entries), 'x-default': defaultUrl }
}

export const matchPathname = (
  config: RoutesConfig,
  pathname: string
): { route: string; locale: string; params: Params } | null => {
  const [, localeSegment, ...rest] = pathname.split('/')
  if (!localeSegment || !config.locales.includes(localeSegment)) return null
  const remainder = rest.join('/')

  for (const [route, patterns] of Object.entries(config.routes)) {
    const pattern = patterns[localeSegment]
    if (!pattern) continue
    const matcher = match(nextPatternToPathToRegexp(normalize(pattern)))
    const result = matcher(remainder ? `/${remainder}` : '')
    if (result) {
      return { route, locale: localeSegment, params: result.params as Params }
    }
  }
  return null
}

export const internalPathname = (
  config: RoutesConfig,
  { route, locale, params = {} }: { route: string; locale: string; params?: Params }
): string => {
  const pattern = patternFor(config, route, config.defaultLocale)
  const toPath = compile(nextPatternToPathToRegexp(normalize(pattern)))
  return `/${locale}${toPath(params)}`
}
