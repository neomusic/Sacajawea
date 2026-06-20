export const nextPatternToPathToRegexp = (pattern: string): string =>
  pattern
    .replace(/\/\[\[\.\.\.(\w+)\]\]/g, '{/:$1*}')
    .replace(/\[\.\.\.(\w+)\]/g, ':$1+')
    .replace(/\[(\w+)\]/g, ':$1')
