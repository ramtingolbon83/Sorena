# YALDA — AI Agent Status HUD

A responsive, single-page React/Vite HUD driven by a six-state agent state machine.

## Run locally

```bash
pnpm install
pnpm dev
```

The dev server runs on http://localhost:5173.

## Switch agent states

### JavaScript API

```js
window.yalda.setState("working");
window.yalda.getState();
```

Valid states: `idle`, `working`, `success`, `speaking`, `listening`, and `error`.

### URL hash

Open `/#state=listening` or change the hash while the page is open.

### `postMessage`

Both formats are accepted:

```js
window.postMessage({ type: "yalda:setState", state: "speaking" }, "*");
window.postMessage("error", "*");
```

### WebSocket

Connect directly:

```js
window.yalda.connectSocket("wss://example.com/agent-status");
```

Or provide the URL at load time: `/?ws=wss%3A%2F%2Fexample.com%2Fagent-status`.

Messages can be a plain state string or JSON:

```json
{ "state": "success" }
```

### Keyboard and debug controls

- Keys `1`–`6`: idle, working, success, speaking, listening, error
- Key `D`: toggle the manual state control bar

`success` automatically returns to `idle` after three seconds. `error` persists until explicitly changed.

## Assumptions

- The supplied eye references are used as optimized visual layers rather than attempting to approximate their plasma detail in a shader.
- The optional WebSocket is client-only and reconnect/error behavior is delegated to the integrating application.
- Motion uses simulated signal rhythms; no microphone permission is requested.
