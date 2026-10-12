import { useCallback, useEffect, useRef, useState } from "react"
import { fetchTools, sendChat, type ToolCall, type ToolInfo } from "./api"
import { useAgentSocket, type AgentEvent } from "./useAgentSocket"
import "./chat-dock.css"

type Line =
  | { kind: "user" | "agent" | "error"; text: string }
  | { kind: "tool"; call: ToolCall }

const formatCall = (call: ToolCall) =>
  `${call.tool}(${Object.entries(call.arguments)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join(", ")}) → ${call.result}`

export default function ChatDock({ onState }: { onState: (state: string) => void }) {
  const [open, setOpen] = useState(false)
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [lines, setLines] = useState<Line[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeTool, setActiveTool] = useState<string | null>(null)
  const sessionId = useRef<string | undefined>(undefined)
  const logRef = useRef<HTMLDivElement>(null)

  const onEvent = useCallback(
    (event: AgentEvent) => {
      if (event.state) onState(event.state)
      if (event.event === "tool_start") setActiveTool(event.tool ?? null)
      if (event.event === "tool_end") window.setTimeout(() => setActiveTool(null), 700)
    },
    [onState],
  )
  const link = useAgentSocket(onEvent)

  // (re)load the tool list whenever the backend becomes reachable
  useEffect(() => {
    if (link !== "online") return
    fetchTools()
      .then(setTools)
      .catch(() => setTools([]))
  }, [link])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [lines, open])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    setBusy(true)
    setLines((prev) => [...prev, { kind: "user", text }])
    try {
      const response = await sendChat(text, sessionId.current)
      sessionId.current = response.session_id
      setLines((prev) => [
        ...prev,
        ...response.tool_calls.map((call): Line => ({ kind: "tool", call })),
        { kind: "agent", text: response.reply || "(no reply)" },
      ])
    } catch (error) {
      setLines((prev) => [...prev, { kind: "error", text: String(error) }])
      if (link !== "online") onState("error") // the backend could not announce it itself
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`chat-dock ${open ? "open" : ""}`}>
      {open && (
        <section className="chat-panel" aria-label="Chat with Yalda">
          <header>
            <span>
              <i className={`link link-${link}`} /> LINK // {link.toUpperCase()}
            </span>
            <span>{tools.length} TOOLS</span>
          </header>

          <ul className="chat-tools" aria-label="Available tools">
            {tools.length === 0 && <li className="muted">no tools loaded</li>}
            {tools.map((tool) => (
              <li
                key={tool.name}
                title={
                  tool.registered
                    ? tool.description
                    : "Schema exists but tool_registry has no implementation"
                }
                className={`${activeTool === tool.name ? "active" : ""} ${tool.registered ? "" : "missing"}`}
              >
                {tool.name}
              </li>
            ))}
          </ul>

          <div className="chat-log" ref={logRef} aria-live="polite">
            {lines.length === 0 && <p className="muted">Ask Yalda something…</p>}
            {lines.map((line, index) =>
              line.kind === "tool" ? (
                <p key={index} className="line tool">
                  ⚙ {formatCall(line.call)}
                </p>
              ) : (
                <p key={index} className={`line ${line.kind}`} dir="auto">
                  {line.text}
                </p>
              ),
            )}
          </div>

          <form onSubmit={submit}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={link === "online" ? "Message Yalda" : "Backend offline"}
              dir="auto"
              autoFocus
            />
            <button type="submit" disabled={busy || !input.trim()}>
              {busy ? "…" : "SEND"}
            </button>
          </form>
        </section>
      )}
      <button
        className="chat-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <i className={`link link-${link}`} /> {open ? "CLOSE" : "ASK YALDA"}
      </button>
    </div>
  )
}
