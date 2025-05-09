const pool = require('../config/poolConnection');
async function userStakeChecker(user_id) {
    try {
      const query = `SELECT * FROM user_staking WHERE user_id = ?`;
    
      const [rows, fields] = await pool.execute(query, [user_id]);
      
      if (rows.length > 0) {
        return rows[0];
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error checking user stake:', error);
      return { error: 'Internal server error' };
    }
  }
  module.exports = userStakeChecker;
  
  