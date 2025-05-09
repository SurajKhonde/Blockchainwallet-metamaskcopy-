const Web3 = require('web3');
const TronWeb = require('tronweb');
const CryptoAccount = require("send-crypto");
const {Keypair } = require('@solana/web3.js');
const generateWallet = require('../utils/walletByPrivatekey');
const { cryptocoinsLocator } = require('../utils/cryptocoinLocator');
const { PrivateKey } = require('bitcore-lib');
async function getEthAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name) {
 
  try {
    const {blockchain,id} =  await cryptocoinsLocator(coin_shortName);
    const chain_type = blockchain;
    const coin_id = id;
    const web3 = new Web3();
    const account = web3.eth.accounts.privateKeyToAccount(private_key);
    if(!account ){
      return {message:"private key is wrong ",status:false}
    }
    const wallet_address = account.address
    const data=await generateWallet(coin_shortName,user_id,coin_id,chain_type, private_key,wallet_address,wallet_name)
     if(data.error){
         return {messaage:data.error,status:false}
     }
    return {message:"user wallet fetched successfully from privetkey ",status:true}
   
  } catch (error) {
    return {message:`Failed to derive ETH address: ${error.message}`,status:false};
  }
};
async function getTronAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name) {
  
  try {
    const tronWeb = new TronWeb({
      fullNode: 'https://api.shasta.trongrid.io',
      solidityNode: 'https://api.shasta.trongrid.io',
      eventServer: 'https://api.shasta.trongrid.io'
    });
    const {blockchain,id } =  await cryptocoinsLocator(coin_shortName);
    const chain_type = blockchain;
    const coin_id = id;
    const wallet_address=tronWeb.address.fromPrivateKey(private_key);
    if(!wallet_address){
      return {message:"invalid Private key",status:false}
    }
     const data=await generateWallet(coin_shortName,user_id,coin_id,chain_type, private_key,wallet_address,wallet_name)
     if(data.error){
      return {messaage:data.error,status:false}
     }
    return {message:"user wallet fetched successfully from privetkey",status:true}
  } catch (error) {
    return {message:`Failed to derive TRON address: ${error.message}`,status:false};
  }
};
async function getBnbAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name) {
    try {
        const web3 = new Web3();
        if(!private_key ||PrivateKey.length< 32){
          return {message:"invalid Private key",status:false}
         }
        const account =  await web3.eth.accounts.privateKeyToAccount(private_key);
        const {blockchain,id} =  await cryptocoinsLocator(coin_shortName);
        const chain_type = blockchain;
        const coin_id = id;
         const wallet_address =  await account.address
         if(!wallet_address){
          return {message:"invalid Private key",status:false}
         }
         
        const data=await generateWallet(coin_shortName,user_id,coin_id,chain_type, private_key,wallet_address,wallet_name);
       if(data.error){
        return {messaage:data.error,status:false}
       }
    
        return {message:"user wallet fetched successfully from privetkey"}

      } catch (error) {
        return{message:`Failed to derive ETH address: ${error.message}`,status:false};
      }
};
async function getBtcAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name) {
  // if(!private_key || private_key.length< 64 ||private_key.length>64){
  //   return {message:"invalid Private key",status:false}
  //  }
  try {
    const account = new CryptoAccount(private_key, {network: "testnet" });
     const walletAddr = await account.address("BTC");
     const {blockchain,id} =  await cryptocoinsLocator(coin_shortName);
     const chain_type = blockchain;
     const coin_id = id;
     const wallet_address =  await walletAddr
     const data=await generateWallet(coin_shortName,user_id,coin_id,chain_type, private_key,wallet_address,wallet_name);
       if(data.error){
        return {messaage:data.error,status:false}
       }
    
        return {message:"user wallet fetched successfully from privetkey"}

      } catch (error) {
        return{ message:`Failed to derive  address: ${error.message}`,status:false};
      }

}
async function getSolAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name) {
  try {
    const privateKeyStringArray = private_key.split(',');
  const privateKeyUint8Array = new Uint8Array(privateKeyStringArray.map(str => parseInt(str, 10)));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyUint8Array));
     const publicKey = keypair?.publicKey
     if(!publicKey){
      return {message:"invalid Private key",status:false}
     }
     const {blockchain,id} =  await cryptocoinsLocator(coin_shortName);
     const chain_type = blockchain;
     const coin_id = id;
     const wallet_address = publicKey
     if(!wallet_address){
      return{messaage:"please provide us valid private key",status:true}
     }

       const data= await generateWallet(coin_shortName,user_id,coin_id,chain_type, private_key,wallet_address,wallet_name);
       if(data.error){
        return {messaage:data.error,status:false}
       };
    return {success:"user wallet fetched successfully from privetkey"}
  } catch (error) {
    return{message:`Failed to derive SOL address: ${error.message}`,status:false};
  }
};
exports.getWalletAddressByPrivateKey = async (req, res) => {
  const { coin_shortName, private_key,user_id,wallet_name } = req.body;
  try {
    let response;
    switch (coin_shortName) {
      case "ETH":
        response = await getEthAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name);
         res.json(response);
        break;
      
      case "TRON":
        response = await getTronAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name);
        res.json( response);
        break;
      
      case "BNB":
        response = await getBnbAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name);
        res.json( response );
        break;
      
      case "BTC":
        
        response = await getBtcAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name);
        res.json(response );
        break;
      
      case "SOL":
        response = await getSolAddressFromPrivateKey(coin_shortName,private_key,user_id,wallet_name);
        res.json(response);
        break;
      
      default:
         returnres.json({ message: `Unsupported coin: ${coin_shortName}` });
    }
  } catch (error) {
    console.error('Error:', error);
    res.json({message:res.__('Internal Server Error'),status:false});
  }
};
