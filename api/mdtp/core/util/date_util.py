import datetime
from typing import Optional

JSON_DATE_FORMAT = '%Y-%m-%dT%H:%M:%S.%f'

def start_of_day(dt: Optional[datetime.datetime] = None) -> datetime.datetime:
    dt = dt if dt is not None else datetime.datetime.utcnow()
    return dt.replace(hour=0, minute=0, second=0, microsecond=0)

def datetime_from_datetime(dt: datetime.datetime, days: int = 0, seconds: float = 0, milliseconds: int = 0, minutes: int = 0, hours: int = 0, weeks: int = 0) -> datetime.datetime:
    return dt + datetime.timedelta(days=days, seconds=seconds, milliseconds=milliseconds, minutes=minutes, hours=hours, weeks=weeks)

def datetime_from_now(days: int = 0, seconds: float = 0, milliseconds: int = 0, minutes: int = 0, hours: int = 0, weeks: int = 0) -> datetime.datetime:
    return datetime_from_datetime(dt=datetime.datetime.utcnow(), days=days, seconds=seconds, milliseconds=milliseconds, minutes=minutes, hours=hours, weeks=weeks)

def datetime_from_string(dateString: str, dateFormat: str = JSON_DATE_FORMAT) -> datetime.datetime:
    try:
        dt = datetime.datetime.strptime(dateString, dateFormat)
    except (TypeError, ValueError):
        raise DateConversionException(message=f'Invalid dateString passed to datetime_from_string: {dateString}')
    return dt

def datetime_to_string(dt: datetime.datetime, dateFormat: str = JSON_DATE_FORMAT) -> str:
    return dt.strftime(dateFormat)
