import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    // These suites cover pure money/date arithmetic, so there is no DOM to set up. Component
    // tests, if they are added later, should declare their own `environment: 'jsdom'` per-file
    // rather than slowing every run down with a DOM nobody uses.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
