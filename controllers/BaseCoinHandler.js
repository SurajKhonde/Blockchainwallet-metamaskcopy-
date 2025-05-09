const {
  getEthBalance,
  getTronBalance,
  getBnbBalance,
  getBtcBalance,
  getSolBalance
} = require('../utils/getallBalance'); 
const pool = require('../config/poolConnection'); 
exports.insertCrypto = async (req, res) => {
  const { coin_name, coin_symbol, decimal_places, blockchain, total_supply, website_url, description, logo_url } = req.body;
  try {
    const sql = `
      INSERT INTO cryptocurrencies (coin_name, coin_symbol, decimal_places, blockchain,total_supply, website_url, description, logo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [coin_name, coin_symbol, decimal_places, blockchain, total_supply, website_url, description, logo_url]);

    res.status(200).json({ message: res.__('Crypto record inserted successfully'),status:true });
  } catch (error) {
    console.error('Database error:', error);
    res.json({ message: res.__('Failed to insert crypto record'),status:false });
  }
};
exports.getbalncebyuser = async (req, res) => {
  const { coin_shortName, user_id, coin_id } = req.body;
  const sql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_id = ?';
  const [result] = await pool.execute(sql, [user_id, coin_id]);
  try {
    const results = [];
    for (let wallet of result) {
      let response;
      switch (coin_shortName) {
        case "ETH":
          response = await getEthBalance(wallet.wallet_address);
          results.push({ wallet_address: wallet.wallet_address, ETH: response });
          break;
        case "TRON":
          response = await getTronBalance(wallet.wallet_address);
          results.push({ wallet_address: wallet.wallet_address, TRON: response });
          break;
        case "BNB":
          response = await getBnbBalance(wallet.wallet_address);
          results.push({ wallet_address: wallet.wallet_address, BNB: response });
          break;
        case "BTC":
          response = await getBtcBalance(wallet.wallet_address);
          results.push({ wallet_address: wallet.wallet_address, BTC: response });
          break;
        case "SOL":
          response = await getSolBalance(wallet.wallet_address);
          results.push({ wallet_address: wallet.wallet_address, SOL: response });
          break;
        default:
          results.push({ wallet_address: wallet.wallet_address, error: `${res.__("Unsupported coin")}: ${coin_shortName}` });
      }
    }
     return res.json({data:results,message:res.__("Balance fetched successfully"),status:true});
  } catch (error) {
    console.error('Error:', error);
    return res.json({ messsage: res.__('Internal Server Error') });
  }
};
exports.insertUserCoinAccess = async (req, res) => {
  const { coin_id, isBlockedByUser } = req.body;
  const { userId } = req.user;
  try {
    const selectQuery = `SELECT coin_data FROM userCoinsAccess WHERE user_id = ?`;
    const [rows] = await pool.query(selectQuery, [userId]);
    let coinData = [];
    if (rows.length > 0) {
      coinData = JSON.parse(rows[0].coin_data);
    }
    let coinFound = false;
    for (let i = 0; i < coinData.length; i++) {
      if (coinData[i].coin_id === coin_id) {
        coinData[i].isBlockedByUser = isBlockedByUser;
        coinFound = true;
        break;
      }
    }
    if (!coinFound) {
      coinData.push({ coin_id, isBlockedByUser });
    }
    const updateQuery = `
      INSERT INTO userCoinsAccess (user_id, coin_data)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE coin_data = VALUES(coin_data)
    `;
    const updatedCoinData = JSON.stringify(coinData);
    await pool.query(updateQuery, [userId, updatedCoinData]);
     return res.json({ message:res.__("coinUpdated"), status: true });
  } catch (error) {
    console.error('Error updating data in userCoinsAccess:', error);
    return  res.json({ message: res.__('Internal Server Error'),status: false });
  }
};
exports.AccessCoins = async (req, res) => {
    const { userId } = req.user;
    try {
      const sql = 'SELECT * FROM cryptocurrencies';
      const [cryptocurrencies] = await pool.execute(sql);
      const selectQuery = 'SELECT coin_data FROM userCoinsAccess WHERE user_id = ?';
      const [rows] = await pool.query(selectQuery, [userId]);
      let coinData = [];
      if (rows.length > 0) {
        coinData = JSON.parse(rows[0].coin_data);
      }
      const coinDataMap = new Map(coinData.map(coin => [coin.coin_id,coin]));
      const updatedCryptocurrencies = cryptocurrencies.map(crypto => {
        const userCoin = coinDataMap.get(crypto.id);
        return {
          ...crypto,
          isBlockedByUser: userCoin ? userCoin.isBlockedByUser : false
        };
      });
       return res.json({ data: updatedCryptocurrencies, status: true });
  
    } catch (error) {
      console.error('Database error:', error);
       return res.json({ message: res.__('Internal Server Error'), status: false });
    }
};
  
  

