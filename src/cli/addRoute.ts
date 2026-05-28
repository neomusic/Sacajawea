import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pageTemplate } from './templates'

export const extractLocales = (configSource: string): string[] => {
  const match = configSource.match(/locales:\s*\[([^\]]*)\]/)
  if (!match?.[1]) return []
  return match[1].split(',').map(entry => entry.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
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

  const entry = `    ${name}: { ${Object.entries(slugs).map(([locale, slug]) => `${locale}: '/${slug}'`).join(', ')} }`
  const updated = source.replace(/routes:\s*{\n/, `routes: {\n${entry},\n`)
  writeFileSync(configPath, updated)

  const pageDir = join(cwd, 'app', '[locale]', name)
  if (!existsSync(pageDir)) mkdirSync(pageDir, { recursive: true })
  writeFileSync(join(pageDir, 'page.tsx'), pageTemplate(name))
}
