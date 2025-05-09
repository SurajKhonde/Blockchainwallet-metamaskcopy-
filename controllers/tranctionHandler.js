const  Web3  = require('web3');
require('dotenv').config();

const TronWeb = require('tronweb');
const { isAddress } = require('web3-validator');
const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');
const tinysecp = require('tiny-secp256k1');
const ECPairFactory = require('ecpair').default;
const solanaweb3 = require('@solana/web3.js');
const {Keypair} = require('@solana/web3.js');
const web3 = require('@solana/web3.js');
const privatekeyaccess= require("../utils/PrivatekeyFetcher.js");
const { getTokenBalanceCheck } = require('./BasecoinBalance.js');
const {insertClientTransaction} = require('../utils/TransctionDatamanager.js');
const rpcurl=process.env.RPC_URLETH;
const BINANCEPROVIDER =process.env.PROVIDER_URL
const broadcastUrl = 'https://blockstream.info/testnet/api/tx';
const ethers = require('ethers');
async function sendEthTransaction(coin_shortName, from_address, to_address, amount) {
  if (!ethers.isAddress(from_address)) {
    return { message: "Invalid sender address", status: false };
  }
  if (!ethers.isAddress(to_address)) {
    return { message: "Invalid receiver address", status: false };
  }
  const privateKey = await privatekeyaccess(from_address);
  if (!privateKey || !privateKey.private_key) {
    return { message: "Failed to retrieve private key", status: false };
  }
  const provider = new ethers.JsonRpcProvider(rpcurl);
  const wallet = new ethers.Wallet(privateKey.private_key, provider);  
  const ethUserBalance = await getTokenBalanceCheck("ETH", wallet?.address);
  if (ethUserBalance.ETH < amount+(amount*0.002)) {
      return {message: 'Insufficient ETH balance for transction',status:false};
  }
  try {
    const [gasEstimate, feeData] = await Promise.all([
      provider.estimateGas({
        to: to_address,
        value: ethers.parseUnits(amount, 'ether'),
      }),
      provider.getFeeData(),
    ]);
    const gasPrice = feeData.gasPrice || ethers.parseUnits('21000', 'gwei');
    const tx = {
      to: to_address,
      value: ethers.parseUnits(amount, 'ether'),
      gasLimit: gasEstimate,
      gasPrice: gasPrice,
    };
   
    const txResponse = await wallet.sendTransaction(tx);
    console.log("Transaction Response:", txResponse);

    const receipt = await txResponse.wait();
    if (receipt && receipt.hash) {
      const gasCost = gasEstimate*gasPrice; 
      const transactionData = {
        coin_shortname: coin_shortName,
        client_id:privateKey.user_id,
        transaction_hash: receipt.hash,
        amount: amount,
        receiver_wallet_address: to_address,
        sender_wallet_address: from_address,
        transaction_fees: ethers.formatUnits(gasCost, 'gwei'),
      };
      await insertClientTransaction(transactionData);
    }
    return { message: 'Transaction successful', status: true };

  } catch (error) {
    console.error('Transaction failed:', error);
    return { message: 'Transaction failed', status: false };
  }
};
async function sendTronTransaction(coin_shortName,from_address,to_address,amount,client_id) {
  const privateKey = await privatekeyaccess(from_address);
  const TRONBalance = await getTokenBalanceCheck(coin_shortName,from_address);

    const tronWeb = new TronWeb({
        fullNode: 'https://api.shasta.trongrid.io',
        solidityNode: 'https://api.shasta.trongrid.io',
        eventServer: 'https://api.shasta.trongrid.io',
        privateKey: privateKey.private_key
    });

    const transaction = await tronWeb.transactionBuilder.sendTrx(
        to_address,
        amount * 10**6, 
        from_address
    );
    if(TRONBalance.TRON < amount+(amount*0.001)){
      return {error:"Insufficient Balance",status:false};
    }

    const signedTransaction = await tronWeb.trx.sign(transaction, privateKey);
    const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction);
    if(receipt.txid){
      const transactionData = {
        coin_shortname: coin_shortName,
        client_id:privateKey.user_id,
        transaction_hash:receipt.txid,
        amount:amount,
        receiver_wallet_address:to_address,
        sender_wallet_address:from_address,
        transaction_fees:"0.01",
      }
          insertClientTransaction(transactionData, (err, result) => {
        if (err) {
          console.error('Error inserting client transaction:', err);
          return;
        }
        console.log('Client transaction inserted successfully:', result);
      });
    }

    return receipt.txid;
};
async function sendBnbTransaction(coin_shortName,from_address,to_address,amount) {
    try {       
      if(!isAddress(from_address)) return {message:"Invalid sender_adress",status:false};
      if(!isAddress(to_address)) return {message:"Invalid reciver_adress please check once before sending transaction",status:false};
      const privateKey = await privatekeyaccess(from_address);
      const BNBbalance = await getTokenBalanceCheck(coin_shortName,from_address);
      const web3 = new Web3(BINANCEPROVIDER);
      const realbnbBalance =web3.utils.toWei((BNBbalance.BNB).toString(), 'ether');
      const account = web3.eth.accounts.privateKeyToAccount(privateKey?.private_key);
      const tx = {
        from: from_address,
        to: to_address,
        value: web3.utils.toWei(amount.toString(), 'ether'),
        gas: 21000,
        gasPrice: await web3.eth.getGasPrice(),
        nonce: await web3.eth.getTransactionCount(from_address, 'pending'),
      };
       if(realbnbBalance>tx.value+(tx.gasPrice)){
        const signedTx = await account.signTransaction(tx);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        const transactionHash = receipt.transactionHash;
        if(transactionHash){
          const transactionData = {
            coin_shortname: coin_shortName,
            client_id:privateKey?.user_id,
            transaction_hash:transactionHash,
            amount:amount,
            receiver_wallet_address:to_address,
            sender_wallet_address:from_address,
            transaction_fees:((tx.gasPrice)/10*18),
          }
              insertClientTransaction(transactionData, (err, result) => {
            if (err) {
              console.error('Error inserting client transaction:', err);
              return;
            }
            console.log('Client transaction inserted successfully:', result);
          });
        }
        return transactionHash;
       }else{
        return {error:"Send less than Available balance for gas fees."}
       }

    } catch (error) {
      console.error('Error sending BNB transaction:', error);
      return {error:error,status:false};
    }
};  
async function getUtxos(address) {
  try {
    const url = `https://blockstream.info/testnet/api/address/${address}/utxo`;
    const response = await axios.get(url);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching UTXOs:', error.message);
    throw error;
  }
};
async function getRawTransaction(txid) {
  try {
    const url = `https://blockstream.info/testnet/api/tx/${txid}/hex`;
    const response = await axios.get(url);
    if (response.data) {
      return response.data;
    } else {
      throw new Error('No hex data found in the response');
    }
  } catch (error) {
    console.error(`Error fetching transaction ${txid}:`, error.message);
    throw error;
  }
};
const testnet = bitcoin.networks.testnet;
const ECPair = ECPairFactory(tinysecp);
async function sendBtcTransaction(coin_shortName, from_address, to_address, amount) {
  try {
    const privateKey = await privatekeyaccess(from_address);
    if (!privateKey || !privateKey.private_key) {
      return { message: 'Private key issue, please try again', status: false };
    }

    const keyPair = ECPair.fromWIF(privateKey.private_key, testnet);
    const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: testnet });
    const utxos = await getUtxos(address);
    if (utxos.length === 0) {
      throw new Error('No UTXOs available for the given address.');
    }
    const psbt = new bitcoin.Psbt({ network: testnet });
    let totalInput = 0;

    for (const utxo of utxos) {
      const nonWitnessUtxo = await getRawTransaction(utxo.txid);
      if (!nonWitnessUtxo) {
        throw new Error(`Unable to fetch raw transaction for ${utxo.txid}`);
      }

      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(nonWitnessUtxo, 'hex'),
      });
      totalInput += utxo.value;
    }

    const fee = 10000;
    const realAmount=Number(amount)*(100000000 )
    const change = totalInput - realAmount - fee;

    if (change < 0) {
      throw new Error('Insufficient funds');
    }

    console.log(`Adding output to ${to_address} with value ${amount}`);
    psbt.addOutput({ address: to_address, value: realAmount });

    console.log(`Adding change output to ${address} with value ${change}`);
    psbt.addOutput({ address: address, value: change });

    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    const rawTransaction = psbt.extractTransaction().toHex();
  
    const response = await axios.post(broadcastUrl, rawTransaction);

    const transactionHash = response.data;
    if(transactionHash){
        const transactionData = {
          coin_shortname: coin_shortName,
          client_id: privateKey?.user_id,
          transaction_hash: transactionHash,
          amount: amount,
          receiver_wallet_address: to_address,
          sender_wallet_address: from_address,
          transaction_fees: fee,
      }
          insertClientTransaction(transactionData, (err, result) => {
        if (err) {
          console.error('Error inserting client transaction:', err);
          return;
        }
      });
    }
    return transactionHash;

  } catch (error) {
    console.error('Error sending Bitcoin transaction:', error.message);
    return { message: error.message, status: false };
  }
};
async function sendSolTransaction(coin_shortName,from_address,to_address,amount) {
  const connection = new solanaweb3.Connection('https://api.devnet.solana.com/', 'confirmed');
  const privateKeys = await privatekeyaccess(from_address);
  const solBalance=await getTokenBalanceCheck(coin_shortName,from_address);
  const privateKeyStringArray = privateKeys?.private_key.split(',');
  const privateKeyUint8Array = new Uint8Array(privateKeyStringArray.map(str => parseInt(str, 10)));
  try {
     const keypair = Keypair.fromSecretKey(Uint8Array.from(privateKeyUint8Array));
     const publicKey = keypair.publicKey.toString();
const from = web3.Keypair.fromSecretKey(privateKeyUint8Array);
if(solBalance.SOL<amount+(amount*0.001)){
  return {error:"Insufficient Balance"}
}
    const transaction = new web3.Transaction().add(
      web3.SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to_address,
        lamports: amount * 1e9,
      }),
    );
   
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [from],
    );
    if(signature){
      const transactionData = {
        coin_shortname: coin_shortName,
        client_id:privateKeys?.user_id,
        transaction_hash:signature,
        amount:amount,
        receiver_wallet_address:to_address,
        sender_wallet_address:from_address,
        transaction_fees:"0.0001",
      }
           await insertClientTransaction(transactionData, (err, result) => {
        if (err) {
          console.error('Error inserting client transaction:', err);
          return;
        }
        console.log('Client transaction inserted successfully:', result);
      });
    }
    return signature;    
  } catch (error) {
    console.error('Error sending transaction:', error.message);
    return {error:"Insufficient Balance"}
  }
};
module.exports = {
    sendEthTransaction,
    sendTronTransaction,
    sendBnbTransaction,
    sendBtcTransaction,
    sendSolTransaction
};
