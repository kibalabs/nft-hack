import os
import shutil
from typing import Optional

import aiofiles
import aiofiles.os

async def remove_file(filePath: str):
    await aiofiles.os.remove(filePath)

async def remove_directory(directory: str):
    shutil.rmtree(directory)
    # TODO(krish): fix this to be async, command below doesn't work if the directory is not empty
    # await aiofiles.os.rmdir(directory)

def remove_file_sync(filePath: str):
    os.remove(filePath)

def remove_directory_sync(directory: str):
    shutil.rmtree(directory)

async def read_file(filePath: str) -> str:
    async with aiofiles.open(filePath, 'r') as file:
        return await file.read()

async def read_file_bytes(filePath: str) -> bytes:
    async with aiofiles.open(filePath, 'rb') as file:
        return await file.read()

def read_file_sync(filePath: str) -> str:
    with open(filePath, 'r') as file:
        return file.read()

def read_file_bytes_sync(filePath: str) -> bytes:
    with open(filePath, 'rb') as file:
        return file.read()

async def write_file(filePath: str, content: str, shouldRaiseIfFileExists: Optional[bool] = False):
    async with aiofiles.open(filePath, 'x' if shouldRaiseIfFileExists else 'w') as file:
        await file.write(content)

async def write_file_bytes(filePath: str, content: bytes, shouldRaiseIfFileExists: Optional[bool] = False):
    async with aiofiles.open(filePath, 'xb' if shouldRaiseIfFileExists else 'wb') as file:
        await file.write(content)

def write_file_sync(filePath: str, content: str, shouldRaiseIfFileExists: Optional[bool] = False):
    with open(filePath, 'x' if shouldRaiseIfFileExists else 'w') as file:
        file.write(content)

def write_file_bytes_sync(filePath: str, content: bytes, shouldRaiseIfFileExists: Optional[bool] = False):
    with open(filePath, 'xb' if shouldRaiseIfFileExists else 'wb') as file:
        file.write(content)
