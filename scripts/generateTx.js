const fs = require('fs');
const { ethers, Wallet } = require("ethers");

const csv = require('async-csv');

const erc20abi=[
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "pure",
        "type": "function"
      },
    {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      }
]
const abi=[
    {
      "inputs": [
        {
          "internalType": "address[]",
          "name": "list",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        }
      ],
      "name": "sendEther",
      "outputs": [],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "contract IERC20",
          "name": "token",
          "type": "address"
        },
        {
          "internalType": "address[]",
          "name": "list",
          "type": "address[]"
        },
        {
          "internalType": "uint256[]",
          "name": "amounts",
          "type": "uint256[]"
        }
      ],
      "name": "sendToken",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]

let owner
let wallet
let nonce
let outputFile

async function main(filePath, outputPath,tokenAddress) {
  if(!filePath || !outputPath){
    console.log("Usage:  node scripts/generateTx.js input_csv_path output_file_path optional_erc20_token_address(null for eth payments)\r\n")
    console.log(" Required ENVS:\r\n")
    console.log("\t NETWORK_RPC_URL")
    console.log("\t PRIVATE_KEY")
    console.log("\t BATCH_CONTRACT_ADDRESS")
    return
  }
  outputFile=outputPath
  if(!tokenAddress)
    tokenAddress=ethers.constants.AddressZero
  const url = process.env.NETWORK_RPC_URL;
  console.log("Using RPC: " + url);
  if (!url) {
    console.error("Missing NETWORK_RPC_URL. Aborting..");
    return null;
  }
  if (!process.env.BATCH_CONTRACT_ADDRESS) {
    console.error("Missing BATCH_CONTRACT_ADDRESS. Aborting..");
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
  // clear output
  await fs.writeFileSync(outputFile,"")
  
    
  const contract = new ethers.Contract(process.env.BATCH_CONTRACT_ADDRESS, abi, provider);
  let contractERC20=null
  let decimals=18
  console.log("tokenAddress:"+tokenAddress)
  if(tokenAddress !== ethers.constants.AddressZero){
    contractERC20 = new ethers.Contract(tokenAddress, erc20abi, provider);
    decimals=await contractERC20.decimals()
  }
  const csvString = await fs.readFileSync(filePath);
 
  // Convert CSV string into rows:
  const rows = await csv.parse(csvString);
  //send payments in chunks
  const limit=250
  let list=[]
  let amounts=[]
  let totalAmount=ethers.BigNumber.from(0)
  for(const row of rows){
    if(!isNaN(parseFloat(row[1])))
        if(tokenAddress !== ethers.constants.AddressZero)
            totalAmount=totalAmount.plus(ethers.utils.parseUnits(String(row[1]),decimals))
  }
  
  
  
  if(tokenAddress !== ethers.constants.AddressZero){
    //approve amount
    console.log("Sending approve tx..")
    const tx=await contractERC20.connect(owner).approve(process.env.BATCH_CONTRACT_ADDRESS,totalAmount)
    console.log("Tx sent, hash:"+tx.hash)
  }
  //send in batches
  let current=0
  for(const row of rows){
    //console.log(row)
    if(!isNaN(parseFloat(row[1]))){
        if(current%limit==0 || current==0){
            if(list.length>0 && amounts.length>0){
                const tx=await sendBatch(list,amounts,tokenAddress,contract)
            }

            list=[]
            amounts=[]
        }
        list.push(row[0])
        amounts.push(ethers.utils.parseUnits(String(row[1]),decimals))
        current=current+1
        
    }
  }
  //send remaining
  if(list.length>0){
    //send last batch
    const tx=await sendBatch(list,amounts,tokenAddress,contract)
  }


}

async function sendBatch(list,amounts,tokenAddress,contract){
    console.log("Creating batch of "+list.length+" payments")
    //console.log(amounts)
    let tx
    if(tokenAddress === ethers.constants.AddressZero){
        let amountInWei=ethers.BigNumber.from(0)
        for(amount of amounts){
            amountInWei=amountInWei.add(amount)
        }
        tx = await contract.connect(owner).populateTransaction.sendEther(list,amounts,{ nonce,value: amountInWei,gasPrice: 100000000000,gasLimit:13000000 })
        
    }
    else{
        tx=await contract.connect(owner).populateTransaction.sendToken(tokenAddress,list,amounts,{nonce,gasLimit:13000000,gasPrice:100000000000})
        
    }
    //sign it
    signedTx=await owner.signTransaction(tx)
    await fs.writeFileSync(outputFile,String(signedTx)+"\n", {flag: 'a'})
    nonce = nonce +1
}

main(process.argv[2],process.argv[3],process.argv[4])
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
