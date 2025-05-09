const pool=require('../config/poolConnection');
const checkWalletAddress = async(wallet_address) => {
    try {
        const userWalletCheck = `
            SELECT * FROM userWallet where wallet_address = ?;
        `;
        const [userRows, userFields] = await pool.execute(userWalletCheck, [wallet_address]);

        if (userRows.length !== 0) {
            return true
        }else{
            return false
        }
    } catch (error) {
        console.error('Error checking wallet address:', error);
        return { error: 'Internal Server Error' };
    }
};
module.exports = checkWalletAddress;
