const   pool = require('../config/poolConnection');
exports.updateUserStaking=async(req,res)=> {
  try {
    const getUserQuery = `SELECT * FROM user_staking WHERE sent_roi_days < 180`;
    const [users] = await pool.execute(getUserQuery);

    if (users.length === 0) {
      console.log('No users to update');
      return res.json({ message: 'No users to update', status: false });
    }

    const updatePromises = users.map(async (user) => {
      const [stakingPackage] = await pool.execute(`
        SELECT * FROM staking_package 
        WHERE id = ?
      `, [user.staking_package_id]);

      if (stakingPackage.length === 0) {
        console.log(`Staking package not found for user_id ${user.user_id}`);
        return;
      }

      const ethDailyPayment = stakingPackage[0].eth_daily_payment;
      const ctc7DailyPaymentPercent = stakingPackage[0].ctc7_daily_payment_percent;
      const newSentRoiDays = user.sent_roi_days - 1;
      const newReceivedEthRoi = parseFloat(user.received_eth_roi) + parseFloat(ethDailyPayment);
      const newReceivedCtc7Roi = parseFloat(user.received_ctc7_roi) + (user.amount * ctc7DailyPaymentPercent / 100);
      // Update user_staking table
      await pool.execute(`UPDATE user_staking SET sent_roi_days = ?, received_eth_roi = ?, received_ctc7_roi = ? WHERE user_id = ?`, 
        [newSentRoiDays, newReceivedEthRoi, newReceivedCtc7Roi, user.user_id]);
      await pool.execute(`INSERT INTO etoken_transactions (user_id, amount, trans_type, token_name, user_staking_id, tx_id) VALUES (?, ?, 'daily_roi', 'E_ETH', ?, NULL)`, 
        [user.user_id, newReceivedEthRoi, user.staking_package_id]);

      await pool.execute(`INSERT INTO etoken_transactions (user_id, amount, trans_type,token_name, user_staking_id, tx_id) VALUES (?, ?, 'daily_roi', 'E_CTC7', ?, NULL)`, 
        [user.user_id, newReceivedCtc7Roi, user.staking_package_id]);

    });

    await Promise.all(updatePromises);
    return res.json({ message: 'User staking data updated successfully', status: true });
  } catch (error) {
    console.error('Error updating user staking data:', error);
    return res.json({ message: 'Error updating user staking data', status: false });
  }
}
