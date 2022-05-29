// const getProvider = async () => {
//   if (isSolflareInstalled) {
//       await window.solflare.connect(); // opens wallet to connect to
//       const provider = window.solflare;
//       return provider;
//   }
//   else {
//       document.write('Install https://solflare.com');
//   }
// };

function check_wallet_install(){
  var isSolflareInstalled = ('solflare' in window);
  return isSolflareInstalled;
}

function check_wallet_connect(){
  if(check_wallet_install()){
    if(window.solflare.isConnected){
      return true;
    }
    else{
      return false;
    }
  }
  else{
    return false;
  }
}

function check_auth_api() {
  return new Promise((resolve, reject) => {
    $.ajax({
      type: 'POST',
      url: "/api/check_auth",
      success: function (res) {
        resolve(res);
      },
      fail: function (xhr, ajaxOptions, thrownError) {
        reject(false)
      },
    })
  })
}

async function check_auth(){
  var result = await check_auth_api();
  result = JSON.parse(result);
  return result;
}

async function do_connect_wallet(){
  await window.solflare.connect();
}

async function do_auth(){
  const encodedMessage = new TextEncoder().encode('Authentication');
  const signedMessage = await window.solflare.signMessage(encodedMessage, 'utf8');
  document.cookie = `pubKey=${window.solflare.publicKey.toString()};`;
  document.cookie = `auth=${JSON.stringify(signedMessage['signature'])};`;
}



// window.onload = () => {

//   getProvider().then(provider => {
//       console.log('key', provider.publicKey.toString())
//       get_auth();
//   })
//   .catch(function(error){
//       console.log(error)
//   });
// }


