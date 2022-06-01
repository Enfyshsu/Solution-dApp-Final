from nacl.signing import VerifyKey
from solana.publickey import PublicKey
from base58 import b58decode
import hashlib 
import re
from solana_api import get_nfts_by_wallet, get_img_url

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

CREATOR = "J1BTsbeBNxX6GHZtN5QoukJRteai1KTsvc7LF994KGNT"

def get_valid_nft(pubkey):
    api_res = get_nfts_by_wallet(pubkey)
    res = None
    if api_res['status'] == 'success':
        metadatas = api_res['data']
        for metadata in metadatas:
            creators =  metadata['data']['creators']
            if len(creators) == 2 and creators[1]['address'] == CREATOR and creators[1]['verified'] == 1:
                res = metadata
                res['img_url'] = get_img_url(metadata['data']['uri'])
                nft_name = metadata['data']['name']
                res['level'] = int(re.compile(r'Lv(\d+)').search(nft_name).group(1))
                break

    return res
