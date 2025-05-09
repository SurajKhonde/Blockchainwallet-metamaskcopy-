const pool = require('../config/poolConnection');
const cryptocoinsLocator = async (coin_shortName) => {
    try {
        const sql = 'SELECT * FROM cryptocurrencies WHERE coin_symbol = ?';
        const [result] = await pool.execute(sql, [coin_shortName]);
        return result[0];
    } catch (error) {
        console.error('Database error:', error);
        throw new Error('Failed to get crypto records'); 
    }
};
module.exports = { cryptocoinsLocator };
