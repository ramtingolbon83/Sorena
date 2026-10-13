import { useEffect, useRef, useState } from "react"

/** Microphone recording with MediaRecorder: start() asks for permission, stop() resolves with the audio Blob. */
export function useRecorder() {
  const [recording, setRecording] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])

  const release = () => {
    recorder.current?.stream.getTracks().forEach((track) => track.stop())
    recorder.current = null
    setRecording(false)
  }

  // never leave the microphone open if the component goes away
  useEffect(() => release, [])

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const next = new MediaRecorder(stream)
    chunks.current = []
    next.ondataavailable = (event) => {
      if (event.data.size) chunks.current.push(event.data)
    }
    next.start()
    recorder.current = next
    setRecording(true)
  }

  const stop = () =>
    new Promise<Blob>((resolve, reject) => {
      const active = recorder.current
      if (!active) {
        reject(new Error("Not recording"))
        return
      }
      active.onstop = () => {
        const blob = new Blob(chunks.current, { type: active.mimeType })
        release()
        resolve(blob)
      }
      active.stop()
    })

  return { recording, start, stop }
}
