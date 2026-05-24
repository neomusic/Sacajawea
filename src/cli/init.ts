import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { configImportPathForSegments, configTemplate, localeLayoutTemplate, pageTemplate, proxyTemplate } from './templates'

export const runInit = ({
  cwd,
  defaultLocale = 'en',
  locales = ['en']
}: { cwd: string; defaultLocale?: string; locales?: string[] }): void => {
  const hasApp = existsSync(join(cwd, 'app'))
  const hasPages = existsSync(join(cwd, 'pages'))

  if (!hasApp && !hasPages) {
    throw new Error('Could not find an app/ or pages/ directory — run this from a Next.js project root')
  }

  writeFileSync(join(cwd, 'sacajawea.config.ts'), configTemplate(defaultLocale, locales))

  if (hasApp) {
    const localeDir = join(cwd, 'app', '[locale]')
    mkdirSync(localeDir, { recursive: true })
    writeFileSync(join(localeDir, 'layout.tsx'), localeLayoutTemplate())
    writeFileSync(join(localeDir, 'page.tsx'), pageTemplate('home', configImportPathForSegments([])))
    writeFileSync(join(cwd, 'proxy.ts'), proxyTemplate())
  }
}
