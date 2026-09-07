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
    // Pinned to the timezone this app is actually used in. CI runs in UTC, where a whole class
    // of local-vs-UTC date bug is invisible — `new Date(2026, 3, 1).toISOString()` only loses a
    // day at a positive offset, so the Financial Years off-by-one would have passed in CI while
    // being wrong for every real user. A fixed offset also keeps the date assertions
    // deterministic between a developer's machine and CI.
    env: { TZ: 'Asia/Kolkata' },
  },
})
