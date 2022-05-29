from nacl.signing import VerifyKey
from solana.publickey import PublicKey
from base58 import b58decode
import hashlib 

def verify_signed_msg(msg, signed, publicKey):
    pubkey = bytes(PublicKey(publicKey))
    msg = bytes(msg, 'utf8')
    signed = bytes(signed)
    
    try:
        result = VerifyKey(
            pubkey
        ).verify(
            smessage=msg,  
            signature=signed
        )
        if(result == msg):
            return True
        else:
            return False
    except:
        return False

def pubkey_to_int(pubkey):
    result = int.from_bytes(b58decode(pubkey), byteorder='big')
    return result

def generate_match_id(pubkey1, pubkey2):
    h = hashlib.sha256(str(pubkey_to_int(pubkey2) + pubkey_to_int(pubkey1)).encode())
    return h.hexdigest()


    