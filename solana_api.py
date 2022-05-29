from solana.rpc.types import TokenAccountOpts
from solana.rpc.api import Client
from solana.publickey import PublicKey


opts = TokenAccountOpts(program_id='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' ,encoding="jsonParsed")

def test():
    solana_client = Client("https://api.devnet.solana.com")
    res = solana_client.get_token_accounts_by_owner(PublicKey("Hv8JqkWC8FTrR9nGzPGYaGj6gECLABQzJgKaoYemCpxi"), opts)
    #res = solana_client.get_token_supply(PublicKey("D8Wg6uzbqQcp5ZndZfnvGWmXdxWhPLqGHF3v5rGngR1p"), commitment=None)
    print(res)