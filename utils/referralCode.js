const pool = require('../config/poolConnection');
// function generateReferralCode() {
//   let code = '';
//   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   for (let i = 0; i < 6; i++) {
//     code += characters.charAt(Math.floor(Math.random() * characters.length));
//   }
//   return code;
// }
function generateReferralCode() {
  // Generate a random number between 0 and 999999
  const randomNumber = Math.floor(Math.random() * 1000000);
  
  // Convert the number to a string and pad it with leading zeros to ensure it's 6 digits
  const code = randomNumber.toString().padStart(6, '0');
  
  return code;
}
async function insertReferralCode(code, user_id, expiryDate = null) {
    try{
      if (expiryDate) {
          const query = 'INSERT INTO referral_codes (code, user_id,expiry_date) VALUES (?, ?, ?)';
           const [rows,fields]=  await pool.execute(query,[code, user_id, expiryDate]);
          return rows.insertId;
        } else {
         const query = 'INSERT INTO referral_codes (code, user_id) VALUES (?, ?)';
           const [rows,fields] = await pool.execute(query,[code, user_id]);
           return rows.insertId;
        }
  
      }catch(error){
        console.error('Error fail to genrate  referral code:', error);
        return false;
      }
};
async function validateReferralCode(code) {
  try{
    const query = 'SELECT * FROM referral_codes WHERE code = ?';
    const [rows, fields] = await pool.execute(query, [code]);
    if(rows.length){
        return true;
    }else{
        return false;
    }

  }catch(error){
    console.error('Error validating referral code:', error);
    return false;
  }
};
async function deleteExpiredReferralCodes() {
  const query = 'DELETE FROM referral_codes WHERE expiry_date < CURDATE()';
  return new Promise((resolve, reject) => {
    pool.query(query, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results.affectedRows); 
      }
    });
  });
};
module.exports = {
  generateReferralCode,
  insertReferralCode,
  validateReferralCode,
  deleteExpiredReferralCodes,
};
