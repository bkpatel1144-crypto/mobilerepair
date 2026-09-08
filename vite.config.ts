import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        /**
         * Without these groups the bundler attaches vendor code to whichever app module happens
         * to pull it in first, which produced a 641 KB chunk named `firestore-paths` (the whole
         * Firebase SDK behind a one-screen path helper) and recharts inside `dashboard-page`.
         *
         * The practical cost isn't the total size — it's cache churn. A chunk keyed to an app
         * file gets a new hash on any edit to that file, so every deploy re-downloaded the
         * Firebase SDK. Grouping by dependency means these hashes move only when the dependency
         * itself changes, which is what makes the year-long immutable caching in vercel.json
         * actually pay off for returning users.
         *
         * `priority` decides ties, and React must win every one of them. It is claimed first, by a
         * pattern covering every `react*` package rather than a hand-listed few, because the
         * narrow version shipped a blank page to production.
         *
         * `/(react|react-dom|react-router|scheduler)[\\/]/` looks exhaustive and is not: the
         * separator means it matches `react/` and `react-dom/` but never `react-is/`,
         * `react-redux/` or `use-sync-external-store/`. Those three are recharts' own
         * dependencies, so React's graph was split — part in `vendor-react`, part pulled into
         * `vendor-charts`, with the CommonJS ones duplicated into both. Cross-chunk CJS interop
         * depends on initialization order, and chunk ordering here is not deterministic: the same
         * commit built twice produces different chunk hashes and different contents. Roughly one
         * build in a few ordered the chunks so that `vendor-charts` held a React binding that was
         * still null when it was read, and the app rendered nothing at all — `Cannot read
         * properties of null (reading 'useContext')`, no route, no error boundary, a white screen.
         *
         * Which build you got was luck, so this was not reproducible by rebuilding and did not
         * correlate with any source change. `npm run verify:build` exists to catch it: it builds
         * repeatedly and loads each result in a real browser, because `tsc`, `eslint` and the unit
         * tests all pass on a bundle that renders a blank page.
         *
         * Keeping React whole costs some cache granularity — an edit to any React-adjacent
         * dependency now invalidates one larger chunk — which is a straightforward trade against
         * a white screen.
         */
        advancedChunks: {
          groups: [
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react[\w.-]*|scheduler|use-sync-external-store)[\\/]/,
              priority: 40,
            },
            { name: 'vendor-firebase', test: /node_modules[\\/]@?firebase/, priority: 30 },
            {
              name: 'vendor-charts',
              test: /node_modules[\\/](recharts|d3-|victory)/,
              priority: 20,
            },
            { name: 'vendor', test: /node_modules/, priority: 10 },
          ],
        },
      },
    },
  },
})
