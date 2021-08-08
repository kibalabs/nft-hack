import json

from typing import Dict
from core.requester import FileContent, Requester


class IpfsManager:

    def __init__(self, requester: Requester):
        self.requester = requester

    async def upload_file_to_ipfs(self, fileContent: FileContent) -> str:
        response = await self.requester.post_form(url='https://ipfs.infura.io:5001/api/v0/add?pin=true', formDataDict={'file': fileContent}, timeout=60)
        repsonseDict = json.loads(response.text)
        return repsonseDict["Hash"]


    async def upload_files_to_ipfs(self, fileContentMap: Dict[str, FileContent]) -> str:
        response = await self.requester.post_form(url='https://ipfs.infura.io:5001/api/v0/add?wrap-with-directory=true&silent=true&pin=false', formDataDict=fileContentMap, timeout=600)
        allUploadDicts = []
        for line in response.text.split('\n'):
            if line:
                allUploadDicts.append(json.loads(line))
        directoryUploadDict = next((uploadDict for uploadDict in allUploadDicts if uploadDict['Name'] == ''), None)
        if not directoryUploadDict:
            raise Exception(f'Failed to find directory upload: {response.text}')
        return directoryUploadDict["Hash"]
