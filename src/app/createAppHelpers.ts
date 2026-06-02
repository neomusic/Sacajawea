import { getAlternates, getPathname, internalPathname, matchPathname } from '../core/resolve'
import type { RoutesConfig } from '../core/types'

type Params = Record<string, string | string[]>

interface MinimalRequest {
  nextUrl: { pathname: string }
  headers: { get(name: string): string | null | undefined } | Map<string, string>
}

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

  const proxy = (request: MinimalRequest): { redirect?: string; rewrite?: string } => {
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
