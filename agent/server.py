"""SORENA backend service.

  GET  /api/tools   -> the agent's tools (from schemas.py), flagged if missing in tool_registry
  POST /api/chat    -> run the agent for one user message (history kept per session_id)
  WS   /ws          -> live events for the HUD: {"event": "state", "state": "working"}, tool_start, tool_end

Run:  uvicorn server:app --reload --port 8000
"""

import asyncio
import base64
import io
import uuid
import wave
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agent.agent import Agent
from agent.persona import SYSTEM_PROMPT
from tools.registry import tool_registry
from tools.schemas import tools as tool_schemas
from voice.stt import Listener
from voice.tts import Speaker


class Hub:
    """Keeps the HUD clients connected and tracks the current agent state."""

    def __init__(self):
        self.clients: set[WebSocket] = set()
        self.state = "idle"
        self.gen = 0  # bumped on every chat; stale background transitions check it

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.clients.add(ws)
        await ws.send_json({"event": "hello", "state": self.state})

    def disconnect(self, ws: WebSocket):
        self.clients.discard(ws)

    async def broadcast(self, payload: dict):
        for ws in self.clients.copy():  # copy: clients are removed while looping
            try:
                await ws.send_json(payload)
            except Exception:  # noqa: BLE001 - any send failure means the client is gone
                self.clients.discard(ws)

    async def set_state(self, state: str, **extra):
        self.state = state
        await self.broadcast({"event": "state", "state": state, **extra})


hub = Hub()
agent = Agent()
sessions: dict[str, list[dict]] = {}
background: set[asyncio.Task] = set()


@lru_cache(maxsize=1)
def get_listener() -> Listener:
    """Whisper is loaded on the first voice request (~1 GB VRAM), not at server start."""
    return Listener()


@lru_cache(maxsize=1)
def get_speaker() -> Speaker:
    """The Piper voice is loaded on the first spoken reply."""
    return Speaker()


def wav_seconds(wav: bytes) -> float:
    with wave.open(io.BytesIO(wav), "rb") as clip:
        return clip.getnframes() / clip.getframerate()


app = FastAPI(title="SORENA agent service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    voice: bool = False  # the text came from the microphone
    speak: bool = False


@app.get("/api/health")
def health():
    return {"ok": True, "state": hub.state}


@app.get("/api/tools")
def list_tools():
    items = []
    for tool in tool_schemas:
        fn = tool["function"]
        items.append(
            {
                "name": fn["name"],
                "description": fn.get("description", ""),
                "parameters": fn.get("parameters", {}),
                # False = schema exists but there is no implementation in tool_registry
                "registered": fn["name"] in tool_registry,
            }
        )
    return items


@app.post(
    "/api/stt",
    responses={
        400: {"description": "Empty audio"},
        502: {"description": "Transcription failed"},
    },
)
async def speech_to_text(request: Request):
    """Raw audio in the request body (webm/ogg/wav...) -> {"text": ...} via Whisper."""
    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="Empty audio")

    hub.gen += (
        1  # cancels a pending speaking -> success transition from the previous reply
    )
    await hub.set_state("working", message="transcribing")
    try:
        text = await run_in_threadpool(get_listener().transcribe, io.BytesIO(data))
    except Exception as exc:
        await hub.set_state("error", message=str(exc))
        raise HTTPException(
            status_code=502, detail=f"Transcription failed: {exc}"
        ) from exc
    return {"text": text}


@app.post("/api/listening")
async def listening():
    """The HUD started recording: cancel pending transitions and show the listening state."""
    hub.gen += 1
    await hub.set_state("listening")
    return {"ok": True}


async def _finish(gen: int, speaking_seconds: float):
    """speaking -> success -> (UI returns to idle by itself after 3 s)."""
    await asyncio.sleep(speaking_seconds)
    if hub.gen != gen:
        return
    await hub.set_state("success")
    await asyncio.sleep(3.2)
    if hub.gen == gen:
        hub.state = "idle"


@app.post(
    "/api/chat",
    responses={
        400: {"description": "Empty message"},
        502: {"description": "The agent or the model server failed"},
    },
)
async def chat(req: ChatRequest):
    text = req.message.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    session_id = req.session_id or uuid.uuid4().hex
    history = sessions.setdefault(
        session_id, [{"role": "system", "content": SYSTEM_PROMPT}]
    )
    start = len(history)  # rollback point if the agent fails
    history.append({"role": "user", "content": text})

    hub.gen += 1
    gen = hub.gen
    loop = asyncio.get_running_loop()
    tool_calls: list[dict] = []

    def on_event(event: dict):
        # called from the worker thread that runs the agent
        payload = dict(event)
        payload["event"] = payload.pop("type")
        if payload["event"] == "tool_end":
            tool_calls.append(
                {k: payload[k] for k in ("tool", "arguments", "ok", "result")}
            )
        asyncio.run_coroutine_threadsafe(hub.broadcast(payload), loop)

    if not req.voice:  # a voice message already showed "listening" while recording
        await hub.set_state("listening")
    await asyncio.sleep(0.6)
    await hub.set_state("working")

    try:
        result = await run_in_threadpool(agent.chat, history, tool_schemas, on_event)
    except Exception as exc:
        del history[start:]
        await hub.set_state("error", message=str(exc))
        raise HTTPException(status_code=502, detail=f"Agent failed: {exc}") from exc

    message = result["choices"][0]["message"]
    reply = message.get("content") or ""
    history.append(message)

    audio = None
    speaking_seconds = max(1.5, min(8.0, len(reply) / 14))
    if req.speak and reply:
        try:
            wav = await run_in_threadpool(get_speaker().synthesize, reply)
            audio = base64.b64encode(wav).decode("ascii")
            speaking_seconds = (
                wav_seconds(wav) + 0.4
            )  # the browser starts playback slightly later
        except Exception:  # noqa: BLE001 - a TTS failure must not lose the text reply
            audio = None

    await hub.set_state("speaking")
    task = asyncio.create_task(_finish(gen, speaking_seconds))
    background.add(task)
    task.add_done_callback(background.discard)

    return {
        "session_id": session_id,
        "reply": reply,
        "tool_calls": tool_calls,
        "audio": audio,  # base64 WAV, or None
    }


@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await hub.connect(ws)
    try:
        while True:
            await ws.receive_text()  # the HUD only listens; this detects disconnects
    except WebSocketDisconnect:
        pass
    finally:
        hub.disconnect(ws)
