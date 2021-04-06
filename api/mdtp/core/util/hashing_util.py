import binascii
import hashlib

def sha512(value: str, salt: str = '', iterationCount: int = 1000) -> str:
    return binascii.hexlify(hashlib.pbkdf2_hmac(hash_name='sha512', password=value.encode(), salt=salt.encode(), iterations=iterationCount)).decode()
