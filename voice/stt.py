import numpy as np
import sounddevice as sd
from faster_whisper import WhisperModel

SAMPLE_RATE = 16000
MODEL_SIZE = "medium"


class Listener:
    def __init__(self):
        self.model = WhisperModel(MODEL_SIZE, device="cuda", compute_type="int8_float16")

    def transcribe(self, audio):
        """audio: a 16 kHz float32 numpy waveform, or a file path / file-like object (webm, ogg, wav...)."""
        segments, _ = self.model.transcribe(audio, language="fa", vad_filter=True)
        return " ".join(s.text for s in segments).strip()

    def listen(self):
        chunks = []

        def callback(indata, frames, time_info, status):
            chunks.append(indata.copy())

        with sd.InputStream(samplerate=SAMPLE_RATE, channels=1, dtype="float32", callback=callback):
            input("Listening... press Enter to stop.")

        if not chunks:
            return ""
        return self.transcribe(np.concatenate(chunks).flatten())
