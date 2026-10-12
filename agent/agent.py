import json

from models.client import ModelClient
from tools.registry import tool_registry

# Safety net: stop a model that keeps calling tools forever.
MAX_STEPS = 8


class Agent:
    def __init__(self):
        self.model = ModelClient()

    def chat(self, messages, tools, on_event=None):
        """Run the tool-calling loop.

        on_event (optional) receives dicts describing what the agent is doing:
          {"type": "tool_start", "tool": name, "arguments": {...}}
          {"type": "tool_end",   "tool": name, "arguments": {...}, "ok": bool, "result": str}
        The server uses it to push live state to the UI.
        """
        emit = on_event or (lambda event: None)

        for _ in range(MAX_STEPS):
            result = self.model.chat(messages, tools)
            message = result["choices"][0]["message"]

            tool_calls = message.get("tool_calls")
            if not tool_calls:
                return result

            messages.append(message)
            for tool_call in tool_calls:
                tool_name = tool_call["function"]["name"]
                arguments = {}
                try:
                    arguments = json.loads(tool_call["function"]["arguments"] or "{}")
                    emit({"type": "tool_start", "tool": tool_name, "arguments": arguments})
                    tool_result = tool_registry[tool_name](**arguments)
                    ok = True
                except Exception as exc:  # noqa: BLE001 - tool errors go back to the model
                    tool_result = f"Error: {type(exc).__name__}: {exc}"
                    ok = False

                emit(
                    {
                        "type": "tool_end",
                        "tool": tool_name,
                        "arguments": arguments,
                        "ok": ok,
                        "result": str(tool_result),
                    }
                )
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call["id"],
                        "content": str(tool_result),
                    }
                )

        raise RuntimeError(f"Agent stopped after {MAX_STEPS} tool-call rounds")