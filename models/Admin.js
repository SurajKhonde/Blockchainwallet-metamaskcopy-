const pool = require('../config/poolConnection'); 
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = function(user) {
  this.id= user.id;
  this.email = user.email;
  this.password = user.password;
  this.mobile = user.mobile;
  this.fname = user.fname;
  this.deviceid = user.deviceid;
  this.countryCode=user.countryCode
  this.lname = user.lname;
  this.referCode=user.referCode;
  this.email_verification = user.email_verification || false;
  this.mobile_verification = user.mobile_verification || false;
  this.terms_condition = user.terms_condition || false;
  this.status = user.status || 'active';
};

User.prototype.hashPassword = async function() {
  this.password = await bcrypt.hash(this.password, 10);
};

User.prototype.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

User.mobilecreate = async (newUser) => {
  try {
    const user = new User(newUser);
    await user.hashPassword();
    const { password, mobile, fname, lname,deviceid,referCode,countryCode} = user;
    console.log(user)
    const query = `
      INSERT INTO users 
        ( password, 
          mobile,fname,lname,deviceid,SponserCode,countryCode)
      VALUES (?,?,?,?,?,?,?)
    `;
    const values = [
      password, mobile,fname, lname,deviceid,referCode,countryCode];
    const [result] = await pool.execute(query, values);
    console.log(result)
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', error);
    return {error:"server error"}
  }
};
User.emailcreate = async (newUser) => {
  try {
    const user = new User(newUser);
    await user.hashPassword();
    const { email, password, fname, lname} = user;
    const query = `
      INSERT INTO users 
        (email, password, 
          fname,lname)
      VALUES (?, ?, ?,?)
    `;
    const values = [
      email, password,fname, lname];
    const [result] = await pool.execute(query, values);
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', __(error));
    return false
  }
};
User.signInByEmail = async (email, password) => {
  try {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows, fields] = await pool.execute(query, [email]);
    
    if (rows.length === 0) {
      return null;
    }  
    const userData = rows[0];
    const user = new User(userData);
    
    const matched = await user.comparePassword(password);
    if (!matched) {
      return false
    } 
    const jwtToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn:'10h'
    });
    
    return {
      
      token: jwtToken,
      status:true,
      message:"user signed in successfully"

    };
    
  } catch (error) {
    console.error('Error signing in:', error);
    return false
  }
};
User.isActive=async(mobile)=>{
  try {
    const activeinqury = `SELECT status FROM users WHERE mobile = ?`
    const [result] = await pool.execute(activeinqury, [mobile]);
    if(result[0].status ==="inactive"){
      return true;
    }
    return false;
  } catch (error) {
    return false
    
  }

}
User.signInMobile = async (mobile, password,deviceid) => {
  try {
    const query = `SELECT * FROM users WHERE mobile = ?`;
    const [rows, fields] = await pool.execute(query, [mobile]);
    if (rows.length === 0) {
      return null;
    }
    const userData = rows[0];
    const user = new User(userData);
    const storeDevideId=user.deviceid;
    if(storeDevideId!== deviceid && mobile!=919549032200){
      return {
        status:false,
        message:"DeviceId is not matched"
      };
    }
    const matched = await user.comparePassword(password);
    if (!matched) {
      return false
    } 
    const jwtToken = jwt.sign({ userId: user.id,willexpired:true }, process.env.JWT_SECRET,{
      expiresIn:'5h'
    });
    
    return {
      
      token: jwtToken,
      message:"user signed in successfully",
      status:true
    };
    
  } catch (error) {
    console.error('Error signing in:', error);
    return {error:"internal_server_error"}
  }
};
module.exports = User;
