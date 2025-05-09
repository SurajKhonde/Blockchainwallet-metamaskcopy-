require('dotenv').config();
const recipientAddress = process.env.ADMINWALLETADDRESS;
const Database =require('../config/poolConnection');
const { E_EthPassbook, PassbookEntery, ETHbalanceUser } = require('../utils/InsertionTransction');
const { sendEthTransaction } = require('./tranctionHandler');
const { AdmintouserEthTransaction } = require('../utils/Adminswap');
const { finalSettlementoftokens } = require('./TokenHandler');
const { getTokenBalanceCheck } = require('./BasecoinBalance');
exports.E_ethwalletcoinswap = async (req, res) => {
    const { amount,from} =req.body;
    const { userId } = req.user;
    switch (from) {
        case "ETH":
            try {
                const [userWallets] = await Database.execute(
                    'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?', 
                    [userId, "ETH"]
                );
                if (userWallets.length === 0) {
                    return res.json({ message: res.__("EthNotFound"),status: false });
                }
                const userWalletAddress = userWallets[0].wallet_address;
                const stakeFeesTransaction = await sendEthTransaction("ETH", userWalletAddress,recipientAddress,amount);
                if(stakeFeesTransaction.status){
                    const passbookData = await E_EthPassbook(userId, amount);
                    const passbookEntry = await PassbookEntery(userId, amount, 'swap',"E_ETH");
                    return res.json({ message: " done successfully", status: true });
                }
                    return res.json({ message: stakeFeesTransaction.message, status: false });
            } catch (error) {
                console.error(error);
                return res.status(500).json({ message: "An error occurred", error: error.message });
            }
            case "E_ETH":
                try {
                    const WalletEthbalance= await ETHbalanceUser(userId,"E_ETH");
                    if(WalletEthbalance<Number(amount)){
                        return res.json({ message:"Swappble Amount Must be less than Account balance",status: false });
                    };
                    const [userWallets] = await Database.execute(
                        'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?', 
                        [userId, "ETH"]
                    );
                    if (userWallets.length === 0) {
                        return res.json({ message: res.__("EthNotFound"), status: false });
                    }
                    const userWalletAddress = userWallets[0].wallet_address;
                    const stakeFeesTransaction = await AdmintouserEthTransaction("ETH",userWalletAddress,amount,userId);
                    if(stakeFeesTransaction.status){
                        const passbookData = await E_EthPassbook(userId, amount);
                        const passbookEntry = await PassbookEntery(userId, -amount, "swap", "E_ETH");
                        return res.json({ message: "Swap done successfully", status: true });
                    };
                        return res.json({ message: res.__("Transaction Unsuccessful."), status: false });
                } catch (error) {
                    console.error(error);
                    return res.status(500).json({ message: "An error occurred", error: error.message });
                };
                case "E_CTC7":
                    try {
                        const ECTCbalance= await ETHbalanceUser(userId,"E_CTC7");
                        if(ECTCbalance<Number(amount)){
                            return res.json({ message:"Swappble Amount Must be less than Account balance",status: false });
                        };
                        const [userWallets] = await Database.execute(
                            'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?', 
                            [userId, "BNB"]
                        );
                        if (userWallets.length === 0) {
                            return res.json({ message: res.__("EthNotFound"),status: false });
                        }
                        
                        const userWalletAddress = userWallets[0].wallet_address;
                        const data={token_name:"E_CTC7",toAddress:userWalletAddress,widrawlAmount:amount}
                        const stakeFeesTransaction = await finalSettlementoftokens(data);
                        if(stakeFeesTransaction.status){
                            const passbookData = await E_EthPassbook(userId, amount);
                            const passbookEntry = await PassbookEntery(userId, -amount,'swap',"E_CTC7");
                            return res.json({ message: "Swap done successfully", status: true });
                        }
                            return res.json({ message: stakeFeesTransaction.message, status: false });
                    } catch (error) {
                        console.error(error);
                        return res.status(500).json({ message: "An error occurred", error: error.message });
                    }                 
        default:
            return res.json({"message":"please select valid token for transfer ",status:false})
    }
};
exports.etokoenTransferbalance=async(req,res)=>{
    const{userId} =req.user;
    const {token_name}=req.body;
    console.log(token_name)
   switch (token_name) {
    case "E_ETH":
         try {
            const Ethbalance= await ETHbalanceUser(userId,"E_ETH");
            const Convertedbalance= String(Number(Ethbalance).toFixed(4))
            const [userWallets] = await Database.execute(
                'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?', 
                [userId, "ETH"])
                if (userWallets.length === 0) {
                    return res.json({ message: res.__("EthNotFound"),status: false });
                }
                const userWalletAddress = userWallets[0].wallet_address;
            const ReatEthbalance =await getTokenBalanceCheck("ETH",userWalletAddress);
            const fixedbalance =String(Number(ReatEthbalance.ETH).toFixed(4))

             return res.json({data:{"token_balance":fixedbalance,"E_token_balance":Convertedbalance,status:true}})
         } catch (error) {
            console.log("etokoenTransferbalance is habe ");
         }
         case "E_CTC7":
            try {
               const Ethbalance= await ETHbalanceUser(userId,"E_CTC7");
               const Convertedbalance= String(Number(Ethbalance).toFixed(4))
             return  res.json({data:{"E_token_balance":Convertedbalance,status:true}})
            } catch (error) {
               console.log("etokoenTransferbalance is habe ");
            }
       
    default:
       return res.json({data:"please send valid token_name", status:true})
   }
};