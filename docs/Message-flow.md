# Yalda Message Flow

How one user message travels through Yalda, and how the HUD state changes along the way.

## Web chat sequence

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant FE as Frontend (ChatDock + HUD)
    participant API as FastAPI /api/chat
    participant Hub as Hub (WebSocket /ws)
    participant AG as Agent
    participant LLM as Local LLM :8080
    participant T as Tools

    U->>FE: types a message
    FE->>API: POST /api/chat {message, session_id}
    API->>API: load or create session history
    API->>Hub: state = listening
    Hub-->>FE: HUD turns pink
    API->>Hub: state = working
    Hub-->>FE: HUD turns orange
    API->>AG: chat(history, tools, on_event)

    loop up to 8 steps
        AG->>LLM: messages + tool schemas
        LLM-->>AG: reply or tool_calls
        alt model asked for tools
            AG->>Hub: tool_start
            AG->>T: tool_registry[name](**arguments)
            T-->>AG: result
            AG->>Hub: tool_end
            Note over AG: tool result is appended to history
        else plain answer
            AG-->>API: final message
        end
    end

    API->>Hub: state = speaking
    Hub-->>FE: HUD turns blue
    API-->>FE: {reply, tool_calls, session_id}
    FE-->>U: shows the reply
    API->>Hub: state = success (after a delay based on reply length)
    Note over Hub,FE: UI returns to idle after about 3 seconds
```

## HUD state machine

```mermaid
stateDiagram-v2
    [*] --> idle
    idle --> listening: message received
    listening --> working: after 0.6 s
    working --> speaking: agent returned a reply
    working --> error: agent or model failed
    speaking --> success: delay based on reply length
    success --> idle: after about 3 s
    error --> listening: next message
    idle --> idle: no activity
```

## Terminal mode flow

```mermaid
flowchart LR
    A(["Enter pressed<br/>or text typed"]) --> B{"Input empty?"}
    B -- yes --> C["Listener.listen()<br/>record + Whisper"]
    B -- no --> D["use typed text"]
    C --> E["append user message"]
    D --> E
    E e1@--> F["Agent.chat()<br/>model + tools loop"]
    F e2@--> G["print answer"]
    G e3@--> H["Speaker.speak()<br/>Piper"]
    H --> A

    classDef animate stroke-dasharray: 9\,5,stroke-dashoffset: 900,animation: dash 25s linear infinite;
    class e1,e2,e3 animate
```

## Notes

- History lives in memory per `session_id`; if the agent fails, the new turn is rolled back so the history stays clean.
- The loop stops after 8 model-and-tool rounds so a model that keeps calling tools cannot run forever.
- Tool errors are returned to the model as text instead of crashing the request.