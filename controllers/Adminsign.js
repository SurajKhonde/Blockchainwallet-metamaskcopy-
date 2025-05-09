const User = require("../models/Admin");
const bcrypt = require("bcrypt");
const {generateOTP} = require("../utils/otp");
const EmailVerificationToken = require("../models/Emailverification");
const { generateReferralCode, insertReferralCode, validateReferralCode } = require("../utils/referralCode");
const pool = require("../config/poolConnection");
const signupValidatorForMobile = require("../Validators/ValidatorsforMobile");
const UserexistanceChecker = require("../utils/specialTask");
const signupValidatorForEmail = require("../Validators/Validatorsfor Email");
exports.createAdmin = async (req, res) => {
  const newUser = req.body; 
  const isEmailRegistration = newUser.email && !newUser.mobile;
  const isPhoneRegistration = !newUser.email && newUser.mobile;
  try {
    let existingUser;
    if (newUser.referCode) {
      const referralChecker = await validateReferralCode(newUser.referCode);
      if (!referralChecker) {
        return res.json({ message: res.__('invalid_referral_code'), status: false });
      }
    }
    if (isEmailRegistration) {
      if (signupValidatorForEmail(newUser)) {
        return res.json({ message: res.__('invalid_email'), status: false });
      }
      existingUser = await UserexistanceChecker(newUser);
    } else if (isPhoneRegistration) {
      if (signupValidatorForMobile(newUser)) {
        return res.json({ message: res.__('Mobile number is invalid'), status: false });
      }
      existingUser = await UserexistanceChecker(newUser);
    } else {
      return res.json({ message: res.__('provide_email_or_phone'), status: false });
    }
    if (existingUser) {
      const errorMessage = isEmailRegistration ? res.__("user_already_exists_email") : res.__("user_already_exists_mobile");
      return res.json({ message: errorMessage, status: false });
    }
    const userId = isPhoneRegistration ? await User.mobilecreate(newUser) : await User.emailcreate(newUser);
    if (userId) {
      const code = generateReferralCode();
      await insertReferralCode(code, userId);
    }

    res.json({ status: true, message: res.__("signup_success") });
  } catch (error) {
    console.error('Error creating user:', error);
    res.json({ message: 'Internal server error', status: false });
  }
};
exports.signIn = async (req, res) => {
  const newSignin = req.body;
  const isEmailSignIn = newSignin.email && !newSignin.mobile;
  const isPhoneSignIn = !newSignin.email && newSignin.mobile;
  try {
    if (isEmailSignIn) {
      const { email, password } = newSignin;
      const userId = await User.signInByEmail(email, password);
      if (!userId) {
        return res.json({ message: res.__('invalid_credentials_email'), status: false });
      }
      res.json({message:res.__(userId.message),token:userId.token,status:userId.status});
    } else if (isPhoneSignIn) {
      const { mobile, password,deviceid } = newSignin;
      const Isactive=await User.isActive(mobile);
      if(Isactive){
        return res.json({message:"Account Deleted!.Please Contact support.",status:false})
      }
      const userId = await User.signInMobile(mobile, password,deviceid);
      if (!userId) {
        return res.json({ status: false, message: res.__("invalid_credentials_mobile") });
      }
      res.json({message:res.__(userId.message),token:userId.token,status:userId.status});
    } else {
      return res.json({ status: false, message: res.__("Please provide phoneNumber for Login") });
    }
  } catch (error) {
    console.error('Error signing in user:', error);
    res.json({ error: res.__('Internal server error') });
  }
};
exports.forgetPassword = async (req, res) => {
  const { email, mobile } = req.body;
  let searchField, searchValue;

  if (email) {
    searchField = 'email';
    searchValue = email;
  } else if (mobile) {
    searchField = 'mobile';
    searchValue = mobile;
  } else {
    return res.json({ message: res.__('email_or_mobile_required'), status: false });
  }
  try {
    const getUserQuery = `SELECT * FROM users WHERE ${searchField} = ?`;
    const [rows] = await pool.execute(getUserQuery, [searchValue]);
    if (rows.length === 0) {
      return res.json({ message: res.__("User not found!"), status: false });
    }
    const user = rows[0];
    const userkey = searchField === 'email' ? email : mobile;
    const otp = generateOTP();
    const data = await EmailVerificationToken.createToken(userkey, otp);
    if (!data) {
      return res.json({ status: false, message: res.__("Failed to create OTP") });
    }
    if (email) {
      return res.json({ status: true, OTP: otp, message: res.__("OTP sent to your email") });
    } else if (mobile) {
          return res.json({status: true, OTP: otp, message: res.__("OTP sent to your mobile") });
        }
  } catch (error) {
    console.error('Error processing password reset request:', error);
    return res.json({ status: false, message: res.__('Internal server error') });
  }
};
exports.resetPassword = async (req, res) => {
  const { email, mobile, newPassword,deviceid } = req.body;
  let searchField, searchValue;
  if (email) {
    searchField = 'email';
    searchValue = email;
  } else if (mobile) {
    searchField = 'mobile';
    searchValue = mobile;
  } else {
    return res.json({ message: res.__("email_or_mobile_required."), status: false });
  }
  try {    
    const getUserQuery = `SELECT * FROM users WHERE ${searchField} = ?`;
    const [rows] = await pool.execute(getUserQuery, [searchValue]);

    if (rows.length === 0) {
      return res.json({ message: res.__("User not found!"), status: false });
    }
    const user = rows[0];
    const id = user.id;
    const devideId=user.deviceid
    if(devideId!== deviceid){
      return res.json({ message:"Device is not same as singUp", status: false });
    }
    const passwordMatch = await bcrypt.compare(newPassword, user.password);
    if (passwordMatch) {
      return res.json({ message: res.__("The new password must be different from the old one!"), status: false });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);

    res.json({
      status: true,
      message:res.__("passwordChange_message"),
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.json({ error: res.__("An error occurred while resetting password.") });
  }
};
exports.sendOtp = async (req, res) => {
  const newUser = req.body;
  const isEmailRegistration = newUser.email && !newUser.mobile;
  const isPhoneRegistration = !newUser.email && newUser.mobile;

  try {
    let existingUser;
    const otp = generateOTP();

    if (isEmailRegistration) {
      const { email } = newUser;
      existingUser = await UserexistanceChecker(newUser);
      if (existingUser) return res.json({ status: false, message: res.__("User already exists") });

      const data = await EmailVerificationToken.createToken(email, otp);
      if (data) {
        return res.json({ status: true, OTP: otp, message: res.__("OTP sent to your email") });
      } else {
        return res.json({ status: false, message: res.__("Failed to create OTP") });
      }
    } else if (isPhoneRegistration) {
      const { mobile } = newUser;
      const mobileNumber = extractCountryCode(mobile);
      const RealMobileNum = Number(mobileNumber.localNumber);
      const realCountrycode = Number(mobileNumber.countryCode);

      existingUser = await UserexistanceChecker(newUser);
      if (existingUser) return res.json({ status: false, message: res.__("User already exists") });

      const data = await EmailVerificationToken.createToken(mobile, otp);
      if (data) {
        return res.json({ status: true, OTP: otp, message: res.__("OTP sent to your mobile") });
      } else {
        return res.json({ status: false, message: res.__("Failed to create OTP") });
      }
    } else {
      return res.json({ status: false, message: res.__("Please provide email or mobile") });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.json({ status: false, message: res.__('Internal server error') });
  }
};
exports.verifyOtp = async (req, res) => {
  const newUser = req.body;
  let isEmailRegistration = newUser.email && !newUser.mobile;
  let isPhoneRegistration = !newUser.email && newUser.mobile;
  try {
    if (!isEmailRegistration && !isPhoneRegistration) {
      return res.json({ message: res.__('provide_email_or_phone'), status: false });
    }
    let token = null;

    if (isEmailRegistration) {
      const otp = newUser?.otp;
      const userkey = newUser?.email;
      token = await EmailVerificationToken.compareToken(userkey, otp);
    } else {
      const otp = newUser?.otp;
      const userkey = newUser?.mobile;
      token = await EmailVerificationToken.compareToken(userkey, otp);
    }

    if (token) {
      res.json({ status: true, message: res.__('OTP verified successfully') });
    } else {
      res.json({ status: false, message: res.__('OTP expired or invalid OTP') });
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.json({ error: res.__('Internal server error') });
  }
};
exports.getUserInfo = async (req, res) => {
const {userId}=req.user;
  try {
    const selectQuery = `
SELECT
    u.id AS user_id,
    u.fname,
    u.lname,
    u.mobile,
    u.imageUrl,
    u.status,
    u.SponserCode,
    rc.code,
    MAX(CASE WHEN uw.coin_name = 'BNB' THEN uw.wallet_address END) AS bnb_wallet_address,
    MAX(CASE WHEN uw.coin_name = 'ETH' THEN uw.wallet_address END) AS eth_wallet_address
FROM
    users u
LEFT JOIN
    referral_codes rc ON u.id = rc.user_id
LEFT JOIN
    userWallet uw ON u.id = uw.user_id
WHERE
    u.id = ?
GROUP BY
    u.id, u.email, u.fname, u.lname, u.mobile, u.imageUrl, u.status, u.SponserCode, rc.code`
    const [rows] = await pool.execute(selectQuery, [userId ])
    return res.json({status:true,data:rows[0],message:res.__("User data fetched successfully")});
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.json({ message: res.__('Internal Server Error'),status:false });
  }
};
exports.changePassword = async (req, res) => {
  const { newPassword, oldpassword} = req.body;
  const {userId}=req.user;
  try {
    const getUserQuery = `SELECT * FROM users WHERE id = ?`;
    const [rows] = await pool.execute(getUserQuery, [userId]);

    if (rows.length === 0) {
      return res.json({ message: res.__("User not found!"), status: false });
    }
    const user = rows[0];
    const id = user.id;
    const passwordMatch = await bcrypt.compare(oldpassword, user.password);
    if (passwordMatch) {
      if(oldpassword==newPassword) return res.json({message:res.__("New password cannot be same as old password"),status:false});
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
      return res.json({
        status: true,
        message: res.__("Password changed successfully, now you can use your new password."),
      });
    } else {
      return res.json({ message: res.__("Invalid old password!"), status: false });
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    return res.json({ message: res.__("An error occurred while resetting password."), status: false });
  }
};
exports.deleteUser= async(req,res)=>{
  const {userId}=req.user;
  try {
    const query = `UPDATE users SET status='inactive'  WHERE id = ?`;
    const [rows, fields] = await pool.execute(query, [userId]);
    res.json({message:res.__("inactiveAccount"),status:true })
  } catch (error) {
    res.json({message:res.__( "internal_server_error"),status:false})
  }

}
const countryCodes = ['1', '91', '44', '33', '49', '81', '61',"63",'82'];
function extractCountryCode(phoneNumber) {
   
    for (let i = 3; i > 0; i--) {
        let possibleCountryCode = phoneNumber.substring(0, i);
        if (countryCodes.includes(possibleCountryCode)) {
            return {
                countryCode: possibleCountryCode,
                localNumber: phoneNumber.substring(i)
            };
        }
    }
    return {
        countryCode: '',
        localNumber: phoneNumber
    };
}

