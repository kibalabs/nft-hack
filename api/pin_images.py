import json
import os

import asyncclick as click
from core import logging
from core.requester import Requester

from mdtp.ipfs_manager import IpfsManager


cids = [
    'QmNd18v6domwX1wR7gqq5TSHAsoFdTfZnpEnaJKWPHN9Yc',
]

@click.command()
async def run():
    pinataApiKey = os.environ['PINATA_API_KEY']
    pinataRequester = Requester(headers={'Authorization': f'Bearer {pinataApiKey}'})
    ipfsManager = IpfsManager(pinataRequester=pinataRequester)

    metadata2OutputDirectory = 'output/metadatas'
    metadata1OutputDirectory = 'output/metadatas-v1'

    image2OutputDirectory = 'output/images'
    image2FrameDirectory = 'output/frames'
    image1OutputDirectory = 'output/images-v1'

    # for filename in sorted(os.listdir(metadata2OutputDirectory)):
    #     print(filename)
    #     if not filename.endswith('.json'):
    #         continue
    #     with open(os.path.join(metadata2OutputDirectory, filename)) as metadataFile:
    #         metadata = json.loads(metadataFile.read())
    # #     await ipfsManager.pin_cid(hash=metadata['image'].replace('ipfs://', ''))
    # #     await ipfsManager.pin_cid(hash=metadata['frameImage'].replace('ipfs://', ''))
    #     with open(os.path.join(image2OutputDirectory, f'{metadata["tokenId"]}.png'), 'rb') as imageFile:
    #         cid = await ipfsManager.upload_file_to_ipfs(fileContent=imageFile)
    #     print(cid)
    #     with open(os.path.join(image2FrameDirectory, f'{metadata["tokenId"]}.png'), 'rb') as imageFile:
    #         cid = await ipfsManager.upload_file_to_ipfs(fileContent=imageFile)
    #     print(cid)
    for filename in sorted(os.listdir(metadata1OutputDirectory)):
        print(filename)
        if not filename.endswith('.json'):
            continue
        with open(os.path.join(metadata1OutputDirectory, filename)) as metadataFile:
            metadata = json.loads(metadataFile.read())
    #     await ipfsManager.pin_cid(hash=metadata['image'].replace('ipfs://', ''))
    #     if metadata['frameImage']:
    #         await ipfsManager.pin_cid(hash=metadata['frameImage'].replace('ipfs://', ''))
        with open(os.path.join(image1OutputDirectory, f'{metadata["tokenId"]}.png'), 'rb') as imageFile:
            cid = await ipfsManager.upload_file_to_ipfs(fileContent=imageFile)
        print(cid)

    # image2OutputDirectory = 'output/images'
    # for filename in os.listdir(image2OutputDirectory):
    #     print(filename)
    #     if not filename.endswith('.png'):
    #         continue
    #     with open(os.path.join(image2OutputDirectory, filename), 'rb') as imageFile:
    #         cid = await ipfsManager.upload_file_to_ipfs(fileContent=imageFile)
    #     print(cid)

    # for cid in cids:
    #     print(cid)
    #     await ipfsManager.pin_cid(cid=cid)

    await pinataRequester.close_connections()

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    run(_anyio_backend='asyncio')
