import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import type { AgentState } from "../types"

const stateLabels: Record<AgentState, string> = {
  idle: "Yalda is ready",
  listening: "Yalda is listening",
  thinking: "Yalda is thinking",
  speaking: "Yalda is responding",
  "using-tool": "Yalda is using a tool",
  success: "Task completed",
  error: "An operation failed",
  disconnected: "Yalda is disconnected",
}

export default function YaldaCharacter({
  state,
  compact = false,
}: {
  state: AgentState
  compact?: boolean
}) {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!root.current) return
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.classList.contains("motion-reduced")
    const ctx = gsap.context(() => {
      const shell = ".character-shell"
      const iris = ".character-iris"
      const core = ".character-core"
      const orbit = ".character-orbit"
      const ripple = ".character-ripple"
      const beam = ".character-beam"

      gsap.set([shell, iris, core, orbit, ripple, beam], { clearProps: "all" })
      gsap.set(root.current, { "--state-accent": "var(--violet)" })

      if (reduced || state === "disconnected") {
        if (state === "disconnected") {
          gsap.set([iris, core], { opacity: 0.28, scale: 0.94 })
          gsap.set(shell, { scaleY: 0.82 })
        }
        return
      }

      const timeline = gsap.timeline()
      const loops: gsap.core.Tween[] = []

      if (state === "idle") {
        loops.push(
          gsap.to(shell, {
            scale: 1.018,
            duration: 3.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          }),
          gsap.to(iris, {
            x: 4,
            rotation: 3,
            duration: 5.5,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          }),
          gsap.to(core, {
            opacity: 0.78,
            scale: 1.08,
            duration: 2.8,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
          }),
        )
      }

      if (state === "listening") {
        timeline.to(shell, {
          scaleX: 1.05,
          scaleY: 0.9,
          duration: 0.6,
          ease: "power3.out",
        })
        loops.push(
          gsap.to(core, {
            scale: 1.22,
            opacity: 1,
            duration: 1,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          }),
          gsap.fromTo(ripple, { scale: 1.15, opacity: 0.32 }, {
            scale: 0.72,
            opacity: 0,
            duration: 1.7,
            repeat: -1,
            ease: "power2.inOut",
          }),
        )
      }

      if (state === "thinking") {
        timeline.to(shell, { scaleY: 0.96, duration: 0.7, ease: "power2.out" })
        loops.push(
          gsap.to(orbit, {
            rotation: 360,
            duration: 4.8,
            repeat: -1,
            ease: "none",
          }),
          gsap.to(iris, {
            scaleX: 0.88,
            scaleY: 1.08,
            duration: 1.8,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          }),
          gsap.to(core, {
            x: 7,
            y: -3,
            duration: 1.5,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          }),
        )
      }

      if (state === "speaking") {
        timeline.to(shell, { scaleX: 1.03, duration: 0.45, ease: "power2.out" })
        loops.push(
          gsap.to(shell, {
            scaleY: 1.06,
            duration: 0.72,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          }),
          gsap.to(core, {
            scale: 1.25,
            opacity: 0.92,
            duration: 0.48,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut",
          }),
          gsap.to(beam, {
            xPercent: 140,
            opacity: 0.55,
            duration: 1.35,
            repeat: -1,
            ease: "power2.inOut",
            repeatDelay: 0.2,
          }),
        )
      }

      if (state === "using-tool") {
        gsap.set(root.current, { "--state-accent": "var(--cyan)" })
        timeline.to(shell, { scaleY: 0.91, duration: 0.55, ease: "power3.out" })
        loops.push(
          gsap.to(orbit, {
            rotation: 360,
            duration: 2.1,
            repeat: -1,
            ease: "none",
          }),
          gsap.fromTo(beam, { xPercent: -130, opacity: 0 }, {
            xPercent: 150,
            opacity: 0.72,
            duration: 1.25,
            repeat: -1,
            ease: "power2.inOut",
            repeatDelay: 0.35,
          }),
        )
      }

      if (state === "success") {
        gsap.set(root.current, { "--state-accent": "var(--success)" })
        timeline
          .to(shell, { scale: 0.96, duration: 0.25, ease: "power2.in" })
          .to(shell, { scale: 1.04, duration: 0.5, ease: "back.out(2)" })
          .to(shell, { scale: 1, duration: 0.4 })
          .fromTo(
            ripple,
            { scale: 0.8, opacity: 0.7 },
            { scale: 1.5, opacity: 0, duration: 1 },
            0.25,
          )
      }

      if (state === "error") {
        gsap.set(root.current, { "--state-accent": "var(--error)" })
        timeline
          .to(shell, {
            scaleX: 0.9,
            scaleY: 1.04,
            x: -4,
            duration: 0.22,
            ease: "power2.in",
          })
          .to(shell, {
            scaleX: 0.94,
            scaleY: 0.86,
            x: 0,
            duration: 0.42,
            ease: "power3.out",
          })
        gsap.set(orbit, { rotation: -12, opacity: 0.35 })
        gsap.set(core, { scale: 0.78, x: -3 })
      }

      return () => {
        timeline.kill()
        loops.forEach((animation) => animation.kill())
      }
    }, root)
    return () => ctx.revert()
  }, [state])

  return (
    <div
      className={`yalda-character ${compact ? "is-compact" : ""}`}
      data-state={state}
      ref={root}
      role="img"
      aria-label={stateLabels[state]}
    >
      <div className="character-aura" />
      <div className="character-ripple" />
      <div className="character-shell">
        <div className="character-depth" />
        <div className="character-orbit">
          <span />
          <i />
        </div>
        <div className="character-iris">
          <div className="character-core" />
          <div className="character-glint" />
        </div>
        <div className="character-beam" />
      </div>
    </div>
  )
}
