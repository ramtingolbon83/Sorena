export type AgentState = "idle" | "listening" | "thinking" | "speaking" | "using-tool" | "success" | "error" | "disconnected"

export type AppView = "chat" | "history" | "tools" | "memory" | "settings"

export type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  status?: "streaming" | "complete" | "error"
}

export type ToolActivity = {
  name: string
  description: string
  status: "running" | "succeeded" | "failed"
  result?: string
}
