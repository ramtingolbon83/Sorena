// Thin client for the YALDA backend service (see service/server.py).
// In dev, Vite proxies /api and /ws to http://127.0.0.1:8000 (vite.config.ts).
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

export const sendChat = (message: string, sessionId?: string) =>
  request<ChatResponse>("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  })
