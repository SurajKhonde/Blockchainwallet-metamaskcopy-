//test mode still not working
require('dotenv').config();
const Web3 = require('web3');
const  ethers  = require("ethers");
const TronWeb = require('tronweb');
const { Connection, PublicKey } = require('@solana/web3.js');
async function getEthBalance(wallet_address) {
  const providerUrl =process.env.RPC_ETH
  const web3 = new Web3(providerUrl);
  try {
    let balanceWei = await web3.eth.getBalance(wallet_address);
    const balanceEther = web3.utils.fromWei(balanceWei, 'ether');
    return balanceEther;
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    throw new Error('Failed to fetch ETH balance');
  }
};

async function getTronBalance(wallet_address) {
  const tronWeb = new TronWeb({
    fullNode: process.env.FULLNODE ,
    solidityNode: process.env.SOLIDITYNODE,
    eventServer: 'https://api.shasta.trongrid.io'
  });

  try {
    const address = tronWeb.address.toHex(wallet_address);
    const balanceTrx = await tronWeb.trx.getBalance(address);
    return balanceTrx / 10**6;
  } catch (error) {
    console.error('Error fetching TRON balance:', error);
    throw new Error('Failed to fetch TRON balance');
  }
};

async function getBnbBalance(wallet_address) {
  const providerUrl = process.env.PROVIDER_URL;
  const web3 = new Web3(providerUrl);
  try {
    let balanceWei = await web3.eth.getBalance(wallet_address);
    const balanceBNB = web3.utils.fromWei(balanceWei, 'ether');
    return balanceBNB;
  } catch (error) {
    console.error('Error fetching BNB balance:', error);
    throw new Error('Failed to fetch BNB balance');
  }
};
async function getBtcBalance(wallet_address) {
  try {
    const privateKey = await privatekeyaccess(wallet_address);
    const account = new CryptoAccount(privateKey?.private_key, {
      network: "testnet",
    });

    const balance = await account.getBalance("BTC");
    return balance;
  } catch (error) {
    console.error('Error fetching BTC balance:', error);
    return { error: 'Failed to fetch BTC balance' };
  }
};
async function getSolBalance(wallet_address) {
  const clusterApiUrl =process.env.SOLANAPI;
  const LAMPORTS_PER_SOL = 1000000000;
  try {
    const connection = new Connection(clusterApiUrl, 'confirmed');
    const wallet = new PublicKey(wallet_address);
    const solanaBalance = (await connection.getBalance(wallet)) / LAMPORTS_PER_SOL;
    return solanaBalance;
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    throw new Error('Failed to fetch SOL balance');
  }
};
async function getBalanceByCoin(coin_shortName, wallet_address) {
  switch (coin_shortName) {
    case "ETH":
      return getEthBalance(wallet_address);
    case "TRON":
      return getTronBalance(wallet_address);
    case "BNB":
      return getBnbBalance(wallet_address);
    case "BTC":
      return getBtcBalance(wallet_address);
    case "SOL":
      return getSolBalance(wallet_address);
    default:
      throw new Error(`Unsupported coin: ${coin_shortName}`);
  }
};

module.exports = {
  getBalanceByCoin,
  getEthBalance,
  getTronBalance,
  getBnbBalance,
  getBtcBalance,
  getSolBalance
};
