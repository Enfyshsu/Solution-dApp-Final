window.Buffer = safeBuffer.Buffer;

async function sign(users, blockhash){
    const isConnected = await window.solflare.connect();
    if(isConnected){

        users = [new solanaWeb3.PublicKey(users[0]), new solanaWeb3.PublicKey(users[1])];

        let transaction = new solanaWeb3.Transaction().add(
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: users[0],
                toPubkey: users[0],
                lamports: 100,
            }),
            solanaWeb3.SystemProgram.transfer({
                fromPubkey: users[1],
                toPubkey: users[1],
                lamports: 100,
            })
        );

        transaction.recentBlockhash = blockhash;
        transaction.feePayer = users[0];
        let signed = await window.solflare.signTransaction(transaction);
        //console.log(signed);
        
        let my_pubkey = new solanaWeb3.PublicKey($.cookie('pubKey'));
        let to_send_signature = [];
        signed.signatures.forEach((signature_info) => {
              if (signature_info.publicKey.equals(my_pubkey)) to_send_signature = Array.from(signature_info.signature);
        });

        //console.log(to_send_signature);
        return {'signature': to_send_signature,'blockhash': blockhash};
    }
}