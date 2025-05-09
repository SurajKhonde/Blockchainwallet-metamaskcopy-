const Wallet = require('../models/WalletModel');
const pool = require('../config/poolConnection');
const checkWalletAddress = require('./walletAdressexistst');
const generateWallet = async (coin_shortName,user_id,coin_id,chain_type, private_key,wallet_address,wallet_name) => {

    try {
        if (!user_id || !coin_id || !chain_type||!wallet_name) {
            return {error:'Missing required fields'};
        };
        if (wallet_address && private_key) {
            const data= await checkWalletAddress(wallet_address);
            console.log(data)
            if( await checkWalletAddress(wallet_address)){
             return {error:'Wallet address already exist'} 
            };
            const wallet = new Wallet({
                user_id: user_id,
                coin_id: coin_id,
                wallet_address: wallet_address,
                private_key: private_key,
                wallet_type: chain_type,
                wallet_name:wallet_name,
                coin_name:coin_shortName,
            });
            console.log(wallet)

            const query = `INSERT INTO userWallet (user_id,coin_id,wallet_address,private_key,wallet_type,wallet_name,coin_name) VALUES (?, ?, ?, ?, ?,?,?)`;
            const values = [wallet.user_id, wallet.coin_id, wallet.wallet_address, wallet.private_key,wallet.wallet_type,wallet.wallet_name,wallet.coin_name];
            const [result] = await pool.execute(query, values);
            return { message: 'Wallet created successfully', wallet: wallet_address,status:true };
        } else {
            return {message:'Failed to generate wallet address and private key',status:false};
        }
    } catch (error) {
        console.error('Error creating Wallet address:', error);
        return res.status(500).json('Internal Server Error');
    }
};
module.exports = generateWallet;
