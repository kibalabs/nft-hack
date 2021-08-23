import dataclasses
from __future__ import annotations


@dataclasses.dataclass
class Header:
    _ALLOW_MANY = False
    _VALUE_DELIMITER = '='
    _MANY_DELIMITER = ','

    _key: str

    @property
    def key(self) -> str:
        return self._key

    def to_value_string(self) -> str:
        raise NotImplementedError()

    @classmethod
    def from_value_string(cls, stringValue: str) -> Header:
        raise NotImplementedError()

    @classmethod
    def _string_to_parts(cls, stringValue: str) -> Mapping[Optional[str], Optional[str]]:
        parts = [part.strip() for part in stringValue.split(cls._VALUE_DELIMITER)]
        param = parts[0] if len(parts) > 0 else None
        value = parts[1] if len(parts) > 1 else None
        return { param: value }


from typing import Mapping, Optional, Union
from typing import cast

class CacheControlSingleHeader(Header):
    _ALLOW_MANY = True

    class Key:
        NO_CACHE = 'no-cache'
        NO_STORE = 'no-store'
        MAX_AGE = 'max-age'
        PRIVATE = 'private'
        PUBLIC = 'public'

    _key = 'cache_control'
    param: str
    value: Union[None, int, str] = None

    def to_value_string(self) -> str:
        return f'{self.param}={self.value}' if self.value is not None else self.param

    @classmethod
    def from_header_value(cls, stringValue: str) -> CacheControlHeader:
        parts = cls._string_to_parts(stringValue=stringValue)
        param = cast(str, next(iter(parts.keys())))
        value = parts[param]
        numericValue = None
        if value is not None:
            try:
                numericValue = int(float(value))
            except ValueError:
                pass
        return cls(param=param, value=numericValue or value)


class CacheControlHeader(Header):
    _ALLOW_MANY = True

    class Key:
        NO_CACHE = 'no-cache'
        NO_STORE = 'no-store'
        MAX_AGE = 'max-age'
        PRIVATE = 'private'
        PUBLIC = 'public'

    _key = 'cache_control'
    should_not_cache: bool = False
    should_not_store: bool = False
    should_cache_publically: bool = False
    should_cache_privately: bool = False
    max_age: int = None

    def to_value_string(self) -> str:
        valueStringParts = []
        if self.should_not_cache:
            valueStringParts.append(self.Key.NO_CACHE)
        if self.should_not_store:
            valueStringParts.append(self.Key.NO_STORE)
        if self.should_cache_privately:
            valueStringParts.append(self.Key.PRIVATE)
        if self.should_cache_publically:
            valueStringParts.append(self.Key.PUBLIC)
        if self.max_age:
            valueStringParts.append(self._VALUE_DELIMITER.join(self.Key.MAX_AGE, self.max_age))
        return self._MANY_DELIMITER.join(valueStringParts)

    @classmethod
    def from_header_value(cls, stringValue: str) -> CacheControlHeader:
        parts = cls._string_to_parts(stringValue=stringValue)
        param = cast(str, next(iter(parts.keys())))
        value = parts[param]
        numericValue = None
        if value is not None:
            try:
                numericValue = int(float(value))
            except ValueError:
                pass
        return cls(param=param, value=numericValue or value)
