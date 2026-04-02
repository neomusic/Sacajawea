import { getAlternates, getPathname, internalPathname, matchPathname } from '../core/resolve'
import type { RoutesConfig } from '../types/core'
import type { Params } from '../types/shared'
import type { MinimalRequest, ProxyResult } from '../types/app'

const headerValue = (headers: MinimalRequest['headers'], name: string): string =>
  (headers instanceof Map ? headers.get(name) : headers.get(name)) ?? ''

const detectLocale = (config: RoutesConfig, acceptLanguage: string): string => {
  const preferred = acceptLanguage.split(',').map(part => part.split(';')[0]!.trim().slice(0, 2))
  return preferred.find(lang => config.locales.includes(lang)) ?? config.defaultLocale
}

export const createAppHelpers = (config: RoutesConfig) => {
  const alternatesMetadata = ({
    route,
    locale = config.defaultLocale,
    params = {}
  }: { route: string; locale?: string; params?: Params }) => ({
    canonical: `${config.siteUrl?.replace(/\/$/, '') ?? ''}${getPathname(config, { route, locale, params })}`,
    languages: getAlternates(config, { route, params })
  })

  const buildSitemap = ({
    route,
    locale = config.defaultLocale,
    params = {}
  }: { route: string; locale?: string; params?: Params }) => ({
    url: `${config.siteUrl?.replace(/\/$/, '') ?? ''}${getPathname(config, { route, locale, params })}`,
    alternates: { languages: getAlternates(config, { route, params }) }
  })

  const generateLocaleParams = () => config.locales.map(locale => ({ locale }))

  const proxy = (request: MinimalRequest): ProxyResult => {
    const { pathname } = request.nextUrl

    if (pathname === '/') {
      return { redirect: `/${detectLocale(config, headerValue(request.headers, 'accept-language'))}` }
    }

    const matched = matchPathname(config, pathname)
    if (!matched) return {}

    const internal = internalPathname(config, matched)
    return internal === pathname ? {} : { rewrite: internal }
  }

  return {
    alternatesMetadata,
    buildSitemap,
    generateLocaleParams,
    createProxy: proxy,
    createMiddleware: proxy
  }
}
