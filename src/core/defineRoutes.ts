import type { RoutesInput, RoutesConfig } from '@/types/core'

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
