const ethers = require("ethers");
const crypto = require("crypto");
const { Keypair } =  require("@solana/web3.js");
const ecc = require("tiny-secp256k1");
const bitcoin = require("bitcoinjs-lib");
const ECPairFactory = require('ecpair').default;
const tinysecp = require('tiny-secp256k1');
const web3 = require('@solana/web3.js');
const TronWeb = require('tronweb');
exports.walletAdressgenrator = async (coin_shortName) => {
  try {
    switch (coin_shortName) {
      case "ETH":
      case "BNB":
      case "Polygon":  
        return createWallet();  
      async function createWallet() {
        let id = crypto.randomBytes(32).toString("hex");
        let private_key= "0x" + id;
        let wallet = new ethers.Wallet(private_key);
        let wallet_address= wallet.address
        
        return { wallet_address, private_key};
      }
      case "TRON":
        return createTronWallet();
      async function createTronWallet() {
        const fullNode = process.env.FULLNODE;
        const solidityNode = process.env.SOLIDITYNODE;
        const eventServer = process.env.EVENTSERVER;
        if (!fullNode || !solidityNode || !eventServer) {
          return { error:"TRON environment variables not set."};
        }
        let  Realprivate_key  = crypto.randomBytes(32).toString("hex");
        const tronWeb = new TronWeb(fullNode, solidityNode, eventServer,Realprivate_key);
        const Realwallet_address =  await tronWeb.createAccount();
        const wallet_address=  await Realwallet_address?.address.base58
        const  private_key =  await Realwallet_address?.privateKey
        return {wallet_address,private_key};
      };
      case "BTC":
        return bitWallet();
      function bitWallet() {
        const testnet = bitcoin.networks.testnet;
        const ECPair = ECPairFactory(tinysecp);
        const keyPair = ECPair.makeRandom({ network: testnet });
        const { address } = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey, network: testnet });
        const private_key = keyPair.toWIF()
    
        const wallet_address=address;
             return { wallet_address,private_key }
      };
      case "SOL":
        return generateKey();
      async function generateKey() {
        try {
          const keypair = Keypair.generate();
          let wallet_address= keypair.publicKey.toString();
          let private_key= keypair.secretKey.toString();
          return {wallet_address,private_key};
        } catch (error) {
          console.error("Error generating Solana keypair:", error);
          return error;
        }    
       }
      default:
        return {error:`Unsupported coin: ${coin_shortName}`}
    }
  } catch (error) {
    console.error("Error generating wallet:", error);
    return {message:"Error generating wallet",status:false};
  }
};
