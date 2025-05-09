const CryptoJS = require('crypto-js');

function decryptPrivateKey(encryptedPrivateKey) {
  const secretKey = process.env.PRIVATE_KEY_ENCRYPTION_KEY;
  const parts = encryptedPrivateKey.split(':');
  const iv = CryptoJS.enc.Base64.parse(parts[0]);
  const encrypted = parts.slice(1).join(':');
  const decrypted = CryptoJS.AES.decrypt(encrypted, secretKey, { iv }).toString(CryptoJS.enc.Utf8);
  return decrypted;
}
module.exports = decryptPrivateKey;
