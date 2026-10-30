import { useCallback, useEffect, useRef, useState } from "react"
import {
  fetchTools,
  sendChat,
  startListening,
  transcribe,
  type ToolCall,
  type ToolInfo,
} from "./api"
import { useAgentSocket, type AgentEvent } from "./useAgentSocket"
import { useRecorder } from "./useRecorder"
import "./chat-dock.css"

type Line =
  | { kind: "user" | "agent" | "error" | "note"; text: string }
  | { kind: "tool"; call: ToolCall }

const SPEAK_KEY = "sorena.speak"

const readSpeakPreference = () => {
  try {
    return localStorage.getItem(SPEAK_KEY) !== "off"
  } catch {
    return true // storage can be blocked; default to speaking
  }
}

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
  const [speak, setSpeak] = useState(readSpeakPreference)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sessionId = useRef<string | undefined>(undefined)
  const logRef = useRef<HTMLDivElement>(null)
  const recorder = useRecorder()

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

  const addLine = (line: Line) => setLines((prev) => [...prev, line])

  const stopAudio = () => {
    audioRef.current?.pause()
    audioRef.current = null
  }

  const toggleSpeak = () => {
    const next = !speak
    setSpeak(next)
    if (!next) stopAudio()
    try {
      localStorage.setItem(SPEAK_KEY, next ? "on" : "off")
    } catch {
      /* storage unavailable: the choice just won't be remembered */
    }
  }

  const playReply = (audio: string) => {
    stopAudio()
    const player = new Audio(`data:audio/wav;base64,${audio}`)
    audioRef.current = player
    player.play().catch(() => {
      addLine({ kind: "note", text: "The browser blocked audio. Click on the page and try again." })
    })
  }

  /** One chat round-trip, for typed text and for transcribed speech. */
  const ask = async (text: string, voice: boolean) => {
    addLine({ kind: "user", text: voice ? `🎤 ${text}` : text })
    try {
      stopAudio()
      const response = await sendChat(text, sessionId.current, voice, speak)
      sessionId.current = response.session_id
      response.tool_calls.forEach((call) => addLine({ kind: "tool", call }))
      addLine({ kind: "agent", text: response.reply || "(no reply)" })
      if (response.audio) playReply(response.audio)
    } catch (error) {
      addLine({ kind: "error", text: String(error) })
      if (link !== "online") onState("error") // the backend could not announce it itself
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    setBusy(true)
    try {
      await ask(text, false)
    } finally {
      setBusy(false)
    }
  }

  /** Click once to start recording (pink eye), click again to stop, transcribe and send. */
  const toggleMic = async () => {
    if (busy) return
    if (!recorder.recording) {
      try {
        stopAudio() // talking over the reply interrupts it
        await recorder.start()
        startListening().catch(() => onState("listening")) // backend offline: show it locally
      } catch (error) {
        addLine({ kind: "error", text: `Microphone unavailable: ${String(error)}` })
      }
      return
    }
    setBusy(true)
    try {
      const text = await transcribe(await recorder.stop())
      if (!text) {
        onState("idle")
        addLine({ kind: "note", text: "No speech detected." })
        return
      }
      await ask(text, true)
    } catch (error) {
      addLine({ kind: "error", text: String(error) })
      if (link !== "online") onState("error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`chat-dock ${open ? "open" : ""}`}>
      {open && (
        <section className="chat-panel" aria-label="Chat with Sorena">
          <header>
            <span>
              <i className={`link link-${link}`} /> LINK // {link.toUpperCase()}
            </span>
            <button
              type="button"
              className="speak-toggle"
              onClick={toggleSpeak}
              aria-pressed={speak}
              title="Read replies aloud"
            >
              SPEAK {speak ? "ON" : "OFF"}
            </button>
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
            {lines.length === 0 && <p className="muted">Ask Sorena something…</p>}
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
            <button
              type="button"
              className={`mic ${recorder.recording ? "recording" : ""}`}
              onClick={toggleMic}
              disabled={busy}
              aria-pressed={recorder.recording}
              title={recorder.recording ? "Stop and send" : "Speak"}
            >
              {recorder.recording ? "STOP" : "MIC"}
            </button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={link === "online" ? "Message Sorena" : "Backend offline"}
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
        <i className={`link link-${link}`} /> {open ? "CLOSE" : "ASK SORENA"}
      </button>
    </div>
  )
}
