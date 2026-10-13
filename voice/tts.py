import io
import subprocess
import tempfile
import wave
from pathlib import Path

from piper import PiperVoice, SynthesisConfig

MODEL_PATH = Path(__file__).resolve().parent.parent / "voices" / "fa_IR-amir-medium.onnx"
LENGTH_SCALE = 1.6


class Speaker:
    def __init__(self):
        self.voice = PiperVoice.load(str(MODEL_PATH))
        self.config = SynthesisConfig(length_scale=LENGTH_SCALE)

    def synthesize(self, text):
        """Return the spoken text as WAV bytes (used by the web UI)."""
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as f:
            self.voice.synthesize_wav(text, f, syn_config=self.config)
        return buffer.getvalue()

    def speak(self, text):
        """Play the spoken text on this machine (used by the terminal chat)."""
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            tmp.write(self.synthesize(text))
            tmp.flush()
            subprocess.run(["pw-play", tmp.name], check=False)
