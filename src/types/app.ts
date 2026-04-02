export interface MinimalRequest {
  nextUrl: { pathname: string }
  headers: { get(name: string): string | null | undefined } | Map<string, string>
}

export interface ProxyResult {
  redirect?: string
  rewrite?: string
}
