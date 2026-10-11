import { useState } from "react"
import type { AppView } from "../types"
import Icon from "./Icon"

const sampleMemories = [
  {
    title: "Preferred response style",
    body: "Concise explanations with technical detail when useful.",
    updated: "Sample · Updated 2 days ago",
  },
  {
    title: "Current learning topic",
    body: "Exploring local language model architecture and tool calling.",
    updated: "Sample · Updated 5 days ago",
  },
]

export default function SupportingViews({
  view,
  onMenu,
  onChat,
  onDisconnect,
}: {
  view: Exclude<AppView, "chat">
  onMenu: () => void
  onChat: () => void
  onDisconnect: () => void
}) {
  const [query, setQuery] = useState("")
  const [motion, setMotion] = useState(true)
  const title =
    view === "history" ? "Conversations" : view[0].toUpperCase() + view.slice(1)

  return (
    <main className="workspace support-workspace">
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
            <small>{title}</small>
          </div>
        </div>
        <div className="topbar-status">
          <span className="status-dot demo" />
          <span>Demo mode</span>
        </div>
      </header>
      <section className="support-view">
        <div className="view-heading">
          <p className="eyebrow">WORKSPACE</p>
          <h1>{title}</h1>
          <p>
            {view === "history" &&
              "Return to recent threads or begin a new line of thought."}
            {view === "tools" &&
              "Capabilities registered with your agent. Tool results below are labeled demonstrations."}
            {view === "memory" &&
              "Review what Yalda may retain beyond the current conversation."}
            {view === "settings" &&
              "Configure the interface and prepare your local model connection."}
          </p>
        </div>

        {view === "history" && (
          <div className="history-list">
            <button className="history-item active" onClick={onChat}>
              <span className="history-icon">
                <Icon name="chat" />
              </span>
              <span>
                <b>New conversation</b>
                <small>Current thread · Just now</small>
              </span>
              <Icon name="chevron" />
            </button>
            <div className="view-empty">
              <span className="empty-icon">
                <Icon name="chat" />
              </span>
              <b>No saved conversations yet</b>
              <p>
                Threads will appear here when conversation persistence is
                connected.
              </p>
            </div>
          </div>
        )}

        {view === "tools" && (
          <div className="tool-grid">
            <div className="capability-card">
              <span className="capability-icon">
                <Icon name="calculator" />
              </span>
              <div className="capability-title">
                <div>
                  <b>Calculator</b>
                  <small>Demo capability</small>
                </div>
                <span className="availability">Available in demo</span>
              </div>
              <p>
                Evaluates arithmetic through a structured tool event. No system
                access is implied.
              </p>
              <div className="capability-meta">
                <span>Last event</span>
                <b>Not run</b>
              </div>
            </div>
            <div className="capability-card">
              <span className="capability-icon cyan">
                <Icon name="clock" />
              </span>
              <div className="capability-title">
                <div>
                  <b>System time</b>
                  <small>Backend required</small>
                </div>
                <span className="availability offline">Not connected</span>
              </div>
              <p>
                Requests the system time from your Python agent when the backend
                supplies this tool.
              </p>
              <div className="capability-meta">
                <span>Last event</span>
                <b>Unavailable</b>
              </div>
            </div>
            <div className="future-tool">
              <Icon name="plus" />
              <div>
                <b>Extensible by design</b>
                <p>
                  New backend tools can register here without changing the
                  workspace structure.
                </p>
              </div>
            </div>
          </div>
        )}

        {view === "memory" && (
          <>
            <div className="memory-banner">
              <Icon name="alert" />
              <div>
                <b>Sample memory data</b>
                <p>
                  Persistent memory is not connected. These entries only
                  demonstrate the intended interface.
                </p>
              </div>
            </div>
            <label className="search-field">
              <Icon name="search" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search sample memories"
              />
            </label>
            <div className="memory-list">
              {sampleMemories
                .filter((item) =>
                  `${item.title} ${item.body}`
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((item) => (
                  <article className="memory-item" key={item.title}>
                    <div>
                      <span className="sample-tag">SAMPLE</span>
                      <h2>{item.title}</h2>
                      <p>{item.body}</p>
                      <small>{item.updated}</small>
                    </div>
                    <div className="row-actions">
                      <button aria-label={`Edit ${item.title}`} disabled>
                        <Icon name="edit" size={17} />
                      </button>
                      <button aria-label={`Delete ${item.title}`} disabled>
                        <Icon name="trash" size={17} />
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </>
        )}

        {view === "settings" && (
          <div className="settings-layout">
            <section className="settings-section">
              <div className="section-heading">
                <div>
                  <h2>Model connection</h2>
                  <p>
                    Development endpoint for your local OpenAI-compatible
                    service.
                  </p>
                </div>
                <span className="connection-badge">
                  <span />
                  Not connected
                </span>
              </div>
              <label className="field-label">
                Endpoint
                <input
                  readOnly
                  value="http://127.0.0.1:8080/v1/chat/completions"
                />
              </label>
              <div className="settings-note">
                <Icon name="alert" size={18} />
                <p>
                  Localhost refers to the machine running this browser. A
                  deployed site requires a secure local bridge and permission
                  model.
                </p>
              </div>
              <button className="secondary-button" onClick={onDisconnect}>
                Preview disconnected state
              </button>
            </section>
            <section className="settings-section">
              <div className="section-heading">
                <div>
                  <h2>Experience</h2>
                  <p>Control motion and interface behavior.</p>
                </div>
              </div>
              <button
                className="setting-row"
                onClick={() =>
                  setMotion((value) => {
                    document.documentElement.classList.toggle(
                      "motion-reduced",
                      value,
                    )
                    return !value
                  })
                }
              >
                <span>
                  <b>Interface motion</b>
                  <small>State-driven character transitions</small>
                </span>
                <span className={`toggle ${motion ? "on" : ""}`}>
                  <i />
                </span>
              </button>
              <div className="setting-row static">
                <span>
                  <b>Theme</b>
                  <small>Dark · System preference unavailable in demo</small>
                </span>
                <span className="value">Yalda dark</span>
              </div>
              <div className="setting-row static">
                <span>
                  <b>Persistent memory</b>
                  <small>Requires backend support</small>
                </span>
                <span className="value muted">Not connected</span>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}
