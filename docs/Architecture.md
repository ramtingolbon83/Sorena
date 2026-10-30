# Sorena Architecture

Sorena is a local AI companion agent. It can be driven from a terminal (`main.py`, with voice in and out) or from a web HUD (React frontend + FastAPI service). Both paths share the same `Agent` loop, tool registry and local model server.

> Animated edges (the moving dashes) need a recent Mermaid version. If your viewer is older, the diagram still renders, just without motion.

```mermaid
flowchart TD
    User(["User"])

    subgraph CLI["Terminal mode"]
        Main["main.py"]
        STT["voice/stt.py<br/>Listener · faster-whisper"]
        TTS["voice/tts.py<br/>Speaker · Piper"]
    end

    subgraph WEB["Web mode"]
        FE["frontend<br/>React HUD + ChatDock"]
        API["agent/server.py<br/>FastAPI · /api/chat · /ws"]
        Hub["Hub<br/>state broadcaster"]
    end

    subgraph CORE["Agent core"]
        Agent["agent/agent.py<br/>tool-calling loop"]
        Persona["agent/persona.py<br/>SYSTEM_PROMPT"]
        Schemas["tools/schemas.py<br/>tool definitions"]
        Registry["tools/registry.py<br/>tool_registry"]
    end

    subgraph TOOLS["Tools"]
        Clock["get_current_time"]
        Add["add"]
        Girl["girl_day_greeting"]
    end

    subgraph MODEL["Model"]
        Client["models/client.py<br/>ModelClient"]
        LLM[("Local LLM server<br/>127.0.0.1:8080<br/>/v1/chat/completions")]
    end

    User e1@--> Main
    Main e2@--> STT
    Main e3@--> Agent
    Main e4@--> TTS

    User e5@--> FE
    FE e6@--> API
    API e7@--> Agent
    API e8@--> Hub
    Hub e9@-. WebSocket .-> FE

    Persona --> Agent
    Schemas --> Agent
    Agent e10@--> Client
    Client e11@--> LLM
    Agent e12@--> Registry
    Registry --> Clock
    Registry --> Add
    Registry --> Girl

    classDef animate stroke-dasharray: 9\,5,stroke-dashoffset: 900,animation: dash 25s linear infinite;
    class e1,e2,e3,e4,e5,e6,e7,e8,e9,e10,e11,e12 animate
```

## Layers

| Layer | Files | Responsibility |
| --- | --- | --- |
| Entry points | `main.py`, `agent/server.py` | Receive a user message (typed, spoken or from the HUD) and hand it to the agent |
| Voice | `voice/stt.py`, `voice/tts.py` | Speech to text (Whisper) and text to speech (Piper) for terminal mode |
| Agent core | `agent/agent.py`, `agent/persona.py` | Persona prompt plus the loop that alternates between the model and tools |
| Tools | `tools/*.py` | Small Python functions the model can call; `schemas.py` describes them, `registry.py` maps names to code |
| Model | `models/client.py` | One HTTP call to the local OpenAI-compatible server |
| HUD | `frontend/src` | Shows the agent state (idle, listening, working, speaking, success, error) and a chat dock |

## Adding a tool

1. Write the function in `tools/your_tool.py`.
2. Describe it in `tools/schemas.py` so the model knows when to call it.
3. Register it in `tools/registry.py`.

`GET /api/tools` flags any schema that has no matching entry in `tool_registry`.