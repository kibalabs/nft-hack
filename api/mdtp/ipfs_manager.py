import json
from typing import Dict
from typing import Optional

from core.requester import FileContent
from core.requester import KibaResponse
from core.requester import Requester


class IpfsManager:

    def __init__(self, requester: Requester):
        self.requester = requester

    async def read_file(self, cid: str, outputFilePath: Optional[str] = None) -> KibaResponse:
        response = await self.requester.post(url=f'https://ipfs.infura.io:5001/api/v0/cat?arg={cid}', outputFilePath=outputFilePath)
        return response

    async def upload_file_to_ipfs(self, fileContent: FileContent) -> str:
        response = await self.requester.post_form(url='https://ipfs.infura.io:5001/api/v0/add?pin=true', formDataDict={'file': fileContent}, timeout=60)
        repsonseDict = json.loads(response.text)
        return repsonseDict["Hash"]

    async def upload_files_to_ipfs(self, fileContentMap: Dict[str, FileContent]) -> str:
        # NOTE(krishan711): pinning straight away seems to fail so this uploads first and then pins separately
        response = await self.requester.post_form(url='https://ipfs.infura.io:5001/api/v0/add?wrap-with-directory=true&silent=true&pin=false', formDataDict=fileContentMap, timeout=len(fileContentMap) * 10)
        allUploadDicts = []
        for line in response.text.split('\n'):
            if line:
                allUploadDicts.append(json.loads(line))
        directoryUploadDict = next((uploadDict for uploadDict in allUploadDicts if uploadDict['Name'] == ''), None)
        if not directoryUploadDict:
            raise Exception(f'Failed to find directory upload: {response.text}')
        cid = directoryUploadDict["Hash"]
        await self.requester.post(url=f'https://ipfs.infura.io:5001/api/v0/pin/add?arg={cid}', timeout=len(fileContentMap) * 10)
        return cid
