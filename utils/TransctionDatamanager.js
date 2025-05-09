const pool = require('../config/poolConnection');
exports.insertClientTransaction=async(transactionData)=> {
    const sql = `INSERT INTO Clienttransaction(coin_sortname, client_id, transaction_hash, amount, receiver_wallet_address, sender_wallet_address, transaction_fees) 
      VALUES 
        (?, ?, ?, ?, ?, ?, ?)
    `;
    const {
      coin_shortname,
      client_id,
      transaction_hash,
      amount,
      receiver_wallet_address,
      sender_wallet_address,
      transaction_fees
    } = transactionData;
  return  await pool.query(sql, [coin_shortname, client_id, transaction_hash, amount, receiver_wallet_address, sender_wallet_address, transaction_fees]);
}


