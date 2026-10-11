import { useCallback, useEffect, useRef, useState } from "react"
import type { AgentState, Message, ToolActivity } from "../types"

const wait = (duration: number) =>
  new Promise((resolve) => window.setTimeout(resolve, duration))

function responseFor(input: string) {
  if (/calculat|multiply|plus|sum|\d+\s*[+\-*/]\s*\d+/i.test(input)) {
    return "I ran a simulated calculator step in demo mode. The tool workflow is ready to be replaced by real events from your Python agent loop."
  }
  if (/status|connection|model/i.test(input)) {
    return "The interface is currently in **Demo mode**. No network request was made. Connect your local OpenAI-compatible endpoint in Settings when the backend adapter is available."
  }
  return "I’m responding through Yalda’s frontend demo layer. This interaction demonstrates state transitions, streaming output, cancellation, and tool activity without pretending a local model is connected."
}

export default function useYaldaAgent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [state, setState] = useState<AgentState>("idle")
  const [tool, setTool] = useState<ToolActivity | null>(null)
  const [error, setError] = useState<string | null>(null)
  const runId = useRef(0)
  const timers = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => () => clearTimers(), [clearTimers])

  const stop = useCallback(() => {
    runId.current += 1
    clearTimers()
    setState("idle")
    setTool(null)
    setMessages((current) =>
      current.map((message) =>
        message.status === "streaming"
          ? {
              ...message,
              status: "complete",
              content: `${message.content}\n\n_Generation stopped._`,
            }
          : message,
      ),
    )
  }, [clearTimers])

  const submit = useCallback(async (content: string) => {
    const id = ++runId.current
    setError(null)
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: "Just now",
        status: "complete",
      },
    ])
    setState("thinking")

    await wait(720)
    if (id !== runId.current) return

    const usesTool = /calculat|multiply|plus|sum|\d+\s*[+\-*/]\s*\d+/i.test(
      content,
    )
    if (usesTool) {
      setState("using-tool")
      setTool({
        name: "Calculator demo",
        description: "Simulating a tool event",
        status: "running",
      })
      await wait(1050)
      if (id !== runId.current) return
      setTool({
        name: "Calculator demo",
        description: "Simulated event complete",
        status: "succeeded",
        result: "Demo result received",
      })
      setState("success")
      await wait(620)
      if (id !== runId.current) return
    }

    if (/\b(error|fail)\b/i.test(content)) {
      setTool(null)
      setState("error")
      setError(
        "The demo request was intentionally interrupted. Your message is preserved and can be retried.",
      )
      return
    }

    const response = responseFor(content)
    const messageId = crypto.randomUUID()
    setTool(null)
    setState("speaking")
    setMessages((current) => [
      ...current,
      {
        id: messageId,
        role: "assistant",
        content: "",
        timestamp: "Just now",
        status: "streaming",
      },
    ])

    const words = response.split(" ")
    for (let index = 0; index < words.length; index += 1) {
      await wait(42)
      if (id !== runId.current) return
      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content: `${message.content}${index ? " " : ""}${words[index]}`,
              }
            : message,
        ),
      )
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId ? { ...message, status: "complete" } : message,
      ),
    )
    setState("idle")
  }, [])

  const reset = useCallback(() => {
    stop()
    setMessages([])
    setError(null)
  }, [stop])

  const disconnect = useCallback(() => {
    stop()
    setState("disconnected")
    setError(
      "The local model is unavailable. Demo mode remains available, but no backend connection is active.",
    )
  }, [stop])

  const retryConnection = useCallback(() => {
    setError(null)
    setState("thinking")
    window.setTimeout(() => setState("idle"), 850)
  }, [])

  return {
    messages,
    state,
    tool,
    error,
    submit,
    stop,
    reset,
    disconnect,
    retryConnection,
  }
}
