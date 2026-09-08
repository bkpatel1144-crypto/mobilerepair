import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    // Most suites cover pure money/date arithmetic and need no DOM, so `node` stays the default
    // and the render tests opt in with a `@vitest-environment jsdom` docblock — a DOM for every
    // file would slow the whole run down for the majority that never touch one.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // Pinned to the timezone this app is actually used in. CI runs in UTC, where a whole class
    // of local-vs-UTC date bug is invisible — `new Date(2026, 3, 1).toISOString()` only loses a
    // day at a positive offset, so the Financial Years off-by-one would have passed in CI while
    // being wrong for every real user. A fixed offset also keeps the date assertions
    // deterministic between a developer's machine and CI.
    env: { TZ: 'Asia/Kolkata' },
  },
})
