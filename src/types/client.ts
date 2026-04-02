import type { ComponentProps } from 'react'
import type NextLink from 'next/link'
import type { Params } from './shared'

export type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & {
  href?: ComponentProps<typeof NextLink>['href']
  route?: string
  locale?: string
  params?: Params
}
