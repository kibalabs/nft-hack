import logging
from typing import Dict

from mdtp.core.requester import Requester
from mdtp.core.exceptions import InternalServerErrorException

class ImageManager:

    def __init__(self, requester: Requester, sirvKey: str, sirvSecret: str):
        self.requester = requester
        self.sirvKey = sirvKey
        self.sirvSecret = sirvSecret

    async def _get_sirv_token(self) -> str:
        response = await self.requester.post_json(url='https://api.sirv.com/v2/token', dataDict={'clientId': self.sirvKey, 'clientSecret': self.sirvSecret})
        return response.json()['token']

    async def _make_post_request(self, dataDict: Dict, url: str) -> Dict:
        token = await self._get_sirv_token()
        response = await self.requester.post_json(url=url, dataDict=dataDict, headers={'authorization': f'Bearer {token}'})
        return response.json()

    async def upload_image_from_url(self, imageUrl: str, filePath: str) -> str:
        response = await self._make_post_request(url='https://api.sirv.com/v2/files/fetch', dataDict=[{'url': imageUrl, 'filename': filePath}])
        imageResponse = response[0]
        if not imageResponse['success']:
            logging.error(imageResponse)
            raise InternalServerErrorException(message=f'Failed to upload image')
        return f'https://kibalabs.sirv.com{filePath}'
