import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runAddRoute, extractLocales, extractDefaultLocale } from '../../src/cli/addRoute'

describe('extractLocales', () => {
  it('reads the locales array out of a sacajawea.config.ts source string', () => {
    const source = `export default defineRoutes({\n  defaultLocale: 'it',\n  locales: ['it', 'en', 'de'],\n  routes: {}\n})\n`
    expect(extractLocales(source)).toEqual(['it', 'en', 'de'])
  })

  it('returns an empty array when no locales array is found', () => {
    expect(extractLocales('export default {}')).toEqual([])
  })
})

describe('extractDefaultLocale', () => {
  it('reads defaultLocale out of a sacajawea.config.ts source string', () => {
    const source = `export default defineRoutes({\n  defaultLocale: 'it',\n  locales: ['it', 'en'],\n  routes: {}\n})\n`
    expect(extractDefaultLocale(source)).toBe('it')
  })

  it('returns undefined when no defaultLocale is found', () => {
    expect(extractDefaultLocale('export default {}')).toBeUndefined()
  })
})

let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'sacajawea-add-route-'))
  mkdirSync(join(cwd, 'app', '[locale]'), { recursive: true })
  writeFileSync(
    join(cwd, 'sacajawea.config.ts'),
    `import { defineRoutes } from '@neomusic/sacajawea'\n\nexport default defineRoutes({\n  defaultLocale: 'it',\n  locales: ['it', 'en'],\n  routes: {\n    home: { it: '/', en: '/' }\n  }\n})\n`
  )
})

afterEach(() => { rmSync(cwd, { recursive: true, force: true }) })

describe('runAddRoute', () => {
  it('scaffolds the page at the default locale slug, since that is what the proxy rewrites to', async () => {
    await runAddRoute({ cwd, name: 'news', slugs: { it: 'notizie', en: 'news' } })

    expect(existsSync(join(cwd, 'app', '[locale]', 'notizie', 'page.tsx'))).toBe(true)
    expect(existsSync(join(cwd, 'app', '[locale]', 'news', 'page.tsx'))).toBe(false)

    const config = readFileSync(join(cwd, 'sacajawea.config.ts'), 'utf8')
    expect(config).toContain(`news: { it: '/notizie', en: '/news' }`)
  })

  it('scaffolds a dynamic segment using the Next.js bracket folder convention', async () => {
    await runAddRoute({ cwd, name: 'newsDetail', slugs: { it: 'notizie/[slug]', en: 'news/[slug]' } })

    expect(existsSync(join(cwd, 'app', '[locale]', 'notizie', '[slug]', 'page.tsx'))).toBe(true)
  })

  it('throws if the route name already exists in the config', async () => {
    await runAddRoute({ cwd, name: 'news', slugs: { it: 'notizie', en: 'news' } })
    await expect(runAddRoute({ cwd, name: 'news', slugs: { it: 'notizie', en: 'news' } }))
      .rejects.toThrow(/already exists/)
  })
})
