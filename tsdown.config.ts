import { defineConfig } from 'tsdown'

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
    deps: { neverBundle: ['react', 'react-dom', 'next'] }
  },
  {
    entry: { 'cli/bin': 'src/cli/bin.ts' },
    format: ['esm'],
    dts: false,
    clean: false,
    banner: { js: '#!/usr/bin/env node' }
  }
])
