import random
import string
from typing import Sequence

CHARACTERS_ALPHANUMERIC = string.digits + string.ascii_letters

def generate_random_string(length: int, characters: Sequence[str] = CHARACTERS_ALPHANUMERIC) -> str:
    return ''.join([random.choice(characters) for _ in range(length)])
