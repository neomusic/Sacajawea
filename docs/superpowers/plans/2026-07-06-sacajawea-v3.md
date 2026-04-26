# Sacajawea v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite Sacajawea as `@neomusic/sacajawea` v3.0.0 — a TypeScript toolkit that layers SEO-correct, pretty-URL, multi-locale routing on top of Next.js App Router's native `[locale]` + middleware pattern, instead of replacing Next's routing like v2 did.

**Architecture:** Four subpath packages built from one TS source tree with tsup (ESM+CJS+`.d.ts`):
- `sacajawea` (core): framework-agnostic route registry + resolver (`defineRoutes`, `getPathname`, `getAlternates`, `matchPathname`). No React/Next import.
- `sacajawea/client`: `"use client"` — `createNavigation(config)` → `{ Link, useLocale }`.
- `sacajawea/app`: App Router helpers — `createAppHelpers(config)` → `{ alternatesMetadata, buildSitemap, generateLocaleParams, createProxy, createMiddleware }`.
- `sacajawea/cli` (bin `sacajawea`): `init` and `add-route` commands.

Public URLs are per-locale "pretty" slugs (`/it/notizie`, `/en/news`); internally every route lives once under the **default locale's** pattern shape (`app/[locale]/news/[slug]/page.tsx`). The proxy/middleware rewrites incoming pretty paths in any locale to that one internal path, reusing the same resolver used for `Link`/metadata — one source of truth, no separate rewrite-map concept.

**Tech Stack:** TypeScript, tsup, vitest, `path-to-regexp@8`, `commander`, `@inquirer/prompts`, ESLint flat config. Peer deps: `next >=14`, `react ^18 || ^19`.

## Global Constraints

- npm scope rename: `@palmabit/sacajawea` → `@neomusic/sacajawea`, version `3.0.0`.
- `package.json` `repository`/`bugs`/`homepage`/`author` point to the new neomusic/sacajawea origin, not Palmabit-IT.
- No class-extends of `next/link` or `next/router`; no imports from `next/dist/...` internals.
- Pages Router adapter, `<LocaleSwitcher>`, `sacajawea doctor`, JSON-LD helpers, codemod: explicitly out of scope for this delivery (follow-ups).
- Branch `v3` off `master`. Commits: small, thematic, Conventional Commits style, no `Co-Authored-By` trailer, no emoji. Comments only where logic is non-obvious.
- Node >=18 required for the toolchain (this sandbox: nvm-installed Node 22, set as default).
- Every locale must provide a pattern for every route (`defineRoutes` throws otherwise) — keeps the resolver's assumptions simple and enforced at config time, not scattered as null-checks later.

---

## File Structure

```
package.json                         # rewritten: name, exports, bin, scripts, deps
tsup.config.ts                       # multi-entry build -> dist/{core,client,app,cli}
tsconfig.json
vitest.config.ts
eslint.config.js                     # flat config, replaces .eslintrc.json
.github/workflows/ci.yml             # replaces .travis.yml
.gitignore                           # add dist/, .tsbuildinfo
src/
  core/
    types.ts                         # RoutesInput, RoutesConfig, ParamsOf<Pattern>
    pattern.ts                       # nextPatternToPathToRegexp()
    defineRoutes.ts                  # defineRoutes()
    resolve.ts                       # getPathname, getAlternates, matchPathname, internalPathname
    index.ts                         # public re-exports
  client/
    createNavigation.tsx             # createNavigation(config) -> { Link, useLocale }
    index.ts
  app/
    createAppHelpers.ts              # createAppHelpers(config) -> the 5 helpers
    index.ts
  cli/
    bin.ts                          # commander entry, shebang
    init.ts
    addRoute.ts
    templates.ts                     # string-template functions for scaffolded files
    index.ts
test/
  core/pattern.test.ts
  core/defineRoutes.test.ts
  core/resolve.test.ts
  client/createNavigation.test.tsx
  app/createAppHelpers.test.ts
  cli/init.test.ts
  cli/addRoute.test.ts
README.md                            # rewritten for v3
docs/MIGRATION-v2-v3.md
```

---

## Task 1: Repo scaffold and toolchain

**Files:**
- Modify: `package.json` (full rewrite)
- Create: `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `eslint.config.js`
- Modify: `.gitignore`
- Delete: `.babelrc`, `.eslintrc.json`, `.travis.yml`

**Interfaces:** none (no code yet) — this task only needs `npm run build`/`npm test` to execute (against an empty `src/` placeholder) before Task 2 starts writing real modules.

- [x] **Step 1: Write `package.json`**

```json
{
  "name": "@neomusic/sacajawea",
  "version": "3.0.0",
  "description": "SEO-correct multi-locale routing for Next.js App Router, built on native i18n",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/neomusic/sacajawea.git"
  },
  "bugs": {
    "url": "https://github.com/neomusic/sacajawea/issues"
  },
  "homepage": "https://github.com/neomusic/sacajawea#readme",
  "author": "neomusic",
  "license": "MIT",
  "keywords": ["next", "next.js", "react", "i18n", "seo", "hreflang", "app-router", "routing"],
  "files": ["dist"],
  "bin": {
    "sacajawea": "./dist/cli/bin.js"
  },
  "exports": {
    ".": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js",
      "require": "./dist/core/index.cjs"
    },
    "./client": {
      "types": "./dist/client/index.d.ts",
      "import": "./dist/client/index.js",
      "require": "./dist/client/index.cjs"
    },
    "./app": {
      "types": "./dist/app/index.d.ts",
      "import": "./dist/app/index.js",
      "require": "./dist/app/index.cjs"
    }
  },
  "scripts": {
    "build": "tsup",
    "lint": "eslint src test",
    "lint-fix": "eslint --fix src test",
    "test": "vitest run",
    "testDev": "vitest",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run lint && npm run typecheck && npm run test && npm run build"
  },
  "peerDependencies": {
    "next": ">=14",
    "react": "^18 || ^19"
  },
  "dependencies": {
    "path-to-regexp": "^8.2.0",
    "commander": "^12.1.0",
    "@inquirer/prompts": "^7.2.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsup": "^8.5.1",
    "vitest": "^3.0.0",
    "eslint": "^9.17.0",
    "@typescript-eslint/eslint-plugin": "^8.19.0",
    "@typescript-eslint/parser": "^8.19.0",
    "next": "^16.2.10",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@testing-library/react": "^16.1.0"
  }
}
```

- [x] **Step 2: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src", "test"]
}
```

