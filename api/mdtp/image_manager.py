import logging
from typing import Dict
import mimetypes
import imghdr
from typing import Optional, List
import uuid
from io import BytesIO

from PIL import Image as PILImage

from mdtp.model import ImageFormat, ImageSize, Image, ImageVariant
from mdtp.core.requester import Requester
from mdtp.core.util import file_util
from mdtp.core.exceptions import InternalServerErrorException, KibaException, NotFoundException
from mdtp.core.s3_manager import S3Manager


_BUCKET = 's3://mdtp-images/pablo'
_BASE_URL = 'https://mdtp-images.s3-eu-west-1.amazonaws.com/pablo'

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
        # TODO(krishan711): save with extensions once implemented in pablo
        # mimetype = self._get_image_type(fileName=localFilePath)
        # extension = mimetypes.guess_extension(type=mimetype)
        filePath = f'{imageId}/original'
        await self.s3Manager.upload_file(filePath=localFilePath, targetPath=f'{_BUCKET}/{filePath}', accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
        # NOTE(krishan711): resizing below
        image = None
        imageSize = None
        for targetSize in _TARGET_SIZES:
            if imageSize.width >= targetSize:
                resizedImage = None
                resizedFilename = f'./tmp/{uuid.uuid4()}'
                await self._save_image_to_file(image=resizedImage, fileName=resizedFilename)
                await self.s3Manager.upload_file(filePath=resizedFilename, targetPath=f'{_BUCKET}/{filePath}/widths/{targetSize}', accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
            if imageSize.height >= targetSize:
                resizedImage = None
                resizedFilename = f'./tmp/{uuid.uuid4()}'
                await self._save_image_to_file(image=resizedImage, fileName=resizedFilename)
                await self.s3Manager.upload_file(filePath=resizedFilename, targetPath=f'{_BUCKET}/{filePath}/heights/{targetSize}', accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)

    async def get_image_url(self, imageId: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
        image = await self._load_image(imageId=imageId)
        if width is not None and height is not None:
            imageVariants = self._load_image_variants(image=image)
            print('imageVariants', imageVariants)
            targetWidth = width or 0
            targetHeight = height or 0
            for imageVariant in imageVariants:
                if imageVariant.size.width >= targetWidth and imageVariant.size.height >= targetHeight:
                    return f'{_BASE_URL}/{imageVariant.imageId}/{imageVariant.variantId}'
        return f'{_BASE_URL}/{imageId}/original'

    @staticmethod
    def get_size(content: str, imageFormat: str):
        if imageFormat in {ImageFormat.JPG, ImageFormat.PNG, ImageFormat.WEBP}:
            contentBuffer = BytesIO(content)
            with PILImage.open(fp=contentBuffer) as pilImage:
                size = ImageSize(width=pilImage.size[0], height=pilImage.size[1])
        else:
            raise KibaException(message=f'Unknown image format: {imageFormat}')
        return size

    async def _load_image(self, imageId: str) -> Image:
        content = await self.requester.get(url=f'{_BASE_URL}/{imageId}/original').content
        return self._load_image_from_content(imageId=imageId, content=content)

    async def _load_image_from_file(self, filePath: str) -> Image:
        content = await file_util.read_file(filePath=filePath)
        return self._load_image_from_content(content=content)

    def _load_image_from_content(self, imageId: str, content: str) -> Image:
        imageFormat = self._get_image_type(content=content)
        size = self._get_size(content=content, imageFormat=imageFormat)
        image = Image(imageId=imageId, content=content, size=size, imageFormat=imageFormat)
        return image

    # NOTE(krishan711): this needs the image because it uses the size. It can use imageId once its in a db
    def _load_image_variants(self, image: Image) -> List[ImageVariant]:
        variants = []
        for targetSize in _TARGET_SIZES:
            if image.size.width >= targetSize:
                variants.append(ImageVariant(imageId=image.imageId, variantId=f'widths/{targetSize}', size=ImageSize(width=targetSize, height=targetSize * (image.size.height / image.size.width))))
            if image.size.height >= targetSize:
                variants.append(ImageVariant(imageId=image.imageId, variantId=f'heights/{targetSize}', size=ImageSize(height=targetSize, width=targetSize * (image.size.width / image.size.height))))
        variants.append(ImageVariant(imageId=image.imageId, variantId='original', size=image.size))
        return variants
