const pool = require('../config/poolConnection');
async function UserexistanceChecker(newUser,id) {
  const { email, mobile } =newUser;
  

  let searchField, searchValue;
  if (email) {
    searchField = 'email';
    searchValue = email;
  } else if (mobile) {
    searchField = 'mobile';
    searchValue = mobile;
  } else if (id) {
    searchField = 'id';
    searchValue = id;
  }  
  else {
    return {error:`${searchField}"required")`}
  }

  try {
    const query = `SELECT * FROM users WHERE ${searchField} = ? AND status ='active'`;
    const [rows, fields] = await pool.execute(query, [searchValue]);
    
    if (rows.length > 0) {
      return rows[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error checking admin existence :', error);
    return { error:'Internal server error' };
  }
};
module.exports = UserexistanceChecker;
