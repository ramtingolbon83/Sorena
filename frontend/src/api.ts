// Thin client for the SORENA backend service (see agent/server.py).
// In dev, Vite proxies /api and /ws to the backend (vite.config.ts).
// For another host set VITE_API_URL / VITE_WS_URL in frontend/.env.local.

export type ToolInfo = {
  name: string
  description: string
  parameters: unknown
  /** false = schema exists but the backend has no implementation for it */
  registered: boolean
}

export type ToolCall = {
  tool: string
  arguments: Record<string, unknown>
  ok: boolean
  result: string
}

export type ChatResponse = {
  session_id: string
  reply: string
  tool_calls: ToolCall[]
  /** the reply as a base64 WAV, only when speak was requested and synthesis worked */
  audio: string | null
}

const BASE: string = import.meta.env.VITE_API_URL ?? ""

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, init)
  if (!response.ok) {
    let detail = response.statusText
    try {
      detail = (await response.json()).detail ?? detail
    } catch {
      /* body was not JSON */
    }
    throw new Error(`${response.status} ${detail}`)
  }
  return response.json() as Promise<T>
}

export const fetchTools = () => request<ToolInfo[]>("/api/tools")

/**
 * voice = the message came from the microphone (the server skips its own "listening" step).
 * speak = also return the reply as spoken audio.
 */
export const sendChat = (message: string, sessionId?: string, voice = false, speak = false) =>
  request<ChatResponse>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId, voice, speak }),
  })

/** Tells the server recording has started (pink eye, cancels pending state changes). */
export const startListening = () => request<{ ok: boolean }>("/api/listening", { method: "POST" })

/** Sends the recorded audio as the raw request body; the server transcribes it with Whisper. */
export const transcribe = async (audio: Blob) => {
  const { text } = await request<{ text: string }>("/api/stt", {
    method: "POST",
    headers: { "Content-Type": audio.type || "audio/webm" },
    body: audio,
  })
  return text
}
