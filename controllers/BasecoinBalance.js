const Web3  = require('web3');
 const TronWeb = require('tronweb');
const CryptoAccount = require("send-crypto");
const  axios =require("axios");
require('dotenv').config();
const PROVIDERBINACE=process.env.PROVIDER_URL;
const ETHSAPHOLIAPROVIDER =process.env.RPC_ETH
const { Connection, PublicKey } = require('@solana/web3.js');
const privatekeyaccess = require('../utils/PrivatekeyFetcher');
const detectPrivateKeyFormat =require("../utils/BitAdresstester");
const { converttoHex } = require('../utils/helper');
async function getEthBalance(wallet_address) {
  const web3 = new Web3(ETHSAPHOLIAPROVIDER);
  const address = wallet_address;
  try {
    let balanceWei = await web3.eth.getBalance(address);
    const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
      return balanceEther;
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    return {error:'Failed to fetch ETH balance'}
  }
};
async function getTronBalance(wallet_address) {
  const tronWeb = new TronWeb({
    fullNode: 'https://api.shasta.trongrid.io',
    solidityNode: 'https://api.shasta.trongrid.io',
    eventServer: 'https://api.shasta.trongrid.io'
  });

  try {
    const address = tronWeb.address.toHex(wallet_address);
    const balanceTrx = await tronWeb.trx.getBalance(address);
    return balanceTrx/10**6;
  } catch (error) {
    console.error('Error fetching TRON balance:', error);
    return { error:'Failed to fetch TRON balance' };
  }
};
async function getBnbBalance(wallet_address) {
  const web3 = new Web3(PROVIDERBINACE);
  const address = wallet_address;
  try {
    let balanceWei = await web3.eth.getBalance(address);
    const balanceBNB = web3.utils.fromWei(balanceWei, 'ether');
    return balanceBNB;
  } catch (error) {
    console.error('Error fetching BNB balance:', error);
    return {error:"Failed to fetch BNB balance"};
  }
};
async function getBtcBalance(wallet_address) {
  try {
    const privateKey = await privatekeyaccess(wallet_address); 
    const data = detectPrivateKeyFormat(privateKey?.private_key);
    if(data==="hexadecimal"){
    
      const account = new CryptoAccount(privateKey?.private_key, {
        network: "testnet",
    });
    const balance = await account.getBalance("BTC");     
      return balance;

    }else{
     
      const url = `https://api.blockcypher.com/v1/btc/test3/addrs/${wallet_address}/balance`;
      const response = await axios.get(url);
      return response.data.balance / 100000000; 
    }
  } catch (error) {
    console.error('Error fetching BTC balance:', error);
    return {error:'Failed to fetch BTC balance'}
  }
};
async function getSolBalance(wallet_address) {
  const clusterApiUrl = 'https://api.devnet.solana.com/';
  const LAMPORTS_PER_SOL = 1000000000;
  try {
    const connection = new Connection(clusterApiUrl, 'confirmed');
    const wallet = new PublicKey(wallet_address);
    const solanaBalance = (await connection.getBalance(wallet)) / LAMPORTS_PER_SOL;
    return solanaBalance;
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    return { error:'Failed to fetch SOL balance'}
  }
};
exports.getTokenBalance = async (req, res) => {
  const {coin_shortName, wallet_address } = req.body;
  try {
    let response;
    switch (coin_shortName) {
      case "ETH":
          response = await getEthBalance(wallet_address);
          res.json({data:{
            "balance":Number(response).toFixed(3)
          },mesaag:"balance fetched successfully" ,status:true });
          break;    
      case "TRON":
        response = await getTronBalance(wallet_address);
          res.json({data:{
            "balance": Number(response).toFixed(3)
        },mesaag:"balance fetched successfully" ,status:true });
        break;
      case "BNB":
        response = await getBnbBalance(wallet_address);
        res.json({data:{
          "balance": Number(response).toFixed(3)
        },mesaag:"balance fetched successfully" ,status:true });
        break;
      case "BTC":
        response = await getBtcBalance(wallet_address);
        res.json({data:{
          "balance": Number(response).toFixed(6)
        },mesaag:"balance fetched successfully" ,status:true });
        break;
      case "SOL":
        response = await getSolBalance(wallet_address);
        res.json({data:{
          "balance": Number(response).toFixed(3)
        },mesaag:"balance fetched successfully" ,status:true });
        break;
      default:
        res.json({error:`${res.__("Unsupported coin")}: ${coin_shortName}`});
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
exports.getTokenBalanceCheck = async (coin_shortName, wallet_address) => {
  try {
    let response;
    switch (coin_shortName) {
      case "ETH":
        response = await getEthBalance(wallet_address);
        return { "ETH": response };
      
      case "TRON":
        response = await getTronBalance(wallet_address);
        return { "TRON": response };
      
      case "BNB":
        response = await getBnbBalance(wallet_address);
        return {"BNB":response };
      
      case "BTC":
        response = await getBtcBalance(wallet_address);
        return { "BTC": response };
      
      case "SOL":
        response = await getSolBalance(wallet_address);
        return { "SOL": response };
      
      default:
        return {error:`Unsupported coin: ${coin_shortName}`};
    }
  } catch (error) {
    console.error('Error:', error.message);
    return {error:'Internal Server Error'};
  }
};

