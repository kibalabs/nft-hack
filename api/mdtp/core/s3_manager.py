import dataclasses
import os
import logging
import random
import mimetypes
from string import ascii_letters
from typing import Optional
from typing import Dict
from typing import Tuple
from typing import Sequence

from mdtp.core.util import constants
from mdtp.core.util import file_util

@dataclasses.dataclass
class PresignedUploadField:
    name: str
    value: str

@dataclasses.dataclass
class S3PresignedUpload:
    url: str
    fields: Sequence[PresignedUploadField]

@dataclasses.dataclass
class S3File:
    bucket: str
    path: str

class S3Manager:

    def __init__(self, s3Client):
        self.s3Client = s3Client

    @staticmethod
    def _split_path_to_bucket_key(path: str) -> Tuple[str, str]:
        if path.startswith('s3://'):
            path = path[len('s3://'):]
        paths = path.split('/')
        return paths[0], '/'.join(paths[1:]) if len(paths) > 0 else ''

    def _get_extra_args(self, accessControl: Optional[str] = None, cacheControl: Optional[str] = None, contentType: Optional[str] = None, shouldUseAesEncryption: bool = False) -> Dict[str, str]:
        extraArgs = {}
        if accessControl is not None:
            extraArgs['ACL'] = accessControl
        if contentType:
            extraArgs['ContentType'] = contentType
        if cacheControl:
            extraArgs['CacheControl'] = cacheControl
        if shouldUseAesEncryption:
            extraArgs['ServerSideEncryption'] = 'AES256'
        return extraArgs

    def _generate_random_filename(self):
        return f'random_file_{"".join(random.choice(ascii_letters) for _ in range(20))}'

    async def write_file(self, content: bytes, targetPath: str, accessControl: Optional[str] = None, cacheControl: Optional[str] = None, contentType: Optional[str] = None) -> None:
        randomFilePath = self._generate_random_filename()
        await file_util.write_file_bytes(filePath=randomFilePath, content=content, shouldRaiseIfFileExists=True)
        await self.upload_file(filePath=randomFilePath, targetPath=targetPath, accessControl=accessControl, cacheControl=cacheControl, contentType=contentType)
        await file_util.remove_file(filePath=randomFilePath)

    async def read_file(self, sourcePath: str) -> bytes:
        randomFilePath = self._generate_random_filename()
        await self.download_file(filePath=randomFilePath, sourcePath=sourcePath)
        content = await file_util.read_file_bytes(filePath=randomFilePath)
        await file_util.remove_file(filePath=randomFilePath)
        return content

    async def upload_file(self, filePath: str, targetPath: str, accessControl: Optional[str] = None, cacheControl: Optional[str] = None, contentType: Optional[str] = None) -> None:
        targetBucket, targetKey = self._split_path_to_bucket_key(path=targetPath)
        extraArgs = self._get_extra_args(accessControl=accessControl, cacheControl=cacheControl, contentType=contentType or self._get_file_mimetype(fileName=targetKey))
        self.s3Client.upload_file(Filename=filePath, Bucket=targetBucket, Key=targetKey, ExtraArgs=extraArgs)

    async def download_file(self, sourcePath: str, filePath: str) -> None:
        sourceBucket, sourceKey = self._split_path_to_bucket_key(path=sourcePath)
        self.s3Client.download_file(Filename=filePath, Bucket=sourceBucket, Key=sourceKey)

    async def copy_file(self, source: str, target: str, accessControl: Optional[str] = None, cacheControl: Optional[str] = None, contentType: Optional[str] = None):
        logging.info(f'Copying file from {source} to {target}')
        sourceBucket, sourceKey = self._split_path_to_bucket_key(path=source)
        targetBucket, targetKey = self._split_path_to_bucket_key(path=target)
        extraArgs = self._get_extra_args(accessControl=accessControl, cacheControl=cacheControl, contentType=contentType or self._get_file_mimetype(fileName=targetKey))
        self.s3Client.copy_object(CopySource=dict(Bucket=sourceBucket, Key=sourceKey), Bucket=targetBucket, Key=targetKey, MetadataDirective='REPLACE', **extraArgs)

    async def delete_file(self, filePath: str):
        bucket, key = self._split_path_to_bucket_key(path=filePath)
        self.s3Client.delete_object(Bucket=bucket, Key=key)

    async def check_file_exists(self, filePath: str):
        bucket, key = self._split_path_to_bucket_key(path=filePath)
        self.s3Client.get_object(Bucket=bucket, Key=key)

    async def list_directory_files(self, s3Directory: str) -> Sequence[S3File]:
        return [s3File async for s3File in self.generate_directory_files(s3Directory=s3Directory)]

    async def generate_directory_files(self, s3Directory: str) -> Sequence[S3File]:
        bucket, prefix = self._split_path_to_bucket_key(path=s3Directory)
        prefix = prefix if prefix.endswith('/') else f'{prefix}/'
        continuationToken = None
        while True:
            if not continuationToken:
                response = self.s3Client.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=100)
            else:
                response = self.s3Client.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=100, ContinuationToken=continuationToken)
            for item in response.get('Contents', []):
                yield S3File(path=item['Key'], bucket=bucket)
            if not response['IsTruncated']:
                return
            continuationToken = response['NextContinuationToken']

    def _get_file_mimetype(self, fileName: str) -> str:
        mimetype, _ = mimetypes.guess_type(fileName)
        return mimetype

    async def copy_directory(self, source: str, target: str, accessControl: Optional[str] = None, cacheControl: Optional[str] = None):
        logging.info(f'Copying directory from {source} to {target}')
        sourceBucket, sourceKey = self._split_path_to_bucket_key(path=source)
        sourceKey = sourceKey if sourceKey.endswith('/') else f'{sourceKey}/'
        target = target.rstrip('/')
        async for s3File in self.generate_directory_files(s3Directory=source):
            filePathPart = s3File.path.replace(sourceKey, '', 1)
            await self.copy_file(source=f's3://{sourceBucket}/{s3File.path}', target=f'{target}/{filePathPart}', accessControl=accessControl, cacheControl=cacheControl)

    async def upload_directory(self, sourceDirectory: str, target: str, accessControl: Optional[str] = None, cacheControl: Optional[str] = None):
        logging.info(f'Uploading directory from {sourceDirectory} to {target}')
        sourceDirectory = sourceDirectory if sourceDirectory.endswith('/') else f'{sourceDirectory}/'
        targetBucket, targetKey = self._split_path_to_bucket_key(path=target)
        for root, _, files in os.walk(sourceDirectory):
            for filePath in files:
                localFilePath = os.path.join(root, filePath)
                targetKeyPath = f'{targetKey}/{localFilePath.replace(sourceDirectory, "", 1)}'
                await self.upload_file(filePath=localFilePath, targetPath=f's3://{targetBucket}/{targetKeyPath}', accessControl=accessControl, cacheControl=cacheControl)

    async def generate_presigned_upload(self, target: str, accessControl: Optional[str] = None, cacheControl: Optional[str] = None, timeLimit: int = 60, sizeLimit: int = constants._MEGABYTE) -> str:
        targetBucket, targetKey = self._split_path_to_bucket_key(path=target)
        # fields and conditions cannot be merged https://github.com/boto/boto3/issues/1103
        fields = {}
        conditions = [
            ['content-length-range', 1, sizeLimit],
            ['starts-with', '$Content-Type', ''],
        ]
        if accessControl:
            fields.update(self._get_extra_args(accessControl=accessControl))
            conditions.append(self._get_extra_args(accessControl=accessControl))
        if cacheControl:
            fields['Cache-Control'] = cacheControl
            conditions.append({'Cache-Control': cacheControl})
        response = self.s3Client.generate_presigned_post(Bucket=targetBucket, Key=targetKey, Fields=fields, Conditions=conditions, ExpiresIn=timeLimit)
        return S3PresignedUpload(url=response['url'], fields=[PresignedUploadField(name=name, value=value) for name, value in response['fields'].items()])
