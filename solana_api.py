from solana.rpc.types import TokenAccountOpts
from solana.rpc.api import Client
from solana.publickey import PublicKey
import requests

api_server = 'http://140.112.91.208:5487'

def get_nfts_by_wallet(pubkey):
    response = requests.get( api_server + "/get_nfts_by_wallet",
        params={
            'wallet_pubkey': pubkey
        }
    )
    return(response.json())

def get_transation_message():
    response = requests.get( api_server + "/get_transation_message")
    print(response)
    return(response.json())

def get_img_url(uri):
    response = requests.get(uri)
    return(response.json()['image'])
