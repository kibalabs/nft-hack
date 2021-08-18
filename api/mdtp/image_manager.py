import imghdr
import os
import uuid
from io import BytesIO
from typing import List
from typing import Optional

from core.exceptions import InternalServerErrorException
from core.exceptions import KibaException
from core.requester import Requester
from core.s3_manager import S3Manager
from core.util import file_util
from PIL import Image as PILImage

from mdtp.ipfs_manager import IpfsManager
from mdtp.model import ImageData
from mdtp.model import ImageFormat
from mdtp.model import ImageSize
from mdtp.model import ImageVariant

_BUCKET = 's3://mdtp-images/pablo'
_BASE_URL = 'https://d2a7i2107hou45.cloudfront.net/pablo'

_CACHE_CONTROL_FINAL_FILE = 'public,max-age=31536000'

_TARGET_SIZES = [10, 20, 50, 100, 200, 500, 1000]


class UnknownImageType(InternalServerErrorException):
    pass

class ImageManager:

    def __init__(self, requester: Requester, s3Manager: S3Manager, ipfsManager: IpfsManager):
        self.requester = requester
        self.s3Manager = s3Manager
        self.ipfsManager = ipfsManager

    @staticmethod
    def _get_image_type_from_file(fileName: str) -> str:
        imageType = imghdr.what(fileName)
        if not imageType:
            raise UnknownImageType
        return f'image/{imageType}'

    @staticmethod
    def _get_image_type(content: str) -> str:
        imageType = imghdr.what(content)
        if not imageType:
            raise UnknownImageType
        return f'image/{imageType}'

    async def upload_image_from_url(self, url: str) -> str:
        localFilePath = f'./download-{str(uuid.uuid4())}'
        if url.startswith('ipfs://'):
            await self.ipfsManager.read_file(cid=url.replace('ipfs://', ''), outputFilePath=localFilePath)
        else:
            await self.requester.get(url=url, outputFilePath=localFilePath)
        imageId = await self.upload_image_from_file(filePath=localFilePath)
        await file_util.remove_file(filePath=localFilePath)
        return imageId

    async def upload_image_from_file(self, filePath: str, shouldResize: bool = True) -> str:
        imageId = str(uuid.uuid4()).replace('-', '')
        # TODO(krishan711): save with extensions once implemented in pablo
        # mimetype = self._get_image_type_from_file(fileName=localFilePath)
        # extension = mimetypes.guess_extension(type=mimetype)
        await self.s3Manager.upload_file(filePath=filePath, targetPath=f'{_BUCKET}/{imageId}/original', accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
        if shouldResize:
            await self.resize_image(imageId=imageId)
        return imageId

    async def crop_image(self, imageId: str, outputDirectory: str, width: int, height: int) -> List[str]:
        await file_util.create_directory(directory=outputDirectory)
        # NOTE(krishan711): this can be done in parallel
        image = await self._load_image(imageId=imageId)
        targetSize = ImageSize(int(image.size.width / width), int(image.size.height / height))
        if image.imageFormat not in {ImageFormat.JPG, ImageFormat.PNG, ImageFormat.WEBP}:
            raise Exception(f'Unable to crop image of type {image.imageFormat}')
        contentBuffer = BytesIO(image.content)
        fileNames = []
        with PILImage.open(fp=contentBuffer) as pilImage:
            for row in range(0, height):
                for column in range(0, width):
                    index = (row * width) + column
                    fileName = f'{index}'
                    box = (column * targetSize.width, row * targetSize.height, (column + 1) * targetSize.width, (row + 1) * targetSize.height)
                    croppedPilImage = pilImage.crop(box)
                    content = BytesIO()
                    croppedPilImage.save(fp=content, format=image.imageFormat.replace('image/', ''))
                    croppedImage = ImageData(content=content.getvalue(), size=targetSize, imageFormat=image.imageFormat)
                    await self._save_image_to_file(image=croppedImage, fileName=os.path.join(outputDirectory, fileName))
                    fileNames.append(fileName)
        return fileNames

    async def resize_image(self, imageId: str):
        image = await self._load_image(imageId=imageId)
        for targetSize in _TARGET_SIZES:
            if image.size.width >= targetSize:
                resizedImage = await self._resize_image(image=image, size=ImageSize(width=targetSize, height=targetSize * (image.size.height / image.size.width)))
                resizedFilename = f'./resize-{str(uuid.uuid4())}'
                await self._save_image_to_file(image=resizedImage, fileName=resizedFilename)
                await self.s3Manager.upload_file(filePath=resizedFilename, targetPath=f'{_BUCKET}/{imageId}/widths/{targetSize}', accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
                await file_util.remove_file(filePath=resizedFilename)
            if image.size.height >= targetSize:
                resizedImage = await self._resize_image(image=image, size=ImageSize(width=targetSize * (image.size.width / image.size.height), height=targetSize))
                resizedFilename = f'./resize-{str(uuid.uuid4())}'
                await self._save_image_to_file(image=resizedImage, fileName=resizedFilename)
                await self.s3Manager.upload_file(filePath=resizedFilename, targetPath=f'{_BUCKET}/{imageId}/heights/{targetSize}', accessControl='public-read', cacheControl=_CACHE_CONTROL_FINAL_FILE)
                await file_util.remove_file(filePath=resizedFilename)

    async def _save_image_to_file(self, image: ImageData, fileName: str) -> None:
        if image.imageFormat == ImageFormat.JPG:
            contentBuffer = BytesIO(image.content)
            with PILImage.open(fp=contentBuffer) as pilImage, open(fileName, 'wb') as imageFile:
                try:
                    pilImage.save(fp=imageFile, format=image.imageFormat.replace('image/', ''), subsampling=0, quality=90, optimize=True)
                except OSError as exception:
                    raise KibaException(message=f'Exception occurred when saving image {image.imageId}: {str(exception)}') from exception
            return
        if image.imageFormat in {ImageFormat.PNG, ImageFormat.WEBP}:
            contentBuffer = BytesIO(image.content)
            with PILImage.open(fp=contentBuffer) as pilImage, open(fileName, 'wb') as imageFile:
                try:
                    pilImage.save(fp=imageFile, format=image.imageFormat.replace('image/', ''), optimize=True)
                except OSError as exception:
                    raise KibaException(message=f'Exception occurred when saving image {image.imageId}: {str(exception)}') from exception
            return
        raise KibaException(message=f'Cannot save image format to file: {image.imageFormat}')

    async def _resize_image(self, image: ImageData, size: ImageSize) -> ImageData:
        if image.imageFormat in {ImageFormat.JPG, ImageFormat.PNG, ImageFormat.WEBP}:
            contentBuffer = BytesIO(image.content)
            with PILImage.open(fp=contentBuffer) as pilImage:
                newPilImage = pilImage.resize(size=(size.width, size.height))
                content = BytesIO()
                newPilImage.save(fp=content, format=image.imageFormat.replace('image/', ''))
                return ImageData(content=content.getvalue(), size=size, imageFormat=image.imageFormat)
        raise KibaException(message=f'Cannot determine image size from image format: {image.imageFormat}')

    async def get_image_url(self, imageId: str, width: Optional[int] = None, height: Optional[int] = None) -> str:
        image = await self._load_image(imageId=imageId)
        imageVariants = await self._load_image_variants(imageId=imageId, image=image)
        if width is not None or height is not None:
            targetWidth = width or 0
            targetHeight = height or 0
            for imageVariant in imageVariants:
                if imageVariant.size.width >= targetWidth and imageVariant.size.height >= targetHeight:
                    return f'{_BASE_URL}/{imageVariant.imageId}/{imageVariant.variantId}'
        return f'{_BASE_URL}/{imageId}/original'

    @staticmethod
    def _get_image_size(content: str, imageFormat: str):
        if imageFormat in {ImageFormat.JPG, ImageFormat.PNG, ImageFormat.WEBP}:
            contentBuffer = BytesIO(content)
            with PILImage.open(fp=contentBuffer) as pilImage:
                size = ImageSize(width=pilImage.size[0], height=pilImage.size[1])
            return size
        raise KibaException(message=f'Cannot determine image size from image format: {imageFormat}')

    async def _load_image(self, imageId: str) -> ImageData:
        response = await self.requester.get(url=f'{_BASE_URL}/{imageId}/original')
        return self._load_image_from_content(content=response.content)

    async def _load_image_from_file(self, filePath: str) -> ImageData:
        content = await file_util.read_file(filePath=filePath)
        return self._load_image_from_content(content=content)

    def _load_image_from_content(self, content: str) -> ImageData:
        imageFormat = self._get_image_type(content=BytesIO(content))
        size = self._get_image_size(content=content, imageFormat=imageFormat)
        image = ImageData(content=content, size=size, imageFormat=imageFormat)
        return image

    # NOTE(krishan711): this needs the image because it uses the size. It can use imageId once its in a db
    @staticmethod
    async def _load_image_variants(imageId: str, image: ImageData) -> List[ImageVariant]:
        variants: List[ImageVariant] = []
        for targetSize in _TARGET_SIZES:
            if image.size.width >= targetSize:
                variants.append(ImageVariant(imageId=imageId, variantId=f'widths/{targetSize}', size=ImageSize(width=targetSize, height=targetSize * (image.size.height / image.size.width)), imageFormat=image.imageFormat))
            if image.size.height >= targetSize:
                variants.append(ImageVariant(imageId=imageId, variantId=f'heights/{targetSize}', size=ImageSize(height=targetSize, width=targetSize * (image.size.width / image.size.height)), imageFormat=image.imageFormat))
        variants.append(ImageVariant(imageId=imageId, variantId='original', size=image.size, imageFormat=image.imageFormat))
        variants = sorted(variants, key=lambda variant: variant.size.width * variant.size.height)
        return variants
