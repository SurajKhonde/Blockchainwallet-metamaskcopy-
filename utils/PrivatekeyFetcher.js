const { pool } = require('../config/poolConnection');
const decryptPrivateKey = require('./encryption');
function privatekeyaccess(from_address) {
  return new Promise((resolve, reject) => {
    try {
      const query = 'SELECT * FROM userWallet WHERE wallet_address = ?';
      pool.execute(query, [from_address], async (err, results) => {
        if (err) {
          console.error('Error retrieving user from database:', err);
          return reject('Database error occurred.');
        };
        if (results.length > 0) {
          results.forEach(wallet => {
            wallet.private_key = decryptPrivateKey(wallet.private_key);
          });
          resolve({private_key:results[0].private_key, user_id:results[0].user_id});
        } else {
          console.log("No wallet found for address:", from_address);
          resolve(null);
        }
      });

    } catch (error) {
      console.error('Error fetching user wallets:', error);
      reject('Internal Server Error');
    }
  });
}

module.exports = privatekeyaccess;

