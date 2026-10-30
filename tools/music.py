import shutil
import subprocess
from pathlib import Path

FAVORITE_SONG = Path("/home/ramtin/Music/_Unknown Artist - Asemoon Maste Jononi - 320.mp3").expanduser()

_player: subprocess.Popen | None = None


def _is_playing() -> bool:
    return _player is not None and _player.poll() is None


def play_favorite_song() -> str:
    global _player
    if _is_playing():
        return "آهنگ همین الان در حال پخشه."
    if not FAVORITE_SONG.is_file():
        return f"فایل آهنگ پیدا نشد: {FAVORITE_SONG}"
    mpv = shutil.which("mpv")
    if mpv is None:
        return "پخش‌کننده‌ی mpv نصب نیست."
    _player = subprocess.Popen(
        [mpv, "--no-video", "--really-quiet", str(FAVORITE_SONG)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return f"آهنگ {FAVORITE_SONG.stem} شروع شد."


def stop_music() -> str:
    global _player
    if not _is_playing():
        return "الان آهنگی پخش نمی‌شه."
    _player.terminate()
    _player = None
    return "آهنگ متوقف شد."
