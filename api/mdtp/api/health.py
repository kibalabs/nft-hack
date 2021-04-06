import os

from mdtp.core.kiba_router import KibaRouter

def create_api() -> KibaRouter:
    router = KibaRouter()

    @router.get('/')
    async def root():
        return {'server': os.environ.get('NAME'), 'version': os.environ.get('VERSION')}

    return router
