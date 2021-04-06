from typing import List
from typing import Iterator

# TODO(krishan711): make this generic
def generate_chunks(lst: List, chunkSize: int) -> Iterator[List]:
    for index in range(0, len(lst), chunkSize):
        yield lst[index: index + chunkSize]
