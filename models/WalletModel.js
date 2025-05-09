const CryptoJS = require('crypto-js');
const Wallet = function(user) {
  this.id = user.id;
  this.user_id = user.user_id;
  this.coin_id = user.coin_id;
  this.wallet_type =user.wallet_type
  this.wallet_address = user.wallet_address;
  this.wallet_name=user.wallet_name
  this.private_key = encryptPrivateKey(user.private_key); 
  this.active = user.active || 'active';
  this.coin_name=user.coin_name;
};

function encryptPrivateKey(privateKey) {
  const secretKey = process.env.PRIVATE_KEY_ENCRYPTION_KEY; 
  const iv = CryptoJS.lib.WordArray.random(16);
  const encrypted = CryptoJS.AES.encrypt(privateKey, secretKey, { iv }).toString();
  return `${iv.toString(CryptoJS.enc.Base64)}:${encrypted}`;
}
module.exports = Wallet;
