const Database = require('../config/poolConnection');
const ethers = require('ethers');
require('dotenv').config();

const CommomAbi = [
    {"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":false,"inputs":[{"name":"spender","type":"address"},{"name":"tokens","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},
    {"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":false,"inputs":[{"name":"from","type":"address"},{"name":"to","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},
    {"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_subtractedValue","type":"uint256"}],"name":"decreaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},
    {"constant":true,"inputs":[{"name":"tokenOwner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":false,"inputs":[{"name":"to","type":"address"},{"name":"tokens","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},
    {"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_addedValue","type":"uint256"}],"name":"increaseApproval","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},
    {"constant":true,"inputs":[{"name":"tokenOwner","type":"address"},{"name":"spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},
    {"constant":false,"inputs":[{"name":"_newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},
    {"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"}],"name":"OwnershipTransferred","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"tokens","type":"uint256"}],"name":"Transfer","type":"event"},
    {"anonymous":false,"inputs":[{"indexed":true,"name":"tokenOwner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"tokens","type":"uint256"}],"name":"Approval","type":"event"}
  ];
const providerMap = {
    ETH: process.env.RPC_ETH ,
    BSC: 'https://bsc-testnet-rpc.publicnode.com/'
  };

exports.TokenFetcher = async ({token_name, userId}) => {
    
    const Tokendetails = `SELECT token_address, blockchain FROM token WHERE token_name = ?`;
    
    try {
        const [results] = await Database.query(Tokendetails, [token_name]);
      
        if (results.length === 0) {
            return { message: "Please select a valid Token", status: false };
        }

        const token_address = results[0].token_address;
        const blockchain = results[0].blockchain;
        const provider = new ethers.JsonRpcProvider(providerMap[blockchain]);
        const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
        const [wallets] = await Database.execute(userWalletSql, [userId, "BNB"]);
        
        const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;

        if (wallet_address) {
            try {
               
                const ethTokenContract = new ethers.Contract(token_address, CommomAbi, provider);
                console.log(ethTokenContract,"hello");

                const rawETHtokenBalance = await ethTokenContract.balanceOf(wallet_address);
                const balance =ethers.formatUnits(rawETHtokenBalance, 'ether');
                return { balance, status: true };
            } catch (contractError) {
                console.error('Contract interaction error:', contractError);
                return { message: 'Failed to interact with the contract', status: false };
            }
        } else {
            return { message: 'At least you have BNB & ETH Address', status: false };
        }
    } catch (dbError) {
        console.error('Database error:', dbError);
        return { message: 'Failed to retrieve wallet address', status: false };
    }
};
exports.TokenAdressFetcher = async ({token_name, userId}) => {
    console.log(token_name, userId)
    const Tokendetails = `SELECT blockchain FROM token WHERE token_name = ?`;
    try {
        const [results] = await Database.query(Tokendetails, [token_name]);
      
        if (results.length === 0) {
            return { message: "Please select a valid Token", status: false };
        }
        const blockchain = results[0].blockchain;
        const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND wallet_type = ?';
        const [wallets] = await Database.execute(userWalletSql, [userId,blockchain]);        
        const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;

        if (wallet_address) {
            return { wallet_address,status:true};
        } else {
            return { message: 'At least you have BNB & ETH Address', status: false };
        }
    } catch (dbError) {
        console.error('Database error:', dbError);
        return { message: 'Failed to retrieve wallet address', status: false };
    }
};
