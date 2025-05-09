const pool = require('../config/poolConnection');
const express = require("express");
const {isAuth} =require("../middleware/auth");
const { UserStake, sendOtpforStake,userstakes,userStakeHisory, updatedStakework} = require("../controllers/StakeHandler");

const router = express.Router();
router.post("/insertstaking-packages",isAuth,UserStake);
router.post('/sendOtpforStake',isAuth,sendOtpforStake);
router.post('/stakingRewardHistory',isAuth,userstakes);
router.get('/staking-packages',isAuth, async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM staking_package');
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });
  router.post('/buyStakes',isAuth,updatedStakework);
  router.get('/stakeHistory',isAuth,userStakeHisory);
module.exports = router;