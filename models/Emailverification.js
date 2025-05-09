const bcrypt = require('bcrypt');
const connection = require("../config/poolConnection");

const EmailVerificationToken = {};

EmailVerificationToken.createToken = async (userkey, otp) => {
  try {
    const selectQuery = 'SELECT COUNT(*) AS count FROM otp_data WHERE userkey = ?';
    const [selectRows, selectFields] = await connection.execute(selectQuery, [userkey]);

    if (selectRows[0].count === 0) {
      const hashedToken = await bcrypt.hash(otp, 10);
      const insertQuery = 'INSERT INTO otp_data (userkey, otp) VALUES (?, ?)';
      await connection.execute(insertQuery, [userkey, hashedToken]);
      return true;
    } else {
      const hashedToken = await bcrypt.hash(otp, 10);
      const updateQuery = 'UPDATE otp_data SET otp = ? WHERE userkey = ?';
      const [updateRows, updateFields] = await connection.execute(updateQuery, [hashedToken, userkey]);

      if (updateRows.affectedRows > 0) {
        return true;
      } else {
        console.log(`No rows updated for userkey: ${userkey}`);
        return false;
      }
    }
  } catch (error) {
    console.error('Error creating or updating token:', error);
    throw error;
  }
};
EmailVerificationToken.compareToken = async (userkey, otp) => {
  try {
    const selectQuery = 'SELECT otp FROM otp_data WHERE userkey = ?';
    const [rows, fields] = await connection.execute(selectQuery, [userkey]);

    if (rows.length === 0) {
      return false;
    }
    const hashedToken = rows[0].otp;
    const result = await bcrypt.compare(otp, hashedToken);
    
    if(result){
    const deleteQuery = 'DELETE FROM otp_data WHERE userkey = ?';
    const [rows, fields] = await connection.execute(deleteQuery, [userkey]);
    
    if (rows.affectedRows > 0) {
      console.log(`${rows.affectedRows} row(s) deleted for userkey: ${userkey}`);
      return true; 
    } else {
      console.log(`No rows deleted for userkey: ${userkey}`);
      return false;
    }
    }else{
        return false
    }
    
  } catch (error) {
    console.error('Error comparing tokens:', error);
    throw error;
  }
};



module.exports = EmailVerificationToken;
