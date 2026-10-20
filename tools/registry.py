from tools.calculator import add
from tools.clock import get_current_time
from tools.girl_day import girl_day_greeting
from tools.music import play_favorite_song, stop_music

tool_registry = {
    "get_current_time": get_current_time,
    "add": add,
    "girl_day_greeting": girl_day_greeting,
    "play_favorite_song": play_favorite_song,
    "stop_music": stop_music,
}
