import { useEffect, useRef, useState } from "react"

export type AgentEvent = {
  event?: "hello" | "state" | "tool_start" | "tool_end"
  state?: string
  tool?: string
  arguments?: Record<string, unknown>
  ok?: boolean
  result?: string
  message?: string
}

export type LinkStatus = "connecting" | "online" | "offline"

/** Keeps a WebSocket to the backend open (auto-reconnect) and forwards each event. */
export function useAgentSocket(onEvent: (event: AgentEvent) => void): LinkStatus {
  const [status, setStatus] = useState<LinkStatus>("connecting")
  const handler = useRef(onEvent)

  useEffect(() => {
    handler.current = onEvent
  })

  useEffect(() => {
    let socket: WebSocket | undefined
    let timer: number | undefined
    let closed = false
    let attempt = 0

    const open = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws"
      const url: string = import.meta.env.VITE_WS_URL ?? `${proto}://${location.host}/ws`
      socket = new WebSocket(url)
      socket.onopen = () => {
        attempt = 0
        setStatus("online")
      }
      socket.onmessage = (message) => {
        try {
          handler.current(JSON.parse(message.data))
        } catch {
          /* ignore malformed frames */
        }
      }
      socket.onclose = () => {
        if (closed) return
        setStatus("offline")
        timer = window.setTimeout(open, Math.min(1000 * 2 ** attempt++, 10000))
      }
    }

    open()
    return () => {
      closed = true
      window.clearTimeout(timer)
      socket?.close()
    }
  }, [])

  return status
}
