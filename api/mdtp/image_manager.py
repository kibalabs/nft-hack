import logging
from typing import Dict
import mimetypes
import imghdr
from typing import Optional
import uuid

from mdtp.core.requester import Requester
from mdtp.core.exceptions import KibaException
from mdtp.core.exceptions import InternalServerErrorException
from mdtp.core.s3_manager import S3Manager


_BUCKET = 's3://mdtp-images/pablo'
_CACHE_CONTROL_TEMPORARY_FILE = 'public,max-age=1'
_CACHE_CONTROL_FINAL_FILE = 'public,max-age=31536000'

_TARGET_SIZES = [10, 20, 50, 100, 200, 500, 1000]


class UnknownImageType(InternalServerErrorException):
    pass

class ImageManager:

    def __init__(self, requester: Requester, s3Manager: S3Manager, sirvKey: str, sirvSecret: str):
        self.requester = requester
        self.s3Manager = s3Manager
        self.sirvKey = sirvKey
        self.sirvSecret = sirvSecret

    async def _get_sirv_token(self) -> str:
        response = await self.requester.post_json(url='https://api.sirv.com/v2/token', dataDict={'clientId': self.sirvKey, 'clientSecret': self.sirvSecret})
        return response.json()['token']

    async def _make_post_request(self, dataDict: Dict, url: str) -> Dict:
        token = await self._get_sirv_token()
        response = await self.requester.post_json(url=url, dataDict=dataDict, headers={'authorization': f'Bearer {token}'})
        return response.json()

    def _get_image_type(self, fileName: str) -> str:
        imageType = imghdr.what(fileName)
        if not imageType:
            raise UnknownImageType
        return f'image/{imageType}'

    async def upload_image_from_url(self, imageUrl: str) -> str:
        # response = await self._make_post_request(url='https://api.sirv.com/v2/files/fetch', dataDict=[{'url': imageUrl, 'filename': filePath}])
        # imageResponse = response[0]
        # if not imageResponse['success']:
        #     logging.error(imageResponse)
        #     raise InternalServerErrorException(message=f'Failed to upload image')
        # return f'https://kibalabs.sirv.com{filePath}'
        imageId = str(uuid.uuid4()).replace('-', '')
        localFilePath = f'./tmp/{imageId}/download'
        await self.requester.get(url=imageUrl, outputFilePath=localFilePath)
        mimetype = self._get_image_type(fileName=localFilePath)
        extension = mimetypes.guess_extension(type=mimetype)
        filePath = f'{imageId}/original{extension}'
        await self.s3Manager.upload_file(filePath=localFilePath, targetPath=f'{_BUCKET}/{filePath}', accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
        # NOTE(krishan711): resizing below
        


    async def get_image_url(self, imageId: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
        # FUTURE(krishan711): read sizes from a metadata database
        pass
