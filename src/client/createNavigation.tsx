'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import type { ComponentProps } from 'react'
import { getPathname } from '../core/resolve'
import type { RoutesConfig } from '../core/types'

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href?: ComponentProps<typeof NextLink>['href']
  route?: string
  locale?: string
  params?: Record<string, string | string[]>
}

export const createNavigation = (config: RoutesConfig) => {
  const useLocale = (): string => {
    const routeParams = useParams<{ locale?: string }>()
    return routeParams?.locale ?? config.defaultLocale
  }

  const Link = ({ route, locale, params, href, ...rest }: LinkProps) => {
    const resolvedHref = route
      ? getPathname(config, { route, locale: locale ?? config.defaultLocale, params })
      : href
    return <NextLink href={resolvedHref!} {...rest} />
  }

  return { Link, useLocale }
}
