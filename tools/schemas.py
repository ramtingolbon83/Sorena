tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Get the current local time.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add",
            "description": "Add two numbers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "a": {
                        "type": "number",
                        "description": "The first number.",
                    },
                    "b": {
                        "type": "number",
                        "description": "The second number.",
                    },
                },
                "required": ["a", "b"],
            },
        },
    },
    
{
    "type": "function",
    "function": {
        "name": "girl_day_greeting",
        "description": (
            "Check the laptop's current local date. "
            "If today is October 11, return a special Persian "
            "message honoring the brave Iranian girls who lost "
            "their lives on the tragic 18th and 19th of Dey. "
            "Otherwise, return a message stating that today is "
            "not the International Day of the Girl Child. "
            "Call this tool whenever the user asks for the "
            "International Day of the Girl Child greeting."
        ),
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
},

]
