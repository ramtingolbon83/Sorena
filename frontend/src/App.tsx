import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import ChatDock from "./ChatDock"

type AgentState = "idle" | "working" | "success" | "speaking" | "listening" | "error"

type StateConfig = {
  primary: string
  glow: string
  status: string
  threat: string
  image: string
  panelCopy: [string, string, string, string]
}

const STATES: Record<AgentState, StateConfig> = {
  idle: {
    primary: "#8B2BFF",
    glow: "#C9A0FF",
    status: "STANDBY",
    threat: "LOW",
    image: "/eyes/idle.webp",
    panelCopy: [
      "Systems awaiting directive",
      "Passive streams indexed",
      "No anomalies present",
      "Safeguards standing by",
    ],
  },
  working: {
    primary: "#FF6A00",
    glow: "#FFC07A",
    status: "PROCESSING",
    threat: "ELEVATED",
    image: "/eyes/working.webp",
    panelCopy: [
      "All systems active",
      "Data streams analyzed",
      "Anomalies being traced",
      "Protocols enforced",
    ],
  },
  success: {
    primary: "#1FFF5A",
    glow: "#D4FFE0",
    status: "TASK COMPLETE",
    threat: "NONE",
    image: "/eyes/success.webp",
    panelCopy: [
      "Objectives verified",
      "Results committed",
      "No anomalies present",
      "Protocols completed",
    ],
  },
  speaking: {
    primary: "#1E7BFF",
    glow: "#BFE0FF",
    status: "TRANSMITTING",
    threat: "LOW",
    image: "/eyes/speaking.webp",
    panelCopy: [
      "Voice channel open",
      "Response stream active",
      "Signal path secure",
      "Output protocols active",
    ],
  },
  listening: {
    primary: "#FF2E93",
    glow: "#FFB3D9",
    status: "LISTENING",
    threat: "LOW",
    image: "/eyes/listening.webp",
    panelCopy: [
      "Audio sensors active",
      "Input stream decoding",
      "Intent model engaged",
      "Awaiting signal end",
    ],
  },
  error: {
    primary: "#FF1B1B",
    glow: "#FFB0B0",
    status: "FAULT DETECTED",
    threat: "CRITICAL",
    image: "/eyes/error.webp",
    panelCopy: [
      "System fault isolated",
      "Recovery data captured",
      "Critical anomaly found",
      "Failsafe protocols active",
    ],
  },
}

const STATE_KEYS = Object.keys(STATES) as AgentState[]

declare global {
  interface Window {
    yalda: {
      setState: (state: AgentState) => void
      getState: () => AgentState
      connectSocket: (url: string) => WebSocket
      states: readonly AgentState[]
    }
  }
}

const Icon = ({
  name,
}: {
  name: "eye" | "alert" | "shield" | "target" | "cube" | "network" | "nodes"
}) => {
  const paths = {
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    alert: (
      <>
        <path d="m12 3 10 18H2L12 3Z" />
        <path d="M12 9v5m0 3v.01" />
      </>
    ),
    shield: (
      <>
        <path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-5" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4m0 14v4M1 12h4m14 0h4" />
      </>
    ),
    cube: (
      <>
        <path d="m12 2 8 4.5v10L12 22l-8-5.5v-10L12 2Z" />
        <path d="m4 6.5 8 5 8-5M12 22V11.5" />
      </>
    ),
    network: (
      <>
        <circle cx="12" cy="4" r="2" />
        <circle cx="5" cy="17" r="2" />
        <circle cx="19" cy="17" r="2" />
        <path d="m11 6-5 9m7-9 5 9M7 17h10" />
      </>
    ),
    nodes: (
      <>
        <circle cx="5" cy="6" r="2" />
        <circle cx="19" cy="6" r="2" />
        <circle cx="12" cy="18" r="2" />
        <path d="m7 7 4 9m6-9-4 9M7 6h10" />
      </>
    ),
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

const Sparkline = ({ kind = "line" }: { kind?: "line" | "bars" | "dots" }) => {
  if (kind === "bars") {
    return (
      <div className="equalizer" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <i key={i} style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    )
  }
  if (kind === "dots") {
    return (
      <div className="pulse-dots" aria-hidden="true">
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} />
        ))}
      </div>
    )
  }
  return (
    <svg
      className="sparkline"
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 19 8 18 13 21 19 17 25 19 30 5 34 22 40 17 46 19 52 11 57 19 63 17 68 8 72 20 79 17 85 19 91 13 96 18 100 16" />
    </svg>
  )
}

const WorldMap = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 92 }, (_, i) => {
        const x = (i * 37 + Math.sin(i * 2.7) * 18 + 110) % 100
        const band = i % 5
        const y = 21 + band * 11 + Math.sin(i * 1.31) * 8
        const show = !(
          (x > 46 && x < 57 && y > 42) ||
          (x < 13 && y > 48) ||
          (x > 86 && y < 34)
        )
        return { x, y, show, delay: `${(i % 13) * 0.19}s` }
      }),
    [],
  )
  return (
    <svg className="world-map" viewBox="0 0 220 90" aria-hidden="true">
      <path d="M7 29 25 15 50 17 62 26 53 35 43 37 38 52 26 44 18 35Zm65-6 25-10 41 5 10 13-14 11-3 29-12 5-8-31-18-6-15 11-18-10Zm85 1 25-5 30 14-10 9-17-2-11 12-12-8Zm21 37 18 4 13 13-9 7-25-8Z" />
      {dots.map(
        (dot, i) =>
          dot.show && (
            <circle
              key={i}
              cx={dot.x * 2.12 + 3}
              cy={dot.y}
              r={i % 7 === 0 ? 1.2 : 0.72}
              style={{ animationDelay: dot.delay }}
            />
          ),
      )}
    </svg>
  )
}

const EyeCore = ({ state }: { state: AgentState }) => {
  const wrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (
        !wrapRef.current ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return
      const x = (event.clientX / innerWidth - 0.5) * 12
      const y = (event.clientY / innerHeight - 0.5) * 12
      wrapRef.current.style.setProperty("--mx", `${x}px`)
      wrapRef.current.style.setProperty("--my", `${y}px`)
    }
    window.addEventListener("pointermove", move)
    return () => window.removeEventListener("pointermove", move)
  }, [])

  return (
    <div className="eye-stage" ref={wrapRef}>
      <div className="crosshair crosshair-x" />
      <div className="crosshair crosshair-y" />
      <div className="orbital-rings">
        <span className="orbit orbit-a" />
        <span className="orbit orbit-b" />
        <span className="orbit orbit-c" />
        <span className="orbit orbit-d" />
      </div>
      <svg className="rune-ring" viewBox="0 0 600 600" aria-hidden="true">
        <defs>
          <path id="runePath" d="M300,38 a262,262 0 1,1 -0.1,0" />
        </defs>
        <text>
          <textPath href="#runePath" startOffset="0%">
            YΛL·DΛ AER-9 ∴ VELUM ORA ∶ SYNTH KAI ∴ NEXUS OMEN ∶ YΛL·DΛ AER-9 ∴
            VELUM ORA ∶ SYNTH KAI ∴{" "}
          </textPath>
        </text>
      </svg>
      <div className="eye-parallax">
        <div className="eye-images">
          {STATE_KEYS.map((key) => (
            <img
              key={key}
              className={state === key ? "active" : ""}
              src={STATES[key].image}
              alt=""
              draggable={false}
            />
          ))}
          <span className="eye-scan" />
          <span className="eye-flare" />
          <span className="shockwave" />
          <span className="ripple ripple-one" />
          <span className="ripple ripple-two" />
        </div>
      </div>
      {["n", "e", "s", "w"].map((p) => (
        <span key={p} className={`cardinal cardinal-${p}`} />
      ))}
      <span className="axis-label axis-top">VECTOR // 00.01</span>
      <span className="axis-label axis-bottom">CORE // SECURE</span>
    </div>
  )
}

const Metric = ({
  icon,
  label,
  value,
}: {
  icon: "eye" | "alert" | "shield"
  label: string
  value: string
}) => (
  <div className="metric">
    <span className="metric-icon">
      <Icon name={icon} />
    </span>
    <span>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  </div>
)

const DataPanel = ({
  icon,
  title,
  subtitle,
  chart,
}: {
  icon: "target" | "cube" | "alert" | "nodes"
  title: string
  subtitle: string
  chart: "line" | "bars" | "dots" | "progress"
}) => (
  <article className="data-panel panel-enter">
    <div className="panel-icon">
      <Icon name={icon} />
    </div>
    <div className="panel-text">
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
    {chart === "progress" ? (
      <div className="progress-ring">
        <span>100%</span>
      </div>
    ) : (
      <Sparkline kind={chart} />
    )}
  </article>
)

