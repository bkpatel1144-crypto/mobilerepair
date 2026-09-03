import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { AlertCircle } from 'lucide-react'

interface CameraScanFrameProps {
  /** Called on every successfully decoded QR/barcode payload. The same payload won't be
   * reported again for 3s — long enough to avoid spamming a parent-side lookup while the same
   * code is still sitting in frame, short enough that pointing at a different label (or the
   * same one again, deliberately) always gets picked back up. The camera itself is never
   * stopped by a decode; only unmounting this component stops it. */
  onDecode: (text: string) => void
}

/** The actual camera+decode plumbing shared by every real scanner in the app (Scan Job Card,
 * Scan IMEI/Serial) — a live `<video>` feed decoded via `jsqr` against a hidden canvas snapshot
 * on every animation frame, with the reference app's own "Camera unavailable / Could not start
 * camera" error copy. Callers own what happens with a decoded payload (navigate, fill a field);
 * this component only owns getting pixels off the camera and turning them into text. */
export function CameraScanFrame({ onDecode }: CameraScanFrameProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Kept in a ref, not the effect's own dep array, so a caller passing an inline arrow function
  // (a fresh identity every render) never restarts the camera — only mount/unmount should.
  // Written in an effect, not during render — React (and its compiler's purity check) only
  // allows mutating a ref's `.current` outside of render, e.g. here or in an event handler.
  const onDecodeRef = useRef(onDecode)
  useEffect(() => {
    onDecodeRef.current = onDecode
  }, [onDecode])

  useEffect(() => {
    let cancelled = false
    let rafId: number | null = null
    let stream: MediaStream | null = null
    let lastReported: { text: string; at: number } | null = null

    function stop() {
      if (rafId != null) cancelAnimationFrame(rafId)
      stream?.getTracks().forEach((t) => t.stop())
    }

    function tick() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        rafId = requestAnimationFrame(tick)
        return
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        rafId = requestAnimationFrame(tick)
        return
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const decoded = jsQR(imageData.data, imageData.width, imageData.height)
      if (decoded?.data) {
        const now = Date.now()
        if (!lastReported || lastReported.text !== decoded.data || now - lastReported.at > 3000) {
          lastReported = { text: decoded.data, at: now }
          onDecodeRef.current(decoded.data)
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        tick()
      } catch {
        if (!cancelled) setCameraError('Could not start camera')
      }
    }

    void start()
    return () => {
      cancelled = true
      stop()
    }
  }, [])

  return (
    <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
      <video ref={videoRef} className="size-full object-cover" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black px-4 text-center text-white">
          <AlertCircle className="size-8 text-red-500" />
          <p className="font-medium">Camera unavailable</p>
          <p className="text-sm text-white/70">{cameraError}</p>
        </div>
      )}
    </div>
  )
}
