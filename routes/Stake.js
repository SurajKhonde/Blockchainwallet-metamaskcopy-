const express = require('express');
const { userInvestment, finalTransferToken } = require('../controllers/StakeHandler');
const { isAuth } = require('../middleware/auth');
const router = express.Router();
router.get('/user_Investment',isAuth,userInvestment);
router.post('/widrawl_stake_&_referal',isAuth,finalTransferToken);
module.exports = router;