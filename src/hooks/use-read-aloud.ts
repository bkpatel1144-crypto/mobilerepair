import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SPEECH_LOCALE } from '@/lib/accessibility'

/**
 * Reads the page's main content aloud, using the browser's own speech synthesis.
 *
 * No service and no API key on purpose. A cloud text-to-speech call would mean sending the page —
 * which inside the app includes customer names and amounts — to a third party, plus a key to
 * manage and a bill that scales with use. `speechSynthesis` is already in the browser, works
 * offline, and costs nothing.
 *
 * The trade-off is voice availability: whether a Gujarati or Hindi voice exists depends entirely
 * on the device, so `isSupported` reports what this browser can actually do rather than promising
 * something and going silent. The toolbar hides the control when nothing can speak.
 */
export function useReadAloud() {
  const { i18n } = useTranslation()
  const [speaking, setSpeaking] = useState(false)

  // A lazy initialiser rather than an effect. Support is a fixed fact about the browser, so it
  // never changes and has nothing to subscribe to; setting it from an effect meant the control
  // was hidden on the first render and appeared on the second, and cost a cascading render to
  // learn something already knowable synchronously.
  const [isSupported] = useState(() => typeof window !== 'undefined' && 'speechSynthesis' in window)

  // Speech does not stop on navigation by itself — it belongs to the browser, not the page — so
  // leaving without this keeps a voice reading the page you have already left.
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const start = useCallback(() => {
    const main = document.getElementById('main') ?? document.body
    // `innerText`, not `textContent`: it respects layout, so it skips visually hidden text and
    // inserts breaks at block boundaries instead of running headings into the paragraph below.
    const text = main.innerText.replace(/\s+/g, ' ').trim()
    if (!text) return

    window.speechSynthesis.cancel()

    const language = i18n.resolvedLanguage ?? 'en'
    const locale = SPEECH_LOCALE[language] ?? 'en-IN'

    // Chunked at sentence boundaries. A single very long utterance is cut off partway through by
    // several browsers, and a whole marketing page is far past that limit.
    const chunks = text.match(/[^.!?।]+[.!?।]*/g) ?? [text]
    const voice =
      window.speechSynthesis.getVoices().find((v) => v.lang === locale) ??
      window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(language))

    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk.trim())
      utterance.lang = locale
      if (voice) utterance.voice = voice
      utterance.rate = 0.95
      if (index === chunks.length - 1) utterance.onend = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    })

    setSpeaking(true)
  }, [i18n.resolvedLanguage])

  const toggle = useCallback(() => (speaking ? stop() : start()), [speaking, start, stop])

  return { speaking, isSupported, toggle, stop }
}
