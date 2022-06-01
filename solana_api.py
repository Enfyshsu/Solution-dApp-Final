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

def get_blockhash():
    response = requests.post( api_server + "/get_blockhash")
    return(response.json())

def get_raw_transaction(req):
    response = requests.get( api_server + "/get_raw_transaction", json = req)
    return(response.json())

def send_transaction(req):
    print(req)
    response = requests.post( api_server + "/send_transaction", json = req)
    return(response.json())

def get_img_url(uri):
    response = requests.get(uri)
    return(response.json()['image'])
