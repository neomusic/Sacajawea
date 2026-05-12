export const configTemplate = (defaultLocale: string, locales: string[]) => `import { defineRoutes } from '@neomusic/sacajawea'

export default defineRoutes({
  defaultLocale: '${defaultLocale}',
  locales: [${locales.map(l => `'${l}'`).join(', ')}],
  routes: {
    home: { ${locales.map(l => `${l}: '/'`).join(', ')} }
  }
})
`

export const localeLayoutTemplate = () => `import type { ReactNode } from 'react'
import { createAppHelpers } from '@neomusic/sacajawea/app'
import config from '../../sacajawea.config'

const { generateLocaleParams } = createAppHelpers(config)

export const generateStaticParams = generateLocaleParams

export default function LocaleLayout({ children }: { children: ReactNode }) {
  return children
}
`

export const proxyTemplate = () => `import { NextResponse, type NextRequest } from 'next/server'
import { createAppHelpers } from '@neomusic/sacajawea/app'
import routesConfig from './sacajawea.config'

const { createProxy } = createAppHelpers(routesConfig)

export default function proxy(request: NextRequest) {
  const result = createProxy(request)

  if (result.redirect) return NextResponse.redirect(new URL(result.redirect, request.url))
  if (result.rewrite) return NextResponse.rewrite(new URL(result.rewrite, request.url))

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|.*\\\\..*).*)']
}
`

export const configImportPathForSegments = (segments: string[]): string =>
  `${'../'.repeat(2 + segments.length)}sacajawea.config`

export const pageTemplate = (routeName: string, configImportPath: string) =>
  `import { createAppHelpers } from '@neomusic/sacajawea/app'
import config from '${configImportPath}'

const { alternatesMetadata } = createAppHelpers(config)

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { alternates: alternatesMetadata({ route: '${routeName}', locale }) }
}

export default function Page() {
  return null
}
`
