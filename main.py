from agent.agent import Agent
from agent.persona import SYSTEM_PROMPT
from tools.schemas import tools
from voice.stt import Listener
from voice.tts import Speaker

agent = Agent()
speaker = Speaker()
listener = Listener()
messages = [{"role": "system", "content": SYSTEM_PROMPT}]

while True:
    user_message = input("You (Enter = speak): ").strip()
    if user_message == "":
        user_message = listener.listen()
        if not user_message:
            continue
        print(f"You (voice): {user_message}")

    if user_message.lower() == "exit":
        print("Good bye!")
        break
    messages.append({"role": "user", "content": user_message})

    result = agent.chat(messages, tools)
    answer = result["choices"][0]["message"]["content"]
    messages.append({"role": "assistant", "content": answer})
    print(f"AI: {answer}")
    if answer:
        speaker.speak(answer)
