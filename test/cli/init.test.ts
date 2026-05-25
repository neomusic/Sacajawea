import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runInit } from '../../src/cli/init'

let cwd: string

beforeEach(() => { cwd = mkdtempSync(join(tmpdir(), 'sacajawea-init-')) })
afterEach(() => { rmSync(cwd, { recursive: true, force: true }) })

describe('runInit', () => {
  it('detects an App Router project and scaffolds config + locale segment + proxy', () => {
    mkdirSync(join(cwd, 'app'), { recursive: true })

    runInit({ cwd })

    expect(existsSync(join(cwd, 'sacajawea.config.ts'))).toBe(true)
    expect(existsSync(join(cwd, 'app', '[locale]', 'layout.tsx'))).toBe(true)
    expect(existsSync(join(cwd, 'app', '[locale]', 'page.tsx'))).toBe(true)
    expect(existsSync(join(cwd, 'proxy.ts'))).toBe(true)
    expect(readFileSync(join(cwd, 'sacajawea.config.ts'), 'utf8')).toContain('defineRoutes')
    expect(readFileSync(join(cwd, 'app', '[locale]', 'page.tsx'), 'utf8')).toContain(`route: 'home'`)
  })

  it('throws when neither app/ nor pages/ exists', () => {
    expect(() => runInit({ cwd })).toThrow(/app.*pages/i)
  })
})