- [x] **Step 3: Write `tsup.config.ts`**

```ts
import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: {
      'core/index': 'src/core/index.ts',
      'client/index': 'src/client/index.ts',
      'app/index': 'src/app/index.ts'
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react', 'react-dom', 'next']
  },
  {
    entry: { 'cli/bin': 'src/cli/bin.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    banner: { js: '#!/usr/bin/env node' }
  }
])
```

- [x] **Step 4: Write `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}']
    }
  }
})
```

- [x] **Step 5: Write `eslint.config.js`**

```js
import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  { ignores: ['dist/**'] }
]
```

Add `@eslint/js` to devDependencies alongside the others from Step 1.

- [x] **Step 6: Update `.gitignore`**

Add `dist/`, `node_modules/`, `*.tsbuildinfo`, `coverage/` (keep any existing unrelated entries).

- [x] **Step 7: Delete legacy toolchain files**

```bash
git rm .babelrc .eslintrc.json .travis.yml
```

- [x] **Step 8: Install and verify the toolchain boots**

```bash
npm install
npm run typecheck
```

Expected: `npm install` resolves without peer conflicts; `typecheck` passes trivially (no `src/**/*.ts` yet, or a placeholder empty file — create `src/core/index.ts` with just `export {}` so `tsc` has something to check).

- [x] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsup.config.ts vitest.config.ts eslint.config.js .gitignore src/core/index.ts
git commit -m "chore: rebuild toolchain in TypeScript (tsup, vitest, eslint flat config)"
```

---

## Task 2: Core — pattern translation (`src/core/pattern.ts`)

**Files:**
- Create: `src/core/pattern.ts`
- Test: `test/core/pattern.test.ts`

**Interfaces:**
- Produces: `nextPatternToPathToRegexp(pattern: string): string` — used by Task 4 (`resolve.ts`).

- [x] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { nextPatternToPathToRegexp } from '../../src/core/pattern'

describe('nextPatternToPathToRegexp', () => {
  it('leaves static segments untouched', () => {
    expect(nextPatternToPathToRegexp('/notizie')).toBe('/notizie')
  })

  it('converts a dynamic segment', () => {
    expect(nextPatternToPathToRegexp('/news/[slug]')).toBe('/news/:slug')
  })

  it('converts a catch-all segment', () => {
    expect(nextPatternToPathToRegexp('/docs/[...path]')).toBe('/docs/:path+')
  })

  it('converts an optional catch-all segment', () => {
    expect(nextPatternToPathToRegexp('/shop/[[...path]]')).toBe('/shop{/:path*}')
  })

  it('converts multiple dynamic segments', () => {
    expect(nextPatternToPathToRegexp('/news/[category]/[slug]')).toBe('/news/:category/:slug')
  })
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/core/pattern.test.ts`
Expected: FAIL — `Cannot find module '../../src/core/pattern'`.

- [x] **Step 3: Implement**

```ts
export const nextPatternToPathToRegexp = (pattern: string): string =>
  pattern
    .replace(/\/\[\[\.\.\.(\w+)\]\]/g, '{/:$1*}')
    .replace(/\[\.\.\.(\w+)\]/g, ':$1+')
    .replace(/\[(\w+)\]/g, ':$1')
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/core/pattern.test.ts`
Expected: PASS (5 tests).

- [x] **Step 5: Commit**

```bash
git add src/core/pattern.ts test/core/pattern.test.ts
git commit -m "feat(core): translate Next.js bracket patterns to path-to-regexp syntax"
```

---

## Task 3: Core — types and `defineRoutes`

**Files:**
- Create: `src/core/types.ts`, `src/core/defineRoutes.ts`
- Test: `test/core/defineRoutes.test.ts`

**Interfaces:**
- Consumes: nothing yet (pure config validation).
- Produces: `RoutesConfig`, `RouteParams<Config, RouteName>` (used by `Link`/`useLocale`/app helpers for typed params), `defineRoutes(input: RoutesInput): RoutesConfig`.

- [x] **Step 1: Write `src/core/types.ts`**

