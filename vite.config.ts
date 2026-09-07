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
         * `priority` decides ties: firebase and recharts must be claimed before the catch-all
         * vendor group, or they'd be swallowed by it.
         */
        advancedChunks: {
          groups: [
            { name: 'vendor-firebase', test: /node_modules[\\/]@?firebase/, priority: 30 },
            { name: 'vendor-charts', test: /node_modules[\\/](recharts|d3-|victory)/, priority: 30 },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              priority: 20,
            },
            { name: 'vendor', test: /node_modules/, priority: 10 },
          ],
        },
      },
    },
  },
})
