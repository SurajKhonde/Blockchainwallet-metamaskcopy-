const pool = require('../config/poolConnection');
exports.checkWalletExists = async (req, res, next) => {
  const { coin_id,coin_shortName,chain_type} = req.body;
  try {
    const userWalletCheck = `
      SELECT * FROM userWallet WHERE coin_id = ?;
    `;
    const [userRows, userFields] = await pool.execute(userWalletCheck, [coin_id]);
    if (userRows.length !== 0) {
      return res.status(400).json({ error: res.__('Wallet Address  Already exist please check once') });
    };
    const coinCheck = `
      SELECT * FROM cryptocurrencies WHERE id = ? 
    `;
    const [coinRows, coinFields] = await pool.execute(coinCheck, [coin_id]);
    if (coinRows.length === 0) {
      return res.status(400).json({ error: res.__('Coin does not exist in cryptocurrencies') });
    }
    if(coinRows[0].coin_symbol !== coin_shortName){
        return res.status(400).json({ error: res.__('Coin_ID and coin_shortName not matching')});
    }
    if(coinRows[0].blockchain!==chain_type){
        return res.status(400).json({ error: res.__('Please choose correct blockchain')});
    }
    next();
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: res.__('Database error') });
  }
};
