const crypto = require("crypto");
const {bs58} = require('bs58');

exports.generateRandomByte = () => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(30, (err, buff) => {
        if (err) reject(err);
        const buffString = buff.toString("hex");
        resolve(buffString);
      });
    });
  };
exports.converttoHex=(base58String)=>{
  
  const buffer = bs58.decode(base58String);
  const hexString = buffer.toString('hex');
return hexString;
};
