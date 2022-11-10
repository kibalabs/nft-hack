import json
from typing import Dict

from core.exceptions import InternalServerErrorException
from core.requester import FileContent
from core.requester import Requester


class IpfsManager:

    def __init__(self, infuraRequester: Requester):
        self.infuraRequester = infuraRequester

    async def upload_file_to_ipfs(self, fileContent: FileContent) -> str:
        response = await self.infuraRequester.post_form(url='https://ipfs.infura.io:5001/api/v0/add', formDataDict={'file': fileContent}, timeout=300)
        responseDict = json.loads(response.text)
        return responseDict["Hash"]

    async def upload_files_to_ipfs(self, fileContentMap: Dict[str, FileContent]) -> str:
        response = await self.infuraRequester.post_form(url='https://ipfs.infura.io:5001/api/v0/add?wrap-with-directory=true', formDataDict=fileContentMap, timeout=len(fileContentMap) * 10)
        outputLines = response.text.strip().split('\n')
        for outputLine in outputLines:
            if not outputLine:
                break
            output = json.loads(outputLine)
            if output['Name'] == '':
                return output['Hash']
        raise InternalServerErrorException('Failed to find root hash in IPFS response')

    async def pin_cid(self, cid: str) -> None:
        await self.infuraRequester.post_json(url=f'https://ipfs.infura.io:5001/api/v0/pin/addarg={cid}&recursive=true')