```ts
export type RoutePatterns = Record<string, string>

export interface RoutesInput<TRoutes extends Record<string, RoutePatterns> = Record<string, RoutePatterns>> {
  defaultLocale: string
  locales: string[]
  siteUrl?: string
  routes: TRoutes
}

export interface RoutesConfig<TRoutes extends Record<string, RoutePatterns> = Record<string, RoutePatterns>> {
  defaultLocale: string
  locales: string[]
  siteUrl?: string
  routes: TRoutes
}

type ParamsOf<Pattern extends string> = Pattern extends `${string}[...${infer P}]${infer Rest}`
  ? { [K in P]: string[] } & ParamsOf<Rest>
  : Pattern extends `${string}[${infer P}]${infer Rest}`
    ? { [K in P]: string } & ParamsOf<Rest>
    : Record<string, never>

export type RouteParams<
  TConfig extends RoutesConfig,
  TName extends keyof TConfig['routes']
> = ParamsOf<TConfig['routes'][TName][TConfig['defaultLocale']]>
```

- [x] **Step 2: Write the failing tests for `defineRoutes`**

```ts
import { describe, it, expect } from 'vitest'
import { defineRoutes } from '../../src/core/defineRoutes'

describe('defineRoutes', () => {
  const valid = {
    defaultLocale: 'it',
    locales: ['it', 'en'],
    routes: {
      home: { it: '/', en: '/' },
      news: { it: '/notizie', en: '/news' }
    }
  }

  it('returns the config unchanged when valid', () => {
    expect(defineRoutes(valid)).toEqual(valid)
  })

  it('throws when defaultLocale is not in locales', () => {
    expect(() => defineRoutes({ ...valid, defaultLocale: 'fr' })).toThrow(/defaultLocale/)
  })

  it('throws when a route is missing a locale', () => {
    const broken = { ...valid, routes: { ...valid.routes, news: { it: '/notizie' } } }
    expect(() => defineRoutes(broken)).toThrow(/news.*en/)
  })
})
```

- [x] **Step 3: Run tests to verify they fail**

Run: `npx vitest run test/core/defineRoutes.test.ts`
Expected: FAIL — module not found.

- [x] **Step 4: Implement `src/core/defineRoutes.ts`**

```ts
import type { RoutesInput, RoutesConfig } from './types'

export const defineRoutes = <TRoutes extends Record<string, Record<string, string>>>(
  input: RoutesInput<TRoutes>
): RoutesConfig<TRoutes> => {
  if (!input.locales.includes(input.defaultLocale)) {
    throw new Error(`defaultLocale "${input.defaultLocale}" must be included in locales`)
  }

  for (const [name, patterns] of Object.entries(input.routes)) {
    for (const locale of input.locales) {
      if (typeof patterns[locale] !== 'string') {
        throw new Error(`Route "${name}" is missing a pattern for locale "${locale}"`)
      }
    }
  }

  return input
}
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npx vitest run test/core/defineRoutes.test.ts`
Expected: PASS (3 tests).

- [x] **Step 6: Commit**

```bash
git add src/core/types.ts src/core/defineRoutes.ts test/core/defineRoutes.test.ts
git commit -m "feat(core): add defineRoutes with per-locale validation and typed params"
```

---

## Task 4: Core — resolver (`getPathname`, `getAlternates`, `matchPathname`, `internalPathname`)

**Files:**
- Create: `src/core/resolve.ts`
- Test: `test/core/resolve.test.ts`

**Interfaces:**
- Consumes: `RoutesConfig` (Task 3), `nextPatternToPathToRegexp` (Task 2).
- Produces: `getPathname`, `getAlternates`, `matchPathname`, `internalPathname` — consumed by `client/createNavigation.tsx` (Task 5), `app/createAppHelpers.ts` (Task 6).

- [x] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { defineRoutes } from '../../src/core/defineRoutes'
import { getPathname, getAlternates, matchPathname, internalPathname } from '../../src/core/resolve'

const config = defineRoutes({
  defaultLocale: 'it',
  locales: ['it', 'en'],
  siteUrl: 'https://example.com',
  routes: {
    home: { it: '/', en: '/' },
    news: { it: '/notizie', en: '/news' },
    newsDetail: { it: '/notizie/[slug]', en: '/news/[slug]' }
  }
})

describe('getPathname', () => {
  it('builds the home pathname for a locale', () => {
    expect(getPathname(config, { route: 'home', locale: 'en' })).toBe('/en')
  })

  it('builds a static localized pathname', () => {
    expect(getPathname(config, { route: 'news', locale: 'it' })).toBe('/it/notizie')
  })

  it('substitutes dynamic params', () => {
    expect(getPathname(config, { route: 'newsDetail', locale: 'en', params: { slug: 'hello' } }))
      .toBe('/en/news/hello')
  })

  it('throws for an unknown route', () => {
    expect(() => getPathname(config, { route: 'missing', locale: 'it' })).toThrow(/missing/)
  })
})

describe('getAlternates', () => {
  it('returns one absolute url per locale plus x-default', () => {
    expect(getAlternates(config, { route: 'newsDetail', params: { slug: 'hello' } })).toEqual({
      it: 'https://example.com/it/notizie/hello',
      en: 'https://example.com/en/news/hello',
      'x-default': 'https://example.com/it/notizie/hello'
    })
  })
})

describe('matchPathname', () => {
  it('matches a static localized path', () => {
    expect(matchPathname(config, '/it/notizie')).toEqual({ route: 'news', locale: 'it', params: {} })
  })

  it('matches a dynamic localized path and extracts params', () => {
    expect(matchPathname(config, '/en/news/hello'))
      .toEqual({ route: 'newsDetail', locale: 'en', params: { slug: 'hello' } })
  })

  it('returns null for an unknown locale prefix', () => {
    expect(matchPathname(config, '/fr/news/hello')).toBeNull()
  })

  it('returns null for a path with no matching route', () => {
    expect(matchPathname(config, '/it/does-not-exist')).toBeNull()
  })
})

describe('internalPathname', () => {
  it('rewrites to the default-locale pattern shape, keeping the requested locale segment', () => {
    expect(internalPathname(config, { route: 'newsDetail', locale: 'en', params: { slug: 'hello' } }))
      .toBe('/en/notizie/hello')
  })
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/core/resolve.test.ts`
Expected: FAIL — module not found.

- [x] **Step 3: Implement `src/core/resolve.ts`**

```ts
import { compile, match } from 'path-to-regexp'
import { nextPatternToPathToRegexp } from './pattern'
import type { RoutesConfig } from './types'

type Params = Record<string, string | string[]>

const normalize = (pattern: string) => (pattern === '/' ? '' : pattern)

const patternFor = (config: RoutesConfig, route: string, locale: string): string => {
  const patterns = config.routes[route]
  if (!patterns) throw new Error(`Unknown route "${route}"`)
  const pattern = patterns[locale]
  if (typeof pattern !== 'string') throw new Error(`Route "${route}" has no pattern for locale "${locale}"`)
  return pattern
}

export const getPathname = (
  config: RoutesConfig,
  { route, locale, params = {} }: { route: string; locale: string; params?: Params }
): string => {
  const pattern = patternFor(config, route, locale)
  const toPath = compile(nextPatternToPathToRegexp(normalize(pattern)))
  return `/${locale}${toPath(params)}`
}

export const getAlternates = (
  config: RoutesConfig,
  { route, params = {} }: { route: string; params?: Params }
): Record<string, string> => {
  const base = config.siteUrl?.replace(/\/$/, '') ?? ''
  const entries = config.locales.map(locale => [locale, `${base}${getPathname(config, { route, locale, params })}`])
  const defaultUrl = `${base}${getPathname(config, { route, locale: config.defaultLocale, params })}`
  return { ...Object.fromEntries(entries), 'x-default': defaultUrl }
}

export const matchPathname = (
  config: RoutesConfig,
  pathname: string
): { route: string; locale: string; params: Params } | null => {
  const [, localeSegment, ...rest] = pathname.split('/')
  if (!config.locales.includes(localeSegment)) return null
  const remainder = `/${rest.join('/')}`

  for (const [route, patterns] of Object.entries(config.routes)) {
    const pattern = patterns[localeSegment]
    if (!pattern) continue
    const matcher = match(nextPatternToPathToRegexp(normalize(pattern)))
    const result = matcher(remainder === '/' ? '' : remainder)
    if (result) {
      return { route, locale: localeSegment, params: result.params as Params }
    }
  }
  return null
}

export const internalPathname = (
  config: RoutesConfig,
  { route, locale, params = {} }: { route: string; locale: string; params?: Params }
): string => {
  const pattern = patternFor(config, route, config.defaultLocale)
  const toPath = compile(nextPatternToPathToRegexp(normalize(pattern)))
  return `/${locale}${toPath(params)}`
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/core/resolve.test.ts`
Expected: PASS (10 tests). If `match()` on an empty-string remainder behaves differently than expected for the home route, adjust the `remainder === '/' ? '' : remainder` branch — verify against the actual `path-to-regexp@8` behavior installed (Task 1), don't guess further.

- [x] **Step 5: Commit**

```bash
git add src/core/resolve.ts test/core/resolve.test.ts
git commit -m "feat(core): add pathname/alternates/match/internal resolver functions"
```

- [x] **Step 6: Wire up `src/core/index.ts` public exports**

```ts
export { defineRoutes } from './defineRoutes'
export { getPathname, getAlternates, matchPathname, internalPathname } from './resolve'
export type { RoutesInput, RoutesConfig, RouteParams } from './types'
```

```bash
git add src/core/index.ts
git commit -m "feat(core): export public core API"
```

---

## Task 5: Client — `createNavigation` (`Link` + `useLocale`)

**Files:**
- Create: `src/client/createNavigation.tsx`, `src/client/index.ts`
- Test: `test/client/createNavigation.test.tsx`

**Interfaces:**
- Consumes: `RoutesConfig`, `getPathname` (Task 4).
- Produces: `createNavigation(config): { Link, useLocale }` — this is the App Router navigation entrypoint for consumers; Pages Router equivalent is an explicit follow-up, not built here.

- [x] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { defineRoutes } from '../../src/core/defineRoutes'
import { createNavigation } from '../../src/client/createNavigation'

vi.mock('next/navigation', () => ({ useParams: () => ({ locale: 'en' }) }))
vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>
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
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/client/createNavigation.test.tsx`
Expected: FAIL — module not found.

- [x] **Step 3: Implement `src/client/createNavigation.tsx`**

```tsx
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
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/client/createNavigation.test.tsx`
Expected: PASS (3 tests).

- [x] **Step 5: Write `src/client/index.ts` and commit**

```ts
export { createNavigation } from './createNavigation'
```

```bash
git add src/client/createNavigation.tsx src/client/index.ts test/client/createNavigation.test.tsx
git commit -m "feat(client): add createNavigation with locale-aware Link and useLocale"
```

---

## Task 6: App Router helpers (`createAppHelpers`)

**Files:**
- Create: `src/app/createAppHelpers.ts`, `src/app/index.ts`
- Test: `test/app/createAppHelpers.test.ts`

**Interfaces:**
- Consumes: `RoutesConfig`, `getPathname`, `getAlternates`, `matchPathname`, `internalPathname` (Task 4).
- Produces: `createAppHelpers(config): { alternatesMetadata, buildSitemap, generateLocaleParams, createProxy, createMiddleware }`.

- [x] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { defineRoutes } from '../../src/core/defineRoutes'
import { createAppHelpers } from '../../src/app/createAppHelpers'

const config = defineRoutes({
  defaultLocale: 'it',
  locales: ['it', 'en'],
  siteUrl: 'https://example.com',
  routes: {
    home: { it: '/', en: '/' },
    news: { it: '/notizie', en: '/news' },
    newsDetail: { it: '/notizie/[slug]', en: '/news/[slug]' }
  }
})

describe('alternatesMetadata', () => {
  it('returns canonical, languages and x-default for generateMetadata', () => {
    const { alternatesMetadata } = createAppHelpers(config)
    expect(alternatesMetadata({ route: 'news', locale: 'en' })).toEqual({
      canonical: 'https://example.com/en/news',
      languages: {
        it: 'https://example.com/it/notizie',
        en: 'https://example.com/en/news',
        'x-default': 'https://example.com/it/notizie'
      }
    })
  })
})

describe('buildSitemap', () => {
  it('returns a sitemap entry with per-locale alternates', () => {
    const { buildSitemap } = createAppHelpers(config)
    expect(buildSitemap({ route: 'news', locale: 'it' })).toEqual({
      url: 'https://example.com/it/notizie',
      alternates: {
        languages: {
          it: 'https://example.com/it/notizie',
          en: 'https://example.com/en/news',
          'x-default': 'https://example.com/it/notizie'
        }
      }
    })
  })
})

describe('generateLocaleParams', () => {
  it('returns one params object per locale', () => {
    const { generateLocaleParams } = createAppHelpers(config)
    expect(generateLocaleParams()).toEqual([{ locale: 'it' }, { locale: 'en' }])
  })
})

describe('createProxy / createMiddleware', () => {
  const makeRequest = (pathname: string, acceptLanguage = '') => ({
    nextUrl: { pathname, clone: () => ({ pathname }) },
    headers: new Map([['accept-language', acceptLanguage]])
  })

  it('are the same function under both names', () => {
    const { createProxy, createMiddleware } = createAppHelpers(config)
    expect(createProxy).toBe(createMiddleware)
  })

  it('redirects "/" to the accept-language-detected locale', () => {
    const { createProxy } = createAppHelpers(config)
    const proxy = createProxy()
    const result = proxy(makeRequest('/', 'en'))
    expect(result.redirect).toBe('/en')
  })

  it('falls back to defaultLocale when accept-language matches nothing configured', () => {
    const { createProxy } = createAppHelpers(config)
    const proxy = createProxy()
    const result = proxy(makeRequest('/', 'fr'))
    expect(result.redirect).toBe('/it')
  })

  it('rewrites a pretty localized path to the internal default-locale-shaped path', () => {
    const { createProxy } = createAppHelpers(config)
    const proxy = createProxy()
    const result = proxy(makeRequest('/en/news/hello'))
    expect(result.rewrite).toBe('/en/notizie/hello')
  })

  it('passes through unmatched paths untouched', () => {
    const { createProxy } = createAppHelpers(config)
    const proxy = createProxy()
    const result = proxy(makeRequest('/it/notizie/hello'))
    expect(result).toEqual({})
  })
})
```

**Note:** the real `createProxy`/`createMiddleware` return value must work against actual `NextRequest`/`NextResponse` in production — Step 3 below defines the plain object shape (`{ redirect?, rewrite? }`) as an intermediate, framework-decoupled result so this test file doesn't need `next/server` mocked. Task 8's real Next.js scaffold (integration check) confirms this maps correctly to `NextResponse.redirect`/`NextResponse.rewrite`.

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/app/createAppHelpers.test.ts`
Expected: FAIL — module not found.

- [x] **Step 3: Implement `src/app/createAppHelpers.ts`**

```ts
import { getAlternates, getPathname, internalPathname, matchPathname } from '../core/resolve'
import type { RoutesConfig } from '../core/types'

type Params = Record<string, string | string[]>

interface MinimalRequest {
  nextUrl: { pathname: string }
  headers: { get(name: string): string | null | undefined } | Map<string, string>
}

const headerValue = (headers: MinimalRequest['headers'], name: string): string =>
  (headers instanceof Map ? headers.get(name) : headers.get(name)) ?? ''

const detectLocale = (config: RoutesConfig, acceptLanguage: string): string => {
  const preferred = acceptLanguage.split(',').map(part => part.split(';')[0]!.trim().slice(0, 2))
  return preferred.find(lang => config.locales.includes(lang)) ?? config.defaultLocale
}

export const createAppHelpers = (config: RoutesConfig) => {
  const alternatesMetadata = ({
    route,
    locale = config.defaultLocale,
    params = {}
  }: { route: string; locale?: string; params?: Params }) => ({
    canonical: `${config.siteUrl?.replace(/\/$/, '') ?? ''}${getPathname(config, { route, locale, params })}`,
    languages: getAlternates(config, { route, params })
  })

  const buildSitemap = ({
    route,
    locale = config.defaultLocale,
    params = {}
  }: { route: string; locale?: string; params?: Params }) => ({
    url: `${config.siteUrl?.replace(/\/$/, '') ?? ''}${getPathname(config, { route, locale, params })}`,
    alternates: { languages: getAlternates(config, { route, params }) }
  })

  const generateLocaleParams = () => config.locales.map(locale => ({ locale }))

  const proxy = (request: MinimalRequest): { redirect?: string; rewrite?: string } => {
    const { pathname } = request.nextUrl

    if (pathname === '/') {
      return { redirect: `/${detectLocale(config, headerValue(request.headers, 'accept-language'))}` }
    }

    const matched = matchPathname(config, pathname)
    if (!matched) return {}

    const internal = internalPathname(config, matched)
    return internal === pathname ? {} : { rewrite: internal }
  }

  return {
    alternatesMetadata,
    buildSitemap,
    generateLocaleParams,
    createProxy: proxy,
    createMiddleware: proxy
  }
}
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run test/app/createAppHelpers.test.ts`
Expected: PASS (9 tests).

- [x] **Step 5: Write `src/app/index.ts` and commit**

```ts
export { createAppHelpers } from './createAppHelpers'
```

```bash
git add src/app/createAppHelpers.ts src/app/index.ts test/app/createAppHelpers.test.ts
git commit -m "feat(app): add createAppHelpers for metadata, sitemap and proxy/middleware"
```

---

## Task 7: CLI — `sacajawea init`

**Files:**
- Create: `src/cli/bin.ts`, `src/cli/init.ts`, `src/cli/templates.ts`
- Test: `test/cli/init.test.ts`

**Interfaces:**
- Consumes: nothing from core (pure file scaffolding).
- Produces: `runInit(options: { cwd: string; router: 'app' }): void` used by `bin.ts`; template strings from `templates.ts` reused by Task 8.

- [x] **Step 1: Write the failing tests**

```ts
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
    expect(existsSync(join(cwd, 'proxy.ts'))).toBe(true)
    expect(readFileSync(join(cwd, 'sacajawea.config.ts'), 'utf8')).toContain('defineRoutes')
  })

  it('throws when neither app/ nor pages/ exists', () => {
    expect(() => runInit({ cwd })).toThrow(/app.*pages/i)
  })
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/cli/init.test.ts`
Expected: FAIL — module not found.

- [x] **Step 3: Write `src/cli/templates.ts`**

```ts
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
```

- [x] **Step 4: Implement `src/cli/init.ts`**

```ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { configTemplate, localeLayoutTemplate, proxyTemplate } from './templates'

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
    writeFileSync(join(cwd, 'proxy.ts'), proxyTemplate())
  }
}
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npx vitest run test/cli/init.test.ts`
Expected: PASS (2 tests).

- [x] **Step 6: Write `src/cli/bin.ts` and commit**

```ts
import { Command } from 'commander'
import { runInit } from './init'

const program = new Command()

program
  .name('sacajawea')
  .description('SEO-correct multi-locale routing for Next.js App Router')

program
  .command('init')
  .description('Scaffold sacajawea.config.ts and the App Router locale segment')
  .action(() => runInit({ cwd: process.cwd() }))

program.parse()
```

```bash
git add src/cli/bin.ts src/cli/init.ts src/cli/templates.ts test/cli/init.test.ts
git commit -m "feat(cli): add sacajawea init"
```

---

## Task 8: CLI — `sacajawea add-route`

**Files:**
- Create: `src/cli/addRoute.ts`
- Modify: `src/cli/bin.ts`, `src/cli/templates.ts`
- Test: `test/cli/addRoute.test.ts`

**Interfaces:**
- Consumes: `configTemplate` conventions from Task 7 (reads/rewrites `sacajawea.config.ts` by text insertion, not AST — see Step 3 for the exact, limited-but-honest approach).
- Produces: `runAddRoute(options): Promise<void>`, registered as a CLI subcommand.

- [x] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runAddRoute } from '../../src/cli/addRoute'

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
  it('scaffolds a page per locale and registers the route with the given slugs', async () => {
    await runAddRoute({ cwd, name: 'news', slugs: { it: 'notizie', en: 'news' } })

    expect(existsSync(join(cwd, 'app', '[locale]', 'news', 'page.tsx'))).toBe(true)

    const config = readFileSync(join(cwd, 'sacajawea.config.ts'), 'utf8')
    expect(config).toContain(`news: { it: '/notizie', en: '/news' }`)
  })

  it('throws if the route name already exists in the config', async () => {
    await runAddRoute({ cwd, name: 'news', slugs: { it: 'notizie', en: 'news' } })
    await expect(runAddRoute({ cwd, name: 'news', slugs: { it: 'notizie', en: 'news' } }))
      .rejects.toThrow(/already exists/)
  })
})
```

- [x] **Step 2: Run tests to verify they fail**

Run: `npx vitest run test/cli/addRoute.test.ts`
Expected: FAIL — module not found.

- [x] **Step 3: Add a page template to `src/cli/templates.ts`**

```ts
export const pageTemplate = (routeName: string) => `import { createAppHelpers } from '@neomusic/sacajawea/app'
import config from '../../../sacajawea.config'

const { alternatesMetadata } = createAppHelpers(config)

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return { alternates: alternatesMetadata({ route: '${routeName}', locale }) }
}

export default function Page() {
  return null
}
`
```

- [x] **Step 4: Implement `src/cli/addRoute.ts`**

Route registration is done by text insertion into the `routes: { ... }` block rather than a full TS AST rewrite — deliberately simple, and safe because `init` (Task 7) always generates the config in the exact shape this regex expects. A follow-up (`sacajawea doctor`, already scoped out of this delivery) is the place for a more robust AST-based rewrite if the config is hand-edited into a different shape.

```ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pageTemplate } from './templates'

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
  mkdirSync(pageDir, { recursive: true })
  writeFileSync(join(pageDir, 'page.tsx'), pageTemplate(name))
}
```

- [x] **Step 5: Run tests to verify they pass**

Run: `npx vitest run test/cli/addRoute.test.ts`
Expected: PASS (2 tests).

- [x] **Step 6: Wire the interactive command into `src/cli/bin.ts`**

```ts
import { input } from '@inquirer/prompts'
import { runAddRoute } from './addRoute'
```

Add, after the `init` command block:

```ts
program
  .command('add-route <name>')
  .description('Scaffold a new route with a slug for every configured locale')
  .action(async (name: string) => {
    const configModule = await import(join(process.cwd(), 'sacajawea.config.ts'))
    const { locales } = configModule.default
    const slugs: Record<string, string> = {}
    for (const locale of locales as string[]) {
      slugs[locale] = await input({ message: `Slug for "${name}" in "${locale}"`, default: name })
    }
    await runAddRoute({ cwd: process.cwd(), name, slugs })
  })
```

Add the `join` import from `node:path` at the top of `bin.ts` alongside the existing imports.

- [x] **Step 7: Commit**

```bash
git add src/cli/addRoute.ts src/cli/bin.ts src/cli/templates.ts test/cli/addRoute.test.ts
git commit -m "feat(cli): add sacajawea add-route"
```

---

## Task 9: Full local verification (lint, typecheck, build, coverage)

**Files:** none created — this task only runs commands.

- [x] **Step 1: Lint**

Run: `npm run lint`
Expected: no errors. Fix any that surface before continuing (do not disable rules to silence them).

- [x] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: no errors, including that `RouteParams<typeof config, 'newsDetail'>` in a scratch check resolves to `{ slug: string }` — if it doesn't, the template-literal type in `src/core/types.ts` needs fixing, not the call site.

- [x] **Step 3: Full test run with coverage**

Run: `npm test`
Expected: all suites from Tasks 2–8 pass.

- [x] **Step 4: Build**

Run: `npm run build`
Expected: `dist/core`, `dist/client`, `dist/app`, `dist/cli` each contain `.js`, `.cjs`, and (except `cli`) `.d.ts` files.

- [x] **Step 5: Commit only if any of the above required fixes**

```bash
git add -u
git commit -m "fix: address issues found in full lint/typecheck/build verification"
```

(Skip this step if nothing needed changing.)

---

## Task 10: Real Next.js 16 App Router integration check

**Files:** none in this repo — scaffolds a throwaway project outside it.

**Interfaces:** consumes the built package from Task 9 via `npm pack`.

- [x] **Step 1: Pack the built library**

```bash
npm pack --pack-destination /tmp
```

Expected: produces `neomusic-sacajawea-3.0.0.tgz`.

- [x] **Step 2: Scaffold a throwaway Next 16 app**

```bash
npx --yes create-next-app@latest /tmp/sacajawea-v3-check --typescript --app --no-tailwind --no-eslint --src-dir=false --import-alias "@/*" --use-npm
```

- [x] **Step 3: Install the packed library into the throwaway app**

```bash
cd /tmp/sacajawea-v3-check
npm install /tmp/neomusic-sacajawea-3.0.0.tgz
```

- [x] **Step 4: Run `sacajawea init` and `sacajawea add-route news`**

```bash
npx sacajawea init
npx sacajawea add-route news
```

Answer the interactive slug prompts with `notizie` for `it` / `news` for `en` if the throwaway app's config was initialized with those locales; otherwise use whatever `init` produced (check `sacajawea.config.ts` first).

- [x] **Step 5: Wire the proxy filename for Next 16**

Rename the generated `proxy.ts` to whatever Next 16 in `node_modules/next/package.json` actually expects (check `next --version` output and the Next 16 middleware/proxy docs shipped in `node_modules/next/dist` for the exact filename Next 16 resolves — do not assume; if both `middleware.ts` and `proxy.ts` are accepted, prefer the one Next's own scaffolding docs recommend for that version).

- [x] **Step 6: Build and start the throwaway app**

```bash
npm run build
npm run start &
sleep 2
curl -s http://localhost:3000/ -D - -o /dev/null   # expect a 307/308 redirect to /it or /en
curl -s http://localhost:3000/en/news/hello         # expect HTML containing hreflang alternate links and canonical
```

- [x] **Step 7: Confirm in the curl output**

Check the response body for:
- `<link rel="canonical" href=".../en/news/hello">`
- `<link rel="alternate" hrefLang="it" href=".../it/notizie/hello">`
- `<link rel="alternate" hrefLang="x-default" .../it/notizie/hello">`

