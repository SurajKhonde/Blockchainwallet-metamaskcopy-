const express = require('express');
const pool=require("../config/poolConnection")
const router = express.Router();
const {isAuth} =require("../middleware/auth");
const { sendEthTransaction, sendBnbTransaction, sendBtcTransaction, sendSolTransaction ,sendTronTransaction} = require('../controllers/tranctionHandler'); 
const { validateTransaction } = require('../middleware/transctionvalidate');
router.post('/transfer',isAuth,validateTransaction, async (req, res) => {
    const {coin_shortName,from_address,to_address,amount} = req.body;
    try {
        let transactionHash;
        switch (coin_shortName) {
            case "ETH":
                transactionHash = await sendEthTransaction(coin_shortName,from_address,to_address,amount);
                break;
            case "TRON":
                transactionHash = await sendTronTransaction(coin_shortName,from_address,to_address,amount);                
                break;
            case "BNB":  
                transactionHash = await sendBnbTransaction(coin_shortName,from_address,to_address,amount);
                break;
            case "BTC":
                transactionHash = await sendBtcTransaction(coin_shortName,from_address,to_address,amount);
                console.log( transactionHash )
                break;
            case "SOL":
                transactionHash = await sendSolTransaction(coin_shortName,from_address,to_address,amount);
                break;
            default:
                return res.status(400).json({ message:'Unsupported coin',status:false, });
        };
        console.log(transactionHash.error)
        if(transactionHash.error) {
               console.log("jello")
            return res.json({message:transactionHash.error,status:false});
        };
        res.json({message:`transction done successfully` ,status:true});
    } catch (error) {
        console.error('Error sending transaction:', error);
        return res.json({ message:res.__('Internal Server Error'), status: false });
    }
});

router.get('/cryptotranction', isAuth, async (req, res) => {
    const {userId}=req.user;
    if (!userId) {
        return res.status(400).json({ message: res.__('Please provide user_id'), status: false });
    }

    try {
        const query = 'SELECT * FROM Clienttransaction WHERE client_id = ?'; 
        const [rows] = await pool.execute(query, [userId]);
        if (rows.length > 0) {
            res.json({ message: 'Transaction details fetched successfully', data: rows, status: true });
        } else {
            res.json({ message: 'No transactions found for the given user_id', status: false });
        }

    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return res.status(503).json({ message: res.__('Internal Server Error'), status: false });
    }
});
module.exports = router;
