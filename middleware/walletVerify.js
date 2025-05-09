const TronWeb = require('tronweb');
const axios = require('axios');
const { PublicKey } = require('@solana/web3.js');

function isValidEthAddress(address) {
    if (!address) return false;
    const isHex = /^0x[0-9A-Fa-f]{40}$/.test(address);
    return isHex;
  };
function isValidTronAddress(address) {
  if (!address) return false;
  return TronWeb.isAddress(address);
}
function isValidBnbAddress(address) {
  return isValidEthAddress(address);
}
async function isValidBtcAddress(address) {
  try {
    const url = `https://api.blockcypher.com/v1/btc/test3/addrs/${address}/balance`;
    const response = await axios.get(url);
    return true;
  } catch (error) {
    return false;
  }
}
function isValidSolAddress(address) {
  try {
    const publicKey = new PublicKey(address);
    return publicKey.toBase58() === address;
  } catch (error) {
    return false;
  }
}

exports.validateWalletAddress = async (req, res, next) => {
  const { coin_shortName, wallet_address } = req.body;
  let isValidAddress = false;
  switch (coin_shortName) {
    case "ETH":
      isValidAddress = isValidEthAddress(wallet_address);
      break;
    case "TRON":
      isValidAddress = isValidTronAddress(wallet_address);
      break;
    case "BNB":
      isValidAddress = isValidBnbAddress(wallet_address);
      break;
    case "BTC":
      isValidAddress = await isValidBtcAddress(wallet_address);
      break;
    case "SOL":
      isValidAddress = isValidSolAddress(wallet_address);
      break;
    default:
      return res.status(400).json({ error: `Unsupported coin: ${coin_shortName}` });
  }
  if (isValidAddress) {
    next();
  } else {
    res.status(400).json({ message: `Invalid ${coin_shortName} wallet address: ${wallet_address}`, status: false });
  }
};
