/**
 * Builds the app repeatedly and loads each result in a real browser.
 *
 * Exists because a production build shipped a completely blank page and every other check passed.
 * `tsc`, `eslint`, Prettier and 311 unit tests all run against the *source*; none of them loads a
 * bundle. The failure was in chunk splitting — React's graph was divided across chunks, and a
 * cross-chunk CommonJS binding was read while still null, so the app threw
 * `Cannot read properties of null (reading 'useContext')` before rendering anything. No route, no
 * error boundary, a white screen.
 *
 * Why it builds more than once: chunk ordering is not deterministic. The same commit built twice
 * produces different chunk hashes and different chunk contents, and only some of those orderings
 * broke. A single build proved nothing — the first rebuild after the outage came out working, from
 * byte-identical source. So the loop is the point, and `--runs` is the confidence dial.
 *
 *   node tools/verify-build.mjs [--runs 3] [--port 5210]
 *
 * Each run does a clean build, serves `dist`, and checks that the signup form actually renders
 * with no page errors. It also asserts React lands in exactly one chunk, which is the specific
 * condition whose absence caused the outage — a build can render once by luck while still being
 * split, and that build would be a live grenade.
 */
import { spawn } from 'node:child_process'
import { rm, readdir, readFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const runs = Number(args[args.indexOf('--runs') + 1]) || 3
const basePort = Number(args[args.indexOf('--port') + 1]) || 5210

/** A distinctive string from React's own source, used to count how many chunks carry a copy. */
const REACT_MARKER = 'react.transitional.element'

function run(command, extraArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, extraArgs, { shell: true, stdio: 'ignore' })
    child.on('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))
    )
    child.on('error', reject)
  })
}

/** Starts `vite preview` and resolves once it is actually answering, not merely spawned. */
async function serve(port) {
  const child = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    shell: true,
    stdio: 'ignore',
  })
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://localhost:${port}/`)
      if (res.ok) return child
    } catch {
      // Not up yet.
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  child.kill()
  throw new Error(`vite preview never answered on ${port}`)
}

/** How many emitted chunks contain a copy of React. More than one is the outage condition. */
async function chunksContainingReact() {
  const assets = await readdir('dist/assets')
  const carrying = []
  for (const file of assets.filter((f) => f.endsWith('.js'))) {
    const source = await readFile(`dist/assets/${file}`, 'utf8')
    if (source.includes(REACT_MARKER)) carrying.push(file)
  }
  return carrying
}

const browser = await chromium.launch()
const failures = []

for (let i = 1; i <= runs; i++) {
  const port = basePort + i
  process.stdout.write(`run ${i}/${runs}  building… `)
  await rm('dist', { recursive: true, force: true })
  await run('npm', ['run', 'build'])

  const reactChunks = await chunksContainingReact()
  const server = await serve(port)
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))

  try {
    await page.goto(`http://localhost:${port}/signup`, { waitUntil: 'domcontentloaded' })
    // The signup form is a fair canary: reaching it means React mounted, the router resolved a
    // route, and the lazy chunk for that page loaded.
    await page.waitForSelector('#companyName', { timeout: 15_000 })
    const rendered = await page.evaluate(() => !!document.querySelector('#companyName'))
    const split = reactChunks.length > 1

    if (!rendered || errors.length || split) {
      failures.push({ run: i, rendered, errors, reactChunks })
      console.log('BROKEN')
    } else {
      console.log(`OK  (React in ${reactChunks[0] ?? 'no chunk?'})`)
    }
  } catch (err) {
    failures.push({ run: i, rendered: false, errors: [...errors, err.message], reactChunks })
    console.log('BROKEN')
  } finally {
    await page.close()
    server.kill()
  }
}

await browser.close()

if (failures.length) {
  console.log(`\n${failures.length} of ${runs} builds are broken:`)
  for (const f of failures) {
    console.log(`\n  run ${f.run}: form rendered=${f.rendered}`)
    if (f.reactChunks.length > 1) {
      console.log(
        `    React is split across ${f.reactChunks.length} chunks: ${f.reactChunks.join(', ')}`
      )
    }
    for (const err of f.errors.slice(0, 3)) console.log(`    ${err.slice(0, 200)}`)
  }
  process.exit(1)
}

console.log(`\nAll ${runs} builds render and keep React in a single chunk.`)
