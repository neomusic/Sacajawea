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
