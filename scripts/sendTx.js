const fs = require('fs');
const { ethers,Wallet } = require("ethers");


let owner
let wallet
let nonce
let outputFile

async function main(filePath) {
  if(!filePath){
    console.log("Usage:  node scripts/sendTx.js input_path\r\n")
    console.log(" Required ENVS:\r\n")
    console.log("\t NETWORK_RPC_URL")
    console.log("\t PRIVATE_KEY")
    return
  }
  const url = process.env.NETWORK_RPC_URL;
  console.log("Using RPC: " + url);
  if (!url) {
    console.error("Missing NETWORK_RPC_URL. Aborting..");
    return null;
  }
  const connection = {
    url: url,
    headers: { "User-Agent": "Ocean Deployer" }
  };
  const provider = new ethers.providers.JsonRpcProvider(connection);
  
  if (process.env.MNEMONIC)
    wallet = new Wallet.fromMnemonic(process.env.MNEMONIC);
  if (process.env.PRIVATE_KEY) wallet = new Wallet(process.env.PRIVATE_KEY);
  if (!wallet) {
    console.error("Missing MNEMONIC or PRIVATE_KEY. Aborting..");
    return null;
  }
  owner = wallet.connect(provider);
  nonce = await owner.getTransactionCount();
  console.log("Account nonce: "+nonce)

  const txs=require('fs').readFileSync(filePath, 'utf-8')
    .split('\n')
    .filter(Boolean);
  let counter=1
  for(const signedTx of txs){
    decoded=await ethers.utils.parseTransaction(signedTx)
    if(decoded.nonce!==nonce){
      process.stdout.write(`${counter} - Skiping line , our nonce: ${nonce}, tx nonce: ${decoded.nonce}\n`)
    }
    else{
      process.stdout.write(`${counter} - Sending tx with nonce ${decoded.nonce}..`)
      
      try{
        const sentTx=await provider.sendTransaction(signedTx)
        nonce = nonce +1
        process.stdout.write("\r"+`${counter} - Sending tx with nonce ${decoded.nonce}.. ${sentTx.hash}`)
        await provider.waitForTransaction(sentTx.hash,2)
        process.stdout.write("\r"+`${counter} - Sending tx with nonce ${decoded.nonce}.. ${sentTx.hash} ..  confirmed\n`)
        
      }catch(e){
        process.stdout.write("\r"+`${counter} - Sending tx with nonce ${decoded.nonce}.. FAILED\n`)
        //console.log(e)
      }
    }
      
    counter = counter + 1 //for display purposes
  }


}

main(process.argv[2])
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
