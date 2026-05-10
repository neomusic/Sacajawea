# Migrating from v2 to v3

v3 is not a drop-in upgrade. It's a different package built on a different architecture — read this
before touching your `package.json`.

## Package rename

```
npm uninstall @palmabit/sacajawea
npm install @neomusic/sacajawea
```

## Pages Router: stay on v2

If your project uses Pages Router, keep `@palmabit/sacajawea@^2.1.6`. Pages Router already has native
i18n routing; v3's value is specifically for App Router, which doesn't. A Pages Router adapter for v3
is planned but not built yet.

## The conceptual shift

v2 replaced Next's routing with a custom server (`Routes`, `.add()`, `getRequestHandler(app)`) built on
`next-routes`. v3 does not replace App Router's routing — it layers pretty, per-locale URLs and SEO
metadata on top of the native `[locale]` segment + `proxy.ts`/`middleware.ts` pattern.

| v2 | v3 |
| --- | --- |
| `new Routes({ locale, forceLocale, siteUrl }).add(...)` | `defineRoutes({ defaultLocale, locales, siteUrl, routes })` in `sacajawea.config.ts` |
| `routes.getRequestHandler(app)` in a custom server | `proxy.ts` / `middleware.ts` calling `createAppHelpers(config).createProxy` |
| `<Link route="news" locale="en" params={...} />` (class component) | `const { Link } = createNavigation(config)`, same props, function component |
| `Router.pushRoute(name, params, locale)` / `.replaceRoute(...)` | `useRouter()` from `next/navigation` with `getPathname(config, { route, locale, params })` from `@neomusic/sacajawea` |
| `WithSeo` HOC + `<SeoComponent />` reading `req.nextRoute` | `generateMetadata()` returning `alternatesMetadata({ route, locale, params })` |
| `req.getMultilanguageUrls()` | `getAlternates(config, { route, params })` |

## Routes

v2 routes were added imperatively at runtime (`routes.add('news', 'it', '/notizie', 'News')`, one call
per locale, each un-typed). v3 routes are one declarative object with every locale's pattern:

```ts
// v2
routes.add('news', 'it', '/notizie', 'News')
routes.add('news', 'en', '/news', 'News')

// v3
routes: {
  news: { it: '/notizie', en: '/news' }
}
```

Run `npx sacajawea add-route <name>` to scaffold a new route interactively instead of hand-editing
`sacajawea.config.ts`.

## What's gone

- `Router.pushRoute` / `Router.replaceRoute`: use `next/navigation`'s `useRouter()` directly, resolving
  the href with `getPathname` first.
- `forceLocale`: the v3 proxy always prefixes every locale, including the default — there's no
  optional-prefix mode.
- Custom server / `getRequestHandler(app)`: gone entirely. Middleware/proxy replaces it.

## Not yet available in v3

Pages Router adapter, `<LocaleSwitcher>`, `sacajawea doctor`, JSON-LD helpers, and an automated
config codemod are planned but not part of this release.
