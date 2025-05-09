const pool = require('../config/poolConnection');
require('dotenv').config();
const UserexistanceChecker = require("../utils/specialTask");
const userStakeChecker =require('../utils/StakeChecker')
const {generateOTP} = require("../utils/otp");
const EmailVerificationToken = require("../models/Emailverification");
 const AdminWalletAddress=process.env.ADMINWALLETADDRESS
const MessenteApi = require("messente_api");
const { transferToken, finalSettlementoftokens } = require('./TokenHandler');
const { getTokenBalanceCheck } = require('./BasecoinBalance');
const { sendEthTransaction } = require('./tranctionHandler');
const {PassbookEntery, ETHbalanceUser } = require('../utils/InsertionTransction');
const defaultClient = MessenteApi.ApiClient.instance;
      const basicAuth = defaultClient.authentications["basicAuth"];
      basicAuth.username = "ca2801d80eaf4dbe8280175a580dc622";
      basicAuth.password = "4858ca90723246408adde98481e145e0";
      const api = new MessenteApi.OmnimessageApi();
exports.UserStake = async (req, res) => {
    const { quantity, level } = req.body;
    if (quantity === undefined || level === undefined) {
        return res.status(400).json({ message: res.__('Missing required fields'),status:false });
    }
    if (isNaN(quantity) || isNaN(level)) {
        return res.json({ message: res.__( "Q&Token"),status:false });
    }
    const quantityNum = Number(quantity);
    const levelNum = Number(level);
    const eth_fee = 0.02;
    const staking_days = 180;
    const total_staking_fee_percent = (quantityNum / 1000) * 0.0060;
    const eth_daily_payment = (quantityNum / 1000) * 0.000033333000000000;
    const ctc7_daily_payment_percent = (quantityNum / 1000) * 0.50;
    const status = 'active'; 
    try {
        const query = `
            INSERT INTO staking_package (quantity, eth_fee, staking_days, total_staking_fee_percent, eth_daily_payment, ctc7_daily_payment_percent, level, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        pool.query(query, [quantityNum, eth_fee, staking_days, total_staking_fee_percent, eth_daily_payment, ctc7_daily_payment_percent, levelNum, status], (error, results) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).json({ error: 'Database error' });
            }
             return res.status(201).json({ message: res.__("packageBought"), status: true });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Unexpected error occurred' });
    }
};
exports.createTransaction = async (req, res) => {
    const { user_id, amount, trans_type, token_name,user_staking_id} = req.body;
    if (user_id === undefined || amount === undefined || trans_type === undefined || token_name === undefined ) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (isNaN(user_id) || isNaN(amount)) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    const userId = Number(user_id);
    const amountValue = Number(amount);
    const userStakingId = Number(user_staking_id);
    const tx_id =""
    try {
        const query = `
            INSERT INTO etoken_transactions (user_id, amount, trans_type, token_name, user_staking_id, tx_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        pool.query(query, [userId, amountValue, trans_type, token_name, userStakingId, tx_id], (error, results) => {
            if (error) {
                console.error('Error inserting data:', error);
                return res.status(500).json({ error: 'Database error' });
            }

            res.status(201).json({ message: 'Transaction created successfully', status: true });
        });
    } catch (error) {
        console.error('Unexpected error:', error);
        res.status(500).json({ error: 'Unexpected error occurred' });
    }
};
exports.sendOtpforStake = async (req, res) => {
    const newUser = req.body;
    const isPhoneRegistration = !newUser.email && newUser.mobile;
    try {
        if (isPhoneRegistration) {
            const { mobile } = newUser;
            const userkey = mobile; 
            const otp = generateOTP();
            const existingUser = await UserexistanceChecker(newUser);
            if (existingUser && existingUser.id) {
                const user_id = existingUser.id;
                const userdata = await userStakeChecker(user_id);
                if (userdata) {
                    const data = await EmailVerificationToken.createToken(userkey, otp);

                    if (data) {
                        return res.json({ status: true, message: ' your OTP is', OTP:otp })
                    } else {
                        return res.json({ status: false, message: 'Failed to create OTP token' });
                    }
                } else {
                    return res.json({ status: false, message: 'Sponsor does not exist on our platform' });
                }
            } else {
                return res.json({ status: false, message:'sponser is not Exist' });
            }
        } else {
            return res.json({ status: false, message: 'Mobile number is required for phone registration' });
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        return res.json({ status: false, message: 'Internal server error' });
    }
};
exports.UserStakebuyer = async (req, res) => {
    const { token_name, referral_id, staking_package_id, amount } = req.body;
    const { userId } = req.user;
    try {
        if (!token_name || !referral_id || !staking_package_id || !amount) {
            return res.status(400).json({message: 'Required fields are missing',status:false });
        };
        const [tokens] = await pool.execute('SELECT * FROM staking_package WHERE id = ?', [staking_package_id]);
        if (tokens.length === 0) {
            return res.status(404).json({message: 'Staking package not found',status:false });
        };
        const token = tokens[0];
        const ethFee = parseFloat(token.eth_fee);
        const adminEthFees = ethFee;
        let sponsorIncome ;
        if(token?.level>3){  
            sponsorIncome = ethFee*0.25;
        }else{
            sponsorIncome = ethFee*0.25;
        }
        const ctc7DailyPaymentPercent = parseFloat(token.ctc7_daily_payment_percent) / 100;
        const receivedEthRoi = token.eth_daily_payment;
        const receivedCtc7Roi = amount * ctc7DailyPaymentPercent;
        const stakingDays = token.staking_days;
        const [userWallets] = await pool.execute('SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?', [userId, "ETH"]);
        if (userWallets.length === 0) {
            return res.status(404).json({ message:res.__("EthNotFound"),status:false});
        };
        const userWalletAddress = userWallets[0].wallet_address;
        const ethUserBalance = await getTokenBalanceCheck("ETH", userWalletAddress);
        if (ethUserBalance < ethFee) {
            return res.json({ message: res.__("DifficiencyETH"), status: false });
        }
        const adminEthFeesInWei = String(adminEthFees);
        const sponsorIncomeInWei = String(sponsorIncome);
        console.log("##001")
        const stakeFeesTransaction = await sendEthTransaction("ETH", userWalletAddress, AdminWalletAddress, adminEthFeesInWei);
        if (stakeFeesTransaction.message !== 'Transaction successful') {
            return res.json({ message: res.__("Etranscfailed"), status: false });
        }
        console.log("##002")
        await PassbookEntery(referral_id, sponsorIncomeInWei, "referral_bonus", 'E_ETH');
        await PassbookEntery(userId,-ethFee, "staking_fee", 'E_ETH');
        console.log("##003")
        console.log("##004")
        const data = { token_name, userId, toAddress: AdminWalletAddress, amount };
        const responseForAdmin = await transferToken(data);
        console.log("##005")
        if (responseForAdmin.status === true) {
            await pool.execute(`
                INSERT INTO user_staking (user_id, referral_id, staking_package_id, amount, received_eth_roi, received_ctc7_roi, sent_roi_days)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, referral_id, staking_package_id, amount, receivedEthRoi, receivedCtc7Roi, stakingDays]
            );
            return res.status(200).json({ message:res.__('stake_bought'), status: true });
        } else {
            return res.status(500).json({ message: res.__("failedStake"), status: false });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Unexpected error occurred' });
    }
};
exports.userStakeHisory= async (req, res) => {
    const { userId } = req.user;
    try {
        const query = 'SELECT * FROM user_staking WHERE user_id = ? ORDER BY created_at DESC'; 
        const [rows] = await pool.execute(query, [userId]);
        if (rows.length > 0) {
            const referralIds = [...new Set(rows.map(row => row.referral_id))];
            if (referralIds.length > 0) {
                const userQuery = `SELECT id, fname FROM users WHERE id IN (${referralIds.join(',')})`;
                const [users]= await pool.execute(userQuery);
                const referralMap = users.reduce((map, user) => {
                    map[user.id] = `${user.fname}`;
                    return map;
                }, {});
                rows.forEach(row => {
                    row.sponsorName = referralMap[row.referral_id] || 'sanjay';
                });
                
                res.json({
                    message: 'Estake History fetched successfully',
                    data: rows,
                    status: true
                });
            } else {
                res.json({
                    message: 'No referral IDs found',
                    status: false
                });
            }
        } else {
            res.json({
                message: 'No Estake History for the given user_id',
                status: false
            });
        }
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return res.status(503).json({
            message: res.__('Internal Server Error'),
            status: false
        });
    }
};
exports.userstakes = async (req, res) => {
    const { userId } = req.user;
    const { page } = req.body;
    const quantity = 5;
    const offset = (page - 1) * quantity;

    try {

        const query = `
            SELECT 
                sum(If(token_name='E_ETH',amount,0)) as E_ETH,
                sum(If(token_name='E_CTC7',amount,0)) as E_CTC7,
                date(created_at) as timeoftransaction,
                trans_type
            FROM etoken_transactions 
            WHERE user_id = ? 
            AND trans_type IN ('staking_referral','daily_roi')  
            GROUP BY date(created_at), trans_type 
            LIMIT ? OFFSET ?;
        `;
        const [rows] = await pool.query(query, [userId, quantity, offset]);


        const nextOffset = page * quantity;
        const nextQuery = `
            SELECT 
                sum(If(token_name='E_ETH',amount,0)) as E_ETH,
                sum(If(token_name='E_CTC7',amount,0)) as E_CTC7,
                date(created_at) as timeoftransaction,
                trans_type
            FROM etoken_transactions 
            WHERE user_id = ? 
            AND trans_type IN ('staking_referral','daily_roi')  
            GROUP BY date(created_at), trans_type 
            LIMIT ? OFFSET ?;
        `;
        const [nextRows] = await pool.query(nextQuery, [userId, quantity, nextOffset]);
        const isLastPage = nextRows.length === 0;

        const Countquery = `
            SELECT 
                sum(If(token_name='E_ETH',amount,0)) as E_ETH,
                sum(If(token_name='E_CTC7',amount,0)) as E_CTC7,
                date(created_at) as timeoftransaction,
                trans_type
            FROM etoken_transactions 
            WHERE user_id = ? 
            AND trans_type IN ('staking_referral','daily_roi')  
            GROUP BY date(created_at), trans_type;
        `;
        const [CountnextRows] = await pool.query(Countquery, [userId]);
        const totalCount = CountnextRows.length;
        const totalPages = Math.ceil(totalCount / quantity);

        const updatedRows = rows.map(row => ({
            ...row,
            partner: "",  
            trans_type: undefined  
        }));

        res.json({
            message: 'E-token transactions fetched successfully',
            data: updatedRows,
            status: true,
            isLastPage,
            totalPages 
        });

    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return res.status(503).json({
            message: 'Internal Server Error',
            status: false
        });
    }
};
exports.userInvestment = async (req, res) => {
    const { userId } = req.user;
    try {
        const combinedQuery = `
            SELECT 
                u.id AS investment_id,
                u.user_id,
                u.staking_package_id AS Stake_id,
                u.amount AS InvestedAmount,
                u.received_eth_roi AS E_ETH,
                u.received_ctc7_roi AS E_CTC7,
                u.sent_roi_days AS Remaning_Days,
                COALESCE(SUM(t.amount), 0) AS ETH_SponsorIncome
            FROM 
                user_staking u
            LEFT JOIN 
                etoken_transactions t ON u.user_id = t.user_id AND t.trans_type = 'staking_referral'
            WHERE 
                u.user_id = ?
            GROUP BY 
                u.id`;
        const [results] = await pool.execute(combinedQuery, [userId]);
        if (results.length === 0) {
            console.log('No user Stake Yield yet');
            return res.json({ message: 'No users to update', status: false });
        }
        return res.json({ message: results, status: true });
    } catch (error) {
        console.error('Error fetching user investment data:', error);
        return res.json({ message: 'Error fetching user investment data', status: false });
    }
};
exports.finalTransferToken = async (req, res) => {
    const { investment_id, token_name } = req.body;
    const { userId } = req.user;
    let WalletAddress;
    try {
        const Wallet_address = `SELECT wallet_address FROM userWallet WHERE user_id=? AND coin_name='BNB'`;
        const [wallet] = await pool.query(Wallet_address, [userId]);
        WalletAddress = wallet[0].wallet_address;
        const userStake = `SELECT staking_package_id, amount, received_ctc7_roi FROM user_staking WHERE user_id=? AND id=? AND iswidrawl_stake ='false'`;
        const [stakes] = await pool.query(userStake, [userId, investment_id]);
        let widrawlAmount = stakes[0].received_ctc7_roi + stakes[0].amount;
        const Stake_id = stakes[0].staking_package_id;
        const ethAmount_final = `SELECT total_staking_fee_percent FROM staking_package WHERE id=?`;
        const [final_ethAmount] = await pool.query(ethAmount_final, [Stake_id]);
        const data = { token_name, userId, toAddress: WalletAddress, widrawlAmount };
        const responseForAdmin = await finalSettlementoftokens(data);
        if (responseForAdmin.status === true) {
            const lastEthearned = final_ethAmount[0].total_staking_fee_percent;
            const StatusUpdate = `UPDATE user_staking SET iswidrawl_stake='true' WHERE user_id=? AND id=?`;
            await pool.query(StatusUpdate, [userId, investment_id]);
            await PassbookEntery(userId, -widrawlAmount, 'stake_finished', token_name);
            await PassbookEntery(userId, lastEthearned, 'stake Earned E_ETH', 'E_ETH');
            return res.json({ message: "amount is distributed", status: true });
        } else {
            return res.json({ message: "Right now we are facing an issue, please try again later", status: false });
        }
    } catch (error) {
        console.log("error is here ", error);
        return res.status(500).json({ message: "Internal server error", status: false });
    }
};
exports.updatedStakework = async (req, res) => {
    const { token_name, referral_id, staking_package_id, amount } = req.body;
    const { userId } = req.user;
    try {
        if (!token_name || !referral_id || !staking_package_id || !amount) {
            return res.json({ message: 'Required fields are missing',status:false });
        };
        const [tokens] = await pool.execute('SELECT * FROM staking_package WHERE id = ?', [staking_package_id]);
        if (tokens.length === 0) {
            return res.json({ message: 'Staking package not found',status:false });
        };
        const token = tokens[0];
        const ethFee = parseFloat(token.eth_fee);
        let sponsorIncome ;
        if(token?.level>3){  
            sponsorIncome = ethFee*0.25;
        }else{
            sponsorIncome = ethFee*0.20;
        }
        const user_balance=await ETHbalanceUser(userId,"E_ETH");
        
        if(Number(ethFee) > Number(user_balance)){
            return  res.json({message:"You don't have sufficent E-ETH balance please E-swap first get E-Eth",status:false})
        };
        const ctc7DailyPaymentPercent = parseFloat(token.ctc7_daily_payment_percent) / 100;
        const receivedEthRoi = token.eth_daily_payment;
        const receivedCtc7Roi = amount * ctc7DailyPaymentPercent;
        const stakingDays = token.staking_days;
        const sponsorIncomeInWei = String(sponsorIncome);
        
        const data = { token_name, userId, toAddress: AdminWalletAddress, amount };
        const responseForAdmin = await transferToken(data);
        if (responseForAdmin.status === true) {
            await PassbookEntery(referral_id, sponsorIncomeInWei, "referral_bonus",'E_ETH');
            await PassbookEntery(userId,-ethFee, "staking_fee", 'EETH');
            await pool.execute(`
                INSERT INTO user_staking (user_id,referral_id,staking_package_id, amount, received_eth_roi, received_ctc7_roi, sent_roi_days)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [userId, referral_id, staking_package_id, amount, receivedEthRoi, receivedCtc7Roi, stakingDays]
            );
            return res.status(200).json({ message:res.__('stake_bought'), status: true });
        } else {
            return res.status(403).json({ message: res.__("failedStake"), status: false });
        };
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ error: 'Unexpected error occurred' });
    }
};