const express = require("express");
const multer = require('multer');
const{isAuth} =require("../middleware/auth");
 const router = express.Router();
 require('dotenv').config();
const path = require('path');
const baseUrl =process.env.BASEURL;
const { createWallet,getUserWalletByUserId,getUserPrivateKey ,getUserPrivateKeybywalletAdress} = require("../controllers/BaseCoin");
const { validateWalletAddress } = require("../middleware/walletVerify");
const { getTokenBalance } = require("../controllers/BasecoinBalance");
const { getWalletAddressByPrivateKey } = require("../controllers/BaseCoinAccessByPrivateKey");
const { getbalncebyuser } = require("../controllers/BaseCoinHandler");
const { transferToken } = require("../controllers/Userswap");
const { E_ethwalletcoinswap,etokoenTransferbalance} = require("../controllers/E_ETHhandler");
router.post("/walletgenrator",isAuth,createWallet);
router.post("/getwalletdetails",isAuth,getUserWalletByUserId);
router.get("/accessprivateKey",isAuth,getUserPrivateKey);
router.post("/accesskeyByWallet",isAuth,getUserPrivateKeybywalletAdress);
router.post("/getBalance",isAuth,validateWalletAddress,getTokenBalance);
router.post("/accesswalletbykey",isAuth,getWalletAddressByPrivateKey);
router.get("/getuserbalance",isAuth,getbalncebyuser);
router.post('/swapToken',isAuth,transferToken);
router.post('/eswap_token',isAuth,E_ethwalletcoinswap);
router.post('/getTransEthbalance',isAuth,etokoenTransferbalance)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public/TokenImages'));
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = multer({ storage: storage });
  const baseurl = `${baseUrl}/TokenImages/`;
  router.post('/uploadToken', isAuth, upload.single('tokenImage'), async (req, res) => {

    const { Etoken_symbol, Etoken_name, Eblockchain } = req.body;

    if (!Etoken_name || !Etoken_symbol) {
      return res.status(400).send('	Etoken_name and Etoken_symbol are required.');
    }
    let imageUrl = null;
    if (req.file) {
      imageUrl = `${baseurl}${req.file.filename}`;
    }

    try {
      const query = `
        INSERT INTO EToken (Etoken_name, Etoken_symbol, Eblockchain, Elogo_url)
        VALUES (?, ?, ?, ?)
      `;
      
      await pool.query(query, [	Etoken_name,Etoken_symbol, Eblockchain || null, imageUrl || null]);
      
      res.json({ message: "Token details uploaded successfully", status: true });
    } catch (error) {
      console.error('Error inserting token details into database:', error);
      res.status(500).send('Internal server error');
    }
  });
  
module.exports = router;