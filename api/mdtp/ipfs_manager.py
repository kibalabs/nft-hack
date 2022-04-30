import json
from typing import Dict

from core.requester import FileContent
from core.requester import Requester


class IpfsManager:

    def __init__(self, pinataRequester: Requester):
        self.pinataRequester = pinataRequester

    async def upload_file_to_ipfs(self, fileContent: FileContent) -> str:
        response = await self.pinataRequester.post_form(url='https://api.pinata.cloud/pinning/pinFileToIPFS', formDataDict={'file': fileContent}, timeout=60)
        repsonseDict = json.loads(response.text)
        return repsonseDict["IpfsHash"]

    async def upload_files_to_ipfs(self, fileContentMap: Dict[str, FileContent]) -> str:
        # NOTE(krishan711): we need the leading underscore so everything is treated as one directory rather than individual files (pinata quirk)
        pinataFiles = [('file', (f'_/{filename}', value)) for filename, value in fileContentMap.items()]
        response = await self.pinataRequester.post_form(url='https://api.pinata.cloud/pinning/pinFileToIPFS', formDataDict={'a': 'b'}, formFiles=pinataFiles, timeout=len(fileContentMap) * 10)
        repsonseDict = json.loads(response.text)
        return repsonseDict["IpfsHash"]

    async def pin_cid(self, cid: str) -> None:
        await self.pinataRequester.post_json(url='https://api.pinata.cloud/pinning/pinByHash', dataDict={'hashToPin': cid})