If any are missing, the bug is almost certainly in how `alternatesMetadata`'s return shape maps to Next's `generateMetadata().alternates` field names (`canonical`, `languages`) — re-check against the installed `next` version's actual `Metadata` type in `node_modules/next/dist/lib/metadata/types/alternative-urls-types.d.ts` rather than guessing.

- [x] **Step 8: Stop the server and record the outcome**

```bash
kill %1
```

Record pass/fail and any fixes needed back in the main repo (apply fixes there, re-run Task 9, then re-run this task once).

- [x] **Step 9: No commit here** — this task validates against a throwaway project outside the repo. Any fix it uncovers gets its own commit in the main repo, made in Task 9's or a new small `fix:` commit.

---

## Task 11: Documentation and CI

**Files:**
- Modify: `README.md`
- Create: `docs/MIGRATION-v2-v3.md`, `.github/workflows/ci.yml`
- Delete: `.travis.yml` (already removed in Task 1 — verify)

- [x] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [master, v3]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [x] **Step 2: Rewrite `README.md`**

Cover: what v3 is (SEO-correct multi-locale routing on top of App Router's native i18n, not a replacement for it), install (`npm i @neomusic/sacajawea`), quickstart (`sacajawea init`, `defineRoutes` example, `<Link>`/`useLocale`/`alternatesMetadata`/`buildSitemap` usage), a note that Pages Router support and `sacajawea doctor` are planned follow-ups, and a link to `docs/MIGRATION-v2-v3.md`.

- [x] **Step 3: Write `docs/MIGRATION-v2-v3.md`**

Cover, concretely: package rename (`npm uninstall @palmabit/sacajawea && npm install @neomusic/sacajawea`), the conceptual shift from custom-server routing (`Routes`, `.add()`, `getRequestHandler`) to native App Router `[locale]` + `defineRoutes` config, the `Link` API change (`route`/`locale`/`params` props stay conceptually the same, but it's now a function component consumed via `createNavigation(config).Link`, not a default export), removal of `Router.pushRoute`/`replaceRoute` (use `useRouter()` from `next/navigation` directly, or `getPathname` + `router.push`), and that Pages Router users should stay on v2 (`^2.1.6`) until the Pages Router adapter ships.

- [x] **Step 4: Commit**

```bash
git add README.md docs/MIGRATION-v2-v3.md .github/workflows/ci.yml
git commit -m "docs: rewrite README and add v2 to v3 migration guide"
```

---

## Self-Review

**Spec coverage:**
- Route registry / typed config → Task 3.
- Resolver (`getPathname`/`getAlternates`/`matchPathname`) → Task 4.
- `path-to-regexp@8` bracket-pattern matching → Task 2 (called out as its own task since the original spec understated it).
- `useLocale` → Task 5, scoped to App Router only (Pages Router explicitly deferred, per the plan's own follow-up list and the analysis above).
- `<Link>` functional wrap → Task 5.
- SEO helpers (`alternatesMetadata`, `buildSitemap`, `generateLocaleParams`, proxy/middleware) → Task 6.
- CLI `init` / `add-route` → Tasks 7–8.
- Build/lint/test toolchain rewrite → Task 1, verified in Task 9.
- Real Next 16 App Router verification → Task 10.
- Docs, migration guide, CI → Task 11.
- Explicitly out of scope (unchanged from spec): Pages Router adapter, `<LocaleSwitcher>`, `sacajawea doctor`, JSON-LD helpers, codemod.

**Type consistency:** `RoutesConfig`/`RouteParams` (Task 3) are the same types consumed in Tasks 4–6; `getPathname`/`getAlternates`/`matchPathname`/`internalPathname` signatures are defined once in Task 4 and used identically in Tasks 5, 6, 10.

**Placeholder scan:** no TBD/"add later"/hand-wavy steps remain; every code step above is complete, runnable code.

## Execution Outcomes

All 11 tasks executed on branch `v3`. Real Next 16 App Router verification (Task 10) found and fixed
three bugs the earlier unit-level tasks couldn't have caught:

1. `sacajawea init` never scaffolded `app/[locale]/page.tsx` for the `home` route — the proxy would
   redirect `/` to `/en`, but `/en` had nothing to render.
2. `sacajawea add-route` scaffolded pages at a folder named after the abstract route key (e.g. `news`),
   but `internalPathname` (the proxy's rewrite target) resolves against the **default locale's** pattern
   (e.g. `notizie`). Fixed by deriving the folder from the default-locale slug instead of the route name.
3. The generated `proxy.ts` imported a bare `createProxy` from `sacajawea/app` and called it directly —
   that's not how the API works (`createAppHelpers(config).createProxy` returns a plain
   `{ redirect?, rewrite? }` descriptor, not a `NextResponse`). Also exported `proxyConfig` instead of
   `config`, which Next doesn't read. Fixed with a real `NextResponse` adapter and the correct export
   name, confirmed against `next/dist/build/analysis/get-page-static-info.js`.

Confirmed against a real scaffolded Next 16 project: `next build` succeeds, `proxy.ts` is recognized
("ƒ Proxy (Middleware)"), `/` redirects to the Accept-Language-detected locale, `/en/news/hello` gets
rewritten to `/en/notizie/hello`, and the rendered HTML contains correct `canonical`/`hreflang`/
`x-default` tags matching the resolver's URLs exactly.
