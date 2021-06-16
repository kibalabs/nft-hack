import os
import logging
import uuid

import asyncclick as click
import boto3
from core.s3_manager import S3Manager

from crop_image import crop_image

@click.command()
@click.option('-i', '--image-path', 'imagePath', required=True, type=str)
async def run(imagePath: str):
    s3Client = boto3.client(service_name='s3', region_name='eu-west-1', aws_access_key_id=os.environ['AWS_KEY'], aws_secret_access_key=os.environ['AWS_SECRET'])
    s3Manager = S3Manager(s3Client=s3Client)
    runId = str(uuid.uuid4())
    uploadPath = f's3://mdtp-images/uploads/{runId}'
    outputDirectory = 'output'
    crop_image(imagePath=imagePath, outputDirectory=outputDirectory, height=100, width=100)
    await s3Manager.upload_directory(sourceDirectory=outputDirectory, target=uploadPath, accessControl='public-read', cacheControl='public,max-age=31536000')
    logging.info(f'Uploaded to {uploadPath}')


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