export default function App() {
  const initialState = (() => {
    const fromHash = new URLSearchParams(location.hash.replace(/^#/, "")).get(
      "state",
    )
    return fromHash && fromHash in STATES ? fromHash as AgentState : "idle"
  })()
  const [agentState, setAgentState] = useState<AgentState>(initialState)
  const [debugOpen, setDebugOpen] = useState(false)
  const stateRef = useRef(agentState)

  const changeState = useCallback((next: AgentState) => {
    if (!(next in STATES)) return
    setAgentState(next)
    stateRef.current = next
    const params = new URLSearchParams(location.hash.replace(/^#/, ""))
    params.set("state", next)
    history.replaceState(null, "", `#${params.toString()}`)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, [contenteditable]")) return // typing in the chat
      if (event.key.toLowerCase() === "d") setDebugOpen((open) => !open)
      const index = Number(event.key) - 1
      if (index >= 0 && index < STATE_KEYS.length)
        changeState(STATE_KEYS[index])
    }
    const onHash = () => {
      const next = new URLSearchParams(location.hash.replace(/^#/, "")).get(
        "state",
      )
      if (next && next in STATES) changeState(next as AgentState)
    }
    const onMessage = (event: MessageEvent) => {
      const payload =
        typeof event.data === "string" ? event.data : event.data?.state
      if (payload && payload in STATES) changeState(payload as AgentState)
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("hashchange", onHash)
    window.addEventListener("message", onMessage)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("hashchange", onHash)
      window.removeEventListener("message", onMessage)
    }
  }, [changeState])

  useEffect(() => {
    let socket: WebSocket | undefined
    const connectSocket = (url: string) => {
      socket?.close()
      socket = new WebSocket(url)
      socket.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data)
          const next = typeof data === "string" ? data : data.state
          if (next in STATES) changeState(next)
        } catch {
          if (event.data in STATES) changeState(event.data)
        }
      })
      return socket
    }
    window.yalda = {
      setState: changeState,
      getState: () => stateRef.current,
      connectSocket,
      states: STATE_KEYS,
    }
    const wsUrl = new URLSearchParams(location.search).get("ws")
    if (wsUrl) connectSocket(wsUrl)
    return () => socket?.close()
  }, [changeState])

  useEffect(() => {
    if (agentState !== "success") return
    const timer = window.setTimeout(() => changeState("idle"), 3000)
    return () => window.clearTimeout(timer)
  }, [agentState, changeState])

  const config = STATES[agentState]
  const cssVars = {
    "--accent": config.primary,
    "--glow": config.glow,
  } as React.CSSProperties

  return (
    <main className={`yalda state-${agentState}`} style={cssVars}>
      <div className="noise" />
      <div className="frame">
        <i />
        <i />
        <i />
        <i />
      </div>

      <section className="hud-grid">
        <header className="brand panel-enter">
          <span className="brand-mark" />
          <div>
            <p>YALDA AI AGENT</p>
            <span>
              STATUS: <b aria-live="polite">{config.status}</b>
            </span>
          </div>
        </header>

        <section className="left-column">
          <div className="title-block panel-enter">
            <span>THE</span>
            <h1>EYE</h1>
            <p>SURVEILLANCE. ANALYSIS. CONTROL.</p>
          </div>
          <blockquote className="quote panel-enter">
            <span>The Eye sees all.</span>
            <span>It forgets nothing.</span>
            <span>It is not watched.</span>
            <span>It is watching.</span>
          </blockquote>
        </section>

        <section
          className="center-column"
          aria-label={`Yalda visual core: ${config.status}`}
        >
          <EyeCore state={agentState} />
        </section>

        <aside className="right-column">
          <div className="overview panel-enter">
            <div className="overview-copy">
              <small>SYSTEM OVERSIGHT</small>
              <strong>FULL SPECTRUM</strong>
            </div>
            <WorldMap />
            <div className="yalda-logo" aria-label="Yalda monogram">
              <span>Y</span>
            </div>
          </div>
          <div className="panel-stack">
            <DataPanel
              icon="target"
              title="REAL-TIME MONITORING"
              subtitle={config.panelCopy[0]}
              chart="line"
            />
            <DataPanel
              icon="cube"
              title="INTELLIGENCE GATHERING"
              subtitle={config.panelCopy[1]}
              chart="bars"
            />
            <DataPanel
              icon="alert"
              title="THREAT DETECTION"
              subtitle={config.panelCopy[2]}
              chart="dots"
            />
            <DataPanel
              icon="nodes"
              title="AUTONOMOUS CONTROL"
              subtitle={config.panelCopy[3]}
              chart="progress"
            />
          </div>
          <div className="knowledge panel-enter">
            <strong>KNOWLEDGE IS POWER.</strong>
            <span>POWER IS CONTROL.</span>
            <i>
              <b />
            </i>
          </div>
        </aside>

        <footer className="metrics panel-enter">
          <Metric icon="eye" label="VISIBILITY" value="100%" />
          <Metric icon="alert" label="THREAT LEVEL" value={config.threat} />
          <Metric icon="shield" label="SYSTEM INTEGRITY" value="98%" />
        </footer>
      </section>

      <ChatDock onState={(state) => changeState(state as AgentState)} />

      <div
        className={`debug-bar ${debugOpen ? "open" : ""}`}
        aria-hidden={!debugOpen}
      >
        <span>STATE OVERRIDE</span>
        {STATE_KEYS.map((key, index) => (
          <button
            key={key}
            className={agentState === key ? "active" : ""}
            onClick={() => changeState(key)}
            style={{ "--swatch": STATES[key].primary } as React.CSSProperties}
          >
            <i />
            {index + 1} {key}
          </button>
        ))}
      </div>
    </main>
  )
}
