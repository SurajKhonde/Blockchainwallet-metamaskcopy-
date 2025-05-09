const { walletAdressgenrator } = require("./BasecoinAddressGenrator");
const Wallet = require("../models/WalletModel");
const pool = require('../config/poolConnection'); 
const CryptoJS = require('crypto-js');
const { cryptocoinsLocator } = require("../utils/cryptocoinLocator");
  function decryptPrivateKey(encryptedPrivateKey) {
  const secretKey = process.env.PRIVATE_KEY_ENCRYPTION_KEY;
  const parts = encryptedPrivateKey.split(':');
  const iv = CryptoJS.enc.Base64.parse(parts[0]);
  const encrypted = parts.slice(1).join(':');
  const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey, { iv }).toString(CryptoJS.enc.Utf8);
  return decrypted;
};
exports.createWallet = async (req, res) => {
  try {
    const {coin_shortName,user_id, wallet_name } = req.body;
    if (!coin_shortName || !user_id ||  !wallet_name) {
    
      return res.json({ message: res.__('Missing required fields'), status: false });
    }
    const cryptoCoins= await cryptocoinsLocator(coin_shortName);
    const { wallet_address, private_key } = await walletAdressgenrator(coin_shortName);  
    if (wallet_address && private_key) {
      const wallet = new Wallet({
        user_id,
        coin_id:cryptoCoins?.id,
        wallet_address,
        private_key,
        wallet_type:cryptoCoins?.blockchain,
        wallet_name,
        coin_name:coin_shortName,
      });
      const query = `INSERT INTO userWallet (user_id, coin_id, wallet_address, private_key, wallet_type, wallet_name,coin_name) VALUES (?,?,?,?,?,?,?)`;
      const values = [wallet.user_id, wallet.coin_id, wallet.wallet_address, wallet.private_key, wallet.wallet_type, wallet.wallet_name, wallet.coin_name];
      const [result] = await pool.execute(query, values);
       return res.status(201).json({ message: res.__('Wallet created successfully'), wallet: wallet_address, status: true });
    } else {
      return res.json({ message: res.__('Failed to generate wallet address and private key'), status: false });
    }
  } catch (error) {
    console.error('Error creating Wallet address:', error);
     return res.json({message: res.__('Internal Server Error'), status: false });
  }
};
exports.getUserWalletByUserId = async (req, res) => {
  const {coin_id} = req.body;
  const {userId}=req.user;
  if(!userId){
    return res.json({message:res.__('User id is required'),status:false});
  }
  try {
    let query, params;
    
    if (coin_id) {
      query = 'SELECT * FROM userWallet WHERE user_id = ? AND coin_id = ?';
      params = [userId, coin_id];
    } else {
      query = 'SELECT * FROM userWallet WHERE user_id = ?';
      params = [userId];
    }

    const [rows] = await pool.execute(query, params);

    if (rows.length > 0) {
      const sanitizedData = rows.map(wallet => {
        const { private_key, ...sanitizedWallet } = wallet;
        return sanitizedWallet;
    });
      res.json({wallets:sanitizedData,status: true} );
    } else {
      res.status(200).json({ message: res.__('User wallets not found'),status:false });
    }
  } catch (error) {
    console.error('Error fetching user wallets:', error);
    res.json({ message: res.__('Internal Server Error'),status:false});
  }
};
exports.getUserPrivateKey = async (req, res) => {
  const { user_id, coin_id } = req.body;
  if(!user_id && !coin_id){
    return  res.json({message:res.__("please provide valid user id or coin id"),status:false});
  }
  try {
    const query = 'SELECT * FROM userWallet WHERE user_id = ? AND coin_id = ?';
    const [rows] = await pool.execute(query, [user_id, coin_id]);
    if (rows.length > 0) {
      rows.forEach(wallet => {
        wallet.private_key = decryptPrivateKey(wallet.private_key);
      });

      return res.status(200).json({ wallets: rows ,status: true});
    } else {
     return res.status(200).json({ message: res.__('User wallets not found'),status:false });
    }
  } catch (error) {
    console.error('Error fetching user wallets:', error);
    return res.json({message: res.__('Internal Server Error') ,status:false});
  }

};
exports.getUserPrivateKeybywalletAdress = async (req, res) => {
  const { user_id, wallet_address } = req.body;
  if(!user_id && !wallet_address){
    return  res.json({message:res.__("please provide valid user id or wallet_address"),status:false});
  }
  try {
    const query = 'SELECT * FROM userWallet WHERE user_id = ? AND wallet_address = ?';
    const [rows] = await pool.execute(query, [user_id, wallet_address]);
    if (rows.length > 0) {
      rows.forEach(wallet => {
        wallet.private_key = decryptPrivateKey(wallet.private_key);
      });

      res.status(200).json({ wallets: rows ,status: true});
    } else {
      res.status(200).json({ message: res.__('User wallets not found'),status:false });
    }
  } catch (error) {
    console.error('Error fetching user wallets:', error);
    res.json({ message: res.__('Internal Server Error') ,status:false});
  }

};
