
const express = require('express');
const pool = require('../config/poolConnection');
const multer = require('multer');
require('dotenv').config();
const path = require('path');
const baseUrl =process.env.BASEURL;
const {
  createAdmin,
  signIn, 
  forgetPassword,
  resetPassword,
  sendOtp,
  verifyOtp,
  getUserInfo,
  changePassword,
  deleteUser
} = require('../controllers/Adminsign');
const router = express.Router();
const {
  validate,
  validateRegistrationFields,
  signInValidator,
  validatePassword
} = require('../middleware/validator');
const { isAuth } = require('../middleware/auth');
router.post('/registerUser', validateRegistrationFields, validate, createAdmin);
router.post('/signIn', signInValidator, validate, signIn);
router.post('/sendOtp', sendOtp);
router.post('/verifyOtp', verifyOtp);
router.post('/getUserDetails', isAuth, getUserInfo);
router.post('/forgotOtp', forgetPassword);
router.post('/reset-password', validatePassword, resetPassword);
router.post('/changePassword', isAuth, validatePassword, changePassword);
router.get('/deleteAccount',isAuth,deleteUser)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });
const baseurl = `${baseUrl}/uploads/`;
router.post('/uploadProfile', isAuth, upload.single('userImage'), async (req, res) => {
  if (req.file) {
    const imageUrl = `${baseurl}${req.file.filename}`;
    const { userId } = req.user;
    try {
      await pool.query('UPDATE users SET imageUrl = ? WHERE id = ?', [imageUrl, userId]);
      res.json({message:"Profile image uploaded successfully",status:true});
    } catch (error) {
      console.error('Error updating image URL in database:', error);
      res.status(500).send('Internal server error');
    }
  } else {
    res.status(400).send('No file uploaded.');
  }
});
router.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

module.exports = router;
