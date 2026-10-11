import type { AgentState, ToolActivity } from "../types"
import Icon from "./Icon"

const labels: Record<AgentState, string> = {
  idle: "Ready",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Generating response",
  "using-tool": "Using tool",
  success: "Completed",
  error: "Needs attention",
  disconnected: "Connection lost",
}

export default function ActivityPill({
  state,
  tool,
}: {
  state: AgentState
  tool: ToolActivity | null
}) {
  return (
    <div
      className={`activity-pill state-${state}`}
      role="status"
      aria-live="polite"
    >
      <span className="activity-symbol">
        {state === "success" ? (
          <Icon name="check" size={13} />
        ) : state === "error" || state === "disconnected" ? (
          <Icon name="alert" size={13} />
        ) : null}
      </span>
      <span>
        <b>{tool ? `${tool.name} · ${tool.status}` : labels[state]}</b>
        {tool && <small>{tool.description}</small>}
      </span>
    </div>
  )
}
