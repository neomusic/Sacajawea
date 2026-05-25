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

export const proxyTemplate = () => `import { createProxy } from '@neomusic/sacajawea/app'
import config from './sacajawea.config'

export default createProxy(config)

export const proxyConfig = {
  matcher: ['/((?!_next|api|.*\\\\..*).*)']
}
`

export const pageTemplate = (routeName: string, configImportPath = '../../../sacajawea.config') =>
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
