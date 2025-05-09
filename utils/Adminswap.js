require('dotenv').config();
const {insertClientTransaction} = require('./TransctionDatamanager.js');
const { getTokenBalanceCheck } = require('../controllers/BasecoinBalance.js');
const rpcurl=process.env.RPC_URLETH;
const AdminPrivateKey=process.env.ADMINWALLETPRIVATEKEY;
const AdminWalletKey=process.env.ADMINWALLETADDRESS;
const ethers = require('ethers');
exports.AdmintouserEthTransaction = async(coin_shortName,to_address, amount,userId)=> {
    if (!ethers.isAddress(to_address)) {
      return { message: "Invalid receiver address", status: false };
    }
    const provider = new ethers.JsonRpcProvider(rpcurl);
    const wallet = new ethers.Wallet(AdminPrivateKey, provider);  
    const ethUserBalance = await getTokenBalanceCheck("ETH", wallet?.address);
    if (ethUserBalance.ETH < amount+(amount*0.001)) {
        return { error: 'Admin server is Busy With Another Transction'};
    }
    try {
      const [gasEstimate, feeData] = await Promise.all([
        provider.estimateGas({
          to: to_address,
          value: ethers.parseUnits(amount, 'ether'),
        }),
        provider.getFeeData(),
      ]);
      const gasPrice = feeData.gasPrice || ethers.parseUnits('50', 'gwei');
      const tx = {
        to: to_address,
        value: ethers.parseUnits(amount, 'ether'),
        gasLimit: gasEstimate,
        gasPrice: gasPrice,
      };
      const txResponse = await wallet.sendTransaction(tx);
      console.log("Transaction Response:", txResponse);
  
      const receipt = await txResponse.wait();
      if (receipt && receipt.hash) {
        const gasCost = gasEstimate*gasPrice; 
        const transactionData = {
          coin_shortname: coin_shortName,
          client_id:userId,
          transaction_hash: receipt.hash,
          amount: amount,
          receiver_wallet_address: to_address,
          sender_wallet_address: AdminWalletKey,
          transaction_fees: ethers.formatUnits(gasCost, 'gwei'),
        };
        await insertClientTransaction(transactionData);
      }
      return { message:'Transaction successful', status: true };
  
    } catch (error) {
      console.error('Transaction failed:', error);
      return { message: 'Transaction failed', status: false };
    }
  };