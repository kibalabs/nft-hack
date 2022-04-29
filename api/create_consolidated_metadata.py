import json
import os
from typing import Optional

import asyncclick as click
from core import logging


@click.command()
@click.option('-d', '--metadata-directory', 'metadataDirectory', required=True, type=str)
@click.option('-o', '--output-filename', 'outputFilename', required=False, type=str)
async def run(metadataDirectory: str, outputFilename: Optional[str]):
    outputFilename = outputFilename or 'metadata_consolidated.json'
    output = []
    for file in os.listdir(metadataDirectory):
        if not file.endswith('.json'):
            continue
        if not os.path.isfile(os.path.join(metadataDirectory, file)):
            continue
        with open(os.path.join(metadataDirectory, file), 'r') as metadataFile:
            output.append(json.loads(metadataFile.read()))
    with open(outputFilename, 'w') as outputFile:
        outputFile.write(json.dumps(output))

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
