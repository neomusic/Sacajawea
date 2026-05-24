import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { configImportPathForSegments, pageTemplate } from './templates'

export const extractLocales = (configSource: string): string[] => {
  const match = configSource.match(/locales:\s*\[([^\]]*)\]/)
  if (!match?.[1]) return []
  return match[1].split(',').map(entry => entry.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
}

export const extractDefaultLocale = (configSource: string): string | undefined => {
  const match = configSource.match(/defaultLocale:\s*['"]([^'"]+)['"]/)
  return match?.[1]
}

export const runAddRoute = async ({
  cwd,
  name,
  slugs
}: { cwd: string; name: string; slugs: Record<string, string> }): Promise<void> => {
  const configPath = join(cwd, 'sacajawea.config.ts')
  const source = readFileSync(configPath, 'utf8')

  const routeRegex = new RegExp(`\\b${name}\\s*:`)
  if (routeRegex.test(source)) {
    throw new Error(`Route "${name}" already exists in sacajawea.config.ts`)
  }

  const defaultLocale = extractDefaultLocale(source)
  const defaultSlug = defaultLocale ? slugs[defaultLocale] : undefined
  if (!defaultLocale || !defaultSlug) {
    throw new Error('Could not determine the default locale slug from sacajawea.config.ts')
  }

  const entry = `    ${name}: { ${Object.entries(slugs).map(([locale, slug]) => `${locale}: '/${slug}'`).join(', ')} }`
  const updated = source.replace(/routes:\s*{\n/, `routes: {\n${entry},\n`)
  writeFileSync(configPath, updated)

  // The proxy rewrites every locale's pretty URL onto the default locale's
  // slug shape (see core/resolve.ts internalPathname), so the page file
  // must live at that shape, not at the abstract route name.
  const segments = defaultSlug.split('/').filter(Boolean)
  const pageDir = join(cwd, 'app', '[locale]', ...segments)
  if (!existsSync(pageDir)) mkdirSync(pageDir, { recursive: true })
  writeFileSync(join(pageDir, 'page.tsx'), pageTemplate(name, configImportPathForSegments(segments)))
}
