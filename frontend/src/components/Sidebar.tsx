import type { AppView } from "../types"
import Icon from "./Icon"

const navItems: {
  id: AppView
  label: string
  icon: "chat" | "tools" | "memory" | "settings"
}[] = [
  { id: "history", label: "Conversations", icon: "chat" },
  { id: "tools", label: "Tools", icon: "tools" },
  { id: "memory", label: "Memory", icon: "memory" },
  { id: "settings", label: "Settings", icon: "settings" },
]

export default function Sidebar({
  active,
  open,
  onNavigate,
  onNew,
  onClose,
}: {
  active: AppView
  open: boolean
  onNavigate: (view: AppView) => void
  onNew: () => void
  onClose: () => void
}) {
  return (
    <>
      <div
        className={`mobile-scrim ${open ? "is-visible" : ""}`}
        onClick={onClose}
      />
      <aside
        className={`sidebar ${open ? "is-open" : ""}`}
        aria-label="Primary navigation"
      >
        <div className="brand-row">
          <button
            className="brand"
            onClick={() => onNavigate("chat")}
            aria-label="Go to Yalda chat"
          >
            <span className="brand-mark">
              <i />
            </span>
            <span>
              <b>Yalda</b>
              <small>Personal agent</small>
            </span>
          </button>
          <button
            className="icon-button mobile-close"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        </div>

        <button className="new-chat" onClick={onNew}>
          <Icon name="plus" size={18} />
          <span>New conversation</span>
          <kbd>⌘ N</kbd>
        </button>

        <nav>
          <span className="nav-label">Workspace</span>
          {navItems.map((item) => (
            <button
              className={`nav-item ${active === item.id ? "is-active" : ""}`}
              key={item.id}
              onClick={() => onNavigate(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.id === "memory" && <em>Demo</em>}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />
        <div className="connection-card">
          <span className="status-dot demo" />
          <div>
            <b>Demo mode</b>
            <small>Local model not connected</small>
          </div>
          <Icon name="chevron" size={16} />
        </div>
        <div className="profile-row">
          <span className="avatar">RM</span>
          <div>
            <b>Local workspace</b>
            <small>Private by design</small>
          </div>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => onNavigate("settings")}
          >
            <Icon name="settings" size={17} />
          </button>
        </div>
      </aside>
    </>
  )
}
