const express = require("express");
const {isAuth} =require("../middleware/auth");
const { insertCrypto,insertUserCoinAccess,AccessCoins} = require("../controllers/BaseCoinHandler");
const { validateCryptocurrency } = require("../middleware/cryptoChain");
const { insertToken ,getAllTokens,getSwapCoinList, getParticularTokenBalance, existTokenname, fetchWalletAddress, tokentransferuser } = require("../controllers/TokenHandler");
const {InsertPrivateTokens } = require("../controllers/ErcTokenFetcher");
const router = express.Router();
router.post("/insertCrypto",isAuth, validateCryptocurrency,insertCrypto);
router.get("/getCoins",isAuth,AccessCoins)
router.post("/insertToken",isAuth,insertToken);
router.get("/getTokens",isAuth,getAllTokens);
router.post("/coinAccess",isAuth,insertUserCoinAccess);
router.get('/swapableCoin',isAuth,getSwapCoinList);
router.get('/getAllExistUserToken',isAuth,existTokenname);
router.post("/getTokenBalance",isAuth,getParticularTokenBalance);
router.post('/tokenWalletAddress',isAuth,fetchWalletAddress);
router.post('/transferToken',isAuth,tokentransferuser);
router.post('/AddPrivateToken',isAuth,InsertPrivateTokens)
module.exports = router;