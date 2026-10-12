
from datetime import date


def girl_day_greeting() -> str:
    """
    Check the laptop's local date and return a special message
    on the International Day of the Girl Child.
    """

    today = date.today()

    # International Day of the Girl Child: October 11
    if today.month == 10 and today.day == 11:
        return (
            "روز دختر بر تمام دختران شجاع سرزمینم ایران، "
            "که در ۱۸ و ۱۹ دی‌ماه خونین جانشان را از دست دادند، "
            "مبارک باد. "
            "یاد و نامشان برای همیشه زنده خواهد ماند."
        )

    return (
        "امروز روز جهانی دختر نیست؛ "
        "اما یاد و ارزش دختران شجاع سرزمینم همیشه زنده است."
    )
