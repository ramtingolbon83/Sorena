import { useEffect, useRef, useState } from "react"
import type { AgentState, Message, ToolActivity } from "../types"
import ActivityPill from "./ActivityPill"
import Icon from "./Icon"
import YaldaCharacter from "./YaldaCharacter"

const suggestions = [
  { label: "Explain a technical concept", detail: "Break down a complex idea" },
  { label: "Calculate something for me", detail: "Preview a demo tool flow" },
  {
    label: "Check the current system status",
    detail: "Review connection context",
  },
]

function renderContent(content: string) {
  const parts = content.split(/(\*\*.*?\*\*|_.*?_)/g)
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={index}>{part.slice(2, -2)}</strong>
    if (part.startsWith("_") && part.endsWith("_"))
      return <em key={index}>{part.slice(1, -1)}</em>
    return part
  })
}

export default function ChatWorkspace({
  messages,
  state,
  tool,
  error,
  onSubmit,
  onStop,
  onRetry,
  onMenu,
}: {
  messages: Message[]
  state: AgentState
  tool: ToolActivity | null
  error: string | null
  onSubmit: (value: string) => void
  onStop: () => void
  onRetry: () => void
  onMenu: () => void
}) {
  const [draft, setDraft] = useState("")
  const [copied, setCopied] = useState<string | null>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const busy = ["thinking", "speaking", "using-tool", "success"].includes(state)
  const disconnected = state === "disconnected"

  useEffect(
    () => end.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
    [messages, tool, error],
  )

  const send = () => {
    const value = draft.trim()
    if (!value || busy || disconnected) return
    setDraft("")
    if (textarea.current) textarea.current.style.height = "auto"
    onSubmit(value)
  }

  return (
    <main className="workspace">
      <header className="topbar">
        <button
          className="icon-button menu-button"
          onClick={onMenu}
          aria-label="Open navigation"
        >
          <Icon name="menu" />
        </button>
        <div className="topbar-title">
          <span className="mini-orb" />
          <div>
            <b>Yalda</b>
            <small>
              {messages.length
                ? "Current conversation"
                : "Personal AI workspace"}
            </small>
          </div>
        </div>
        <div className="topbar-status">
          <span className="status-dot demo" />
          <span>Demo mode</span>
        </div>
      </header>

      <div className={`conversation ${messages.length ? "has-messages" : ""}`}>
        {!messages.length ? (
          <section className="empty-state">
            <div className="character-stage">
              <div className="stage-ring ring-one" />
              <div className="stage-ring ring-two" />
              <YaldaCharacter state={state} />
            </div>
            <ActivityPill state={state} tool={tool} />
            <div className="welcome-copy">
              <p className="eyebrow">YOUR PRIVATE INTELLIGENCE</p>
              <h1>
                Good afternoon.
                <br />
                What are we exploring?
              </h1>
              <p>
                Ask a question, work through an idea, or preview how Yalda can
                use tools once your local agent is connected.
              </p>
            </div>
            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.label}
                  onClick={() => setDraft(suggestion.label)}
                >
                  <span>
                    <b>{suggestion.label}</b>
                    <small>{suggestion.detail}</small>
                  </span>
                  <Icon name="arrow" size={17} />
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="message-view" aria-label="Conversation">
            <div className="conversation-heading">
              <div>
                <p className="eyebrow">CURRENT THREAD</p>
                <h1>New conversation</h1>
              </div>
              <div className="compact-agent">
                <YaldaCharacter state={state} compact />
                <ActivityPill state={state} tool={tool} />
              </div>
            </div>
            <div className="messages">
              {messages.map((message) => (
                <article className={`message ${message.role}`} key={message.id}>
                  <div className="message-author">
                    {message.role === "assistant" ? (
                      <span className="assistant-mark">
                        <i />
                      </span>
                    ) : (
                      <span className="user-mark">You</span>
                    )}
                    <span>
                      {message.role === "assistant" ? "Yalda" : "You"}
                    </span>
                    <time>{message.timestamp}</time>
                  </div>
                  <div className="message-body">
                    <p>
                      {renderContent(message.content)}
                      {message.status === "streaming" && (
                        <span className="stream-caret" />
                      )}
                    </p>
                    {message.role === "assistant" && message.content && (
                      <button
                        className="copy-button"
                        aria-label="Copy response"
                        onClick={() => {
                          navigator.clipboard.writeText(message.content)
                          setCopied(message.id)
                          window.setTimeout(() => setCopied(null), 1200)
                        }}
                      >
                        <Icon
                          name={copied === message.id ? "check" : "copy"}
                          size={15}
                        />
                        {copied === message.id ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
              {tool && (
                <div className={`tool-event ${tool.status}`}>
                  <span className="tool-event-icon">
                    <Icon name="calculator" size={18} />
                  </span>
                  <div>
                    <b>{tool.name}</b>
                    <p>{tool.description}</p>
                    {tool.result && <small>{tool.result}</small>}
                  </div>
                  <span className="tool-status">{tool.status}</span>
                </div>
              )}
              {error && (
                <div className="inline-error" role="alert">
                  <Icon name="alert" />
                  <div>
                    <b>
                      {state === "disconnected"
                        ? "Model connection unavailable"
                        : "Request interrupted"}
                    </b>
                    <p>{error}</p>
                  </div>
                  <button onClick={onRetry}>
                    <Icon name="retry" size={16} /> Retry
                  </button>
                </div>
              )}
              <div ref={end} />
            </div>
          </section>
        )}
      </div>

      <div className="composer-wrap">
        {messages.length === 0 && (
          <div className="demo-notice">
            <span /> Responses and tool events are simulated in demo mode
          </div>
        )}
        <div className={`composer ${disconnected ? "is-disabled" : ""}`}>
          <textarea
            ref={textarea}
            rows={1}
            value={draft}
            disabled={disconnected}
            placeholder={
              disconnected ? "Connect a model to continue…" : "Message Yalda…"
            }
            aria-label="Message Yalda"
            onChange={(event) => {
              setDraft(event.target.value)
              event.currentTarget.style.height = "auto"
              event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 140)}px`
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
          />
          <div className="composer-actions">
            <span className="shortcut">↵ to send · ⇧↵ new line</span>
            {busy ? (
              <button
                className="send-button stop"
                onClick={onStop}
                aria-label="Stop generation"
              >
                <Icon name="stop" size={17} />
              </button>
            ) : (
              <button
                className="send-button"
                onClick={send}
                disabled={!draft.trim() || disconnected}
                aria-label="Send message"
              >
                <Icon name="send" size={18} />
              </button>
            )}
          </div>
        </div>
        <p className="composer-caption">
          Yalda can make mistakes. Verify important information.
        </p>
      </div>
    </main>
  )
}
