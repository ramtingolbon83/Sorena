import { useEffect, useState } from "react"
import ChatWorkspace from "./components/ChatWorkspace"
import Sidebar from "./components/Sidebar"
import SupportingViews from "./components/SupportingViews"
import useYaldaAgent from "./hooks/useYaldaAgent"
import type { AppView } from "./types"

export default function App() {
  const [view, setView] = useState<AppView>("chat")
  const [menuOpen, setMenuOpen] = useState(false)
  const agent = useYaldaAgent()

  const navigate = (next: AppView) => {
    setView(next)
    setMenuOpen(false)
  }

  const startNew = () => {
    agent.reset()
    navigate("chat")
  }

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n") {
        event.preventDefault()
        startNew()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <Sidebar
        active={view}
        open={menuOpen}
        onNavigate={navigate}
        onNew={startNew}
        onClose={() => setMenuOpen(false)}
      />
      {view === "chat" ? (
        <ChatWorkspace
          messages={agent.messages}
          state={agent.state}
          tool={agent.tool}
          error={agent.error}
          onSubmit={agent.submit}
          onStop={agent.stop}
          onRetry={
            agent.state === "disconnected"
              ? agent.retryConnection
              : () =>
                  agent.messages.at(-1)?.role === "user" &&
                  agent.submit(agent.messages.at(-1)!.content)
          }
          onMenu={() => setMenuOpen(true)}
        />
      ) : (
        <SupportingViews
          view={view}
          onMenu={() => setMenuOpen(true)}
          onChat={() => navigate("chat")}
          onDisconnect={() => {
            agent.disconnect()
            navigate("chat")
          }}
        />
      )}
    </div>
  )
}
