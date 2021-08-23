from __future__ import annotations


class Header:
    _ALLOW_MANY = False
    _VALUE_DELIMITER = '='
    _MANY_DELIMITER = ','

    def __init__(self, key: str) -> None:
        self._key = key

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
    KEY = 'cache_control'

    class Param:
        NO_CACHE = 'no-cache'
        NO_STORE = 'no-store'
        MAX_AGE = 'max-age'
        PRIVATE = 'private'
        PUBLIC = 'public'

    def __init__(self, param: str, value: Union[None, int, str] = None) -> None:
        super().__init__(key=self.KEY)
        self.param = param
        self.value = value

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
    KEY = 'cache_control'

    class Param:
        NO_CACHE = 'no-cache'
        NO_STORE = 'no-store'
        MAX_AGE = 'max-age'
        PRIVATE = 'private'
        PUBLIC = 'public'

    should_not_cache: bool = False
    should_not_store: bool = False
    should_cache_publically: bool = False
    should_cache_privately: bool = False
    max_age: int = None

    def __init__(self, should_not_cache: bool = False, should_not_store: bool = False, should_cache_publically: bool = False, should_cache_privately: bool = False, max_age: int = None) -> None:
        super().__init__(key=self.KEY)
        self.should_not_cache = should_not_cache
        self.should_not_store = should_not_store
        self.should_cache_publically = should_cache_publically
        self.should_cache_privately = should_cache_privately
        self.max_age = max_age

    def to_value_string(self) -> str:
        valueStringParts = []
        if self.should_not_cache:
            valueStringParts.append(self.Param.NO_CACHE)
        if self.should_not_store:
            valueStringParts.append(self.Param.NO_STORE)
        if self.should_cache_privately:
            valueStringParts.append(self.Param.PRIVATE)
        if self.should_cache_publically:
            valueStringParts.append(self.Param.PUBLIC)
        if self.max_age:
            valueStringParts.append(self._VALUE_DELIMITER.join([self.Param.MAX_AGE, str(self.max_age)]))
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
