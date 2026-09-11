import { describe, expect, it } from 'vitest'

/**
 * Every `FormModal` submit handler must stop the browser's native submit.
 *
 * `FormModal` renders a real `<form onSubmit={…}>`. A handler that takes no event, or takes one
 * and never calls `preventDefault()`, lets the browser submit that form: the page navigates,
 * React unmounts mid-flight, and the mutation is killed before it reaches Firestore. Nothing
 * throws, and the dialog appears to close — that is the page reloading — so it looks exactly
 * like a save that worked.
 *
 * Company Settings shipped like this and saved nothing at all. Not the phone number, not the GST
 * registration, nothing. It was found only by changing a field, reloading, and looking. Six more
 * handlers across four files had the same hole, two of which this test found after the first
 * four were fixed by hand. It exists so the next one is caught in CI rather than by a shopkeeper
 * whose company details keep reverting.
 */

const sources = import.meta.glob('../../pages/**/*.tsx', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('FormModal submit handlers cancel the native submit', () => {
  it('holds for every page that renders a FormModal', () => {
    const files = Object.entries(sources)
    expect(files.length, 'found no pages to check').toBeGreaterThan(30)

    const offenders: string[] = []
    let checked = 0

    for (const [path, source] of files) {
      if (!source.includes('FormModal')) continue

      for (const match of source.matchAll(/onSubmit=\{(\w+)\}/g)) {
        const name = match[1]
        // react-hook-form's own `handleSubmit(fn)` wrapper calls preventDefault itself.
        if (source.includes(`onSubmit={${name}(`)) continue
        const declaration = new RegExp(`function ${name}\\s*\\(([^)]*)\\)`).exec(source)
        if (!declaration) continue
        checked += 1

        const takesEvent = declaration[1].trim().length > 0
        // Only this handler's own body counts — another handler in the same file calling
        // preventDefault must not vouch for it.
        const start = source.indexOf(declaration[0])
        const body = source.slice(start, start + 600)
        if (!takesEvent || !body.includes('preventDefault')) {
          offenders.push(`${path.split('/').slice(-2).join('/')}: ${name}()`)
        }
      }
    }

    // A run that inspected nothing must not read as a pass.
    expect(checked, 'no FormModal submit handlers were inspected').toBeGreaterThan(10)
    expect(offenders).toEqual([])
  })
})
