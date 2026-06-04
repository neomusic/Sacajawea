import { describe, it, expect, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { defineRoutes } from '../../src/core/defineRoutes'
import { createNavigation } from '../../src/client/createNavigation'

vi.mock('next/navigation', () => ({ useParams: () => ({ locale: 'en' }) }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: ComponentProps<'a'>) => <a href={href} {...rest}>{children}</a>
}))

const config = defineRoutes({
  defaultLocale: 'it',
  locales: ['it', 'en'],
  routes: { news: { it: '/notizie', en: '/news' } }
})

describe('createNavigation', () => {
  it('Link resolves a localized href from route + locale', () => {
    const { Link } = createNavigation(config)
    render(<Link route="news" locale="en">News</Link>)
    expect(screen.getByRole('link', { name: 'News' })).toHaveAttribute('href', '/en/news')
  })

  it('Link passes through a plain href when no route is given', () => {
    const { Link } = createNavigation(config)
    render(<Link href="/external">Ext</Link>)
    expect(screen.getByRole('link', { name: 'Ext' })).toHaveAttribute('href', '/external')
  })

  it('useLocale reads the locale from the [locale] route segment', () => {
    const { useLocale } = createNavigation(config)
    let observed: string | undefined
    function Probe() { observed = useLocale(); return null }
    render(<Probe />)
    expect(observed).toBe('en')
  })
})
