const ethers = require('ethers');
require('dotenv').config();
const Webprovider=process.env.PROVIDER_URL
const provider = new ethers.JsonRpcProvider(Webprovider);
const EthcontractABI =process.env.ETHWALLETABI;
const EthcontractAddress =process.env.ETHCONTR;
const recipientAddress = process.env.ADMINWALLETADDRESS;
const CtcContractAddress=process.env.CTCWALLETADDRESS;
const CtcContractAbi= process.env.CTCWALLETABI;
const Tp3ContractAddress=process.env.TP3CONTRACTADDRESS;
const Tp3ContractABI=process.env.TP3CONTRACTABI;
const McContractAddress =process.env.MCETH_CONTRACTADDRESS;
const McContractAbi=process.env.MCETH_CONTRACTABI;
const database = require('../config/poolConnection');
const privateKeyAccess = require('../utils/PrivatekeyFetcher');
const { PassbookEntery, ETHbalanceUser } = require('../utils/InsertionTransction');
const AdminPrivateKey=process.env.ADMINWALLETPRIVATEKEY;
exports.transferToken = async (req, res) => {
    const { amount,eth_token,bsc_token} = req.body;
    console.log(amount, eth_token,bsc_token )
    const { userId } = req.user;
    if( Number(amount)<1){
        return res.json({ "message":res.__("MimstakeAmount"), status: false });
    };
    const userE_ethbalance =await ETHbalanceUser(userId);
    if(userE_ethbalance<0.01){
        return({message:res.json("Insufficent E_ETH balance please swap and add more Eth balance ")})
    };
     await PassbookEntery(userId,-0.01,'swap_fees','E_ETH')
    switch (eth_token) {
        case "E_ETH":
            try {
                const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                const [wallets] = await database.execute(userWalletSql, [userId, "BNB"]);
                const walletAddress = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                if (!walletAddress) {
                    return res.json({"message":res.__('EthNotFound'), status: false });
                }
                const walletKey = await privateKeyAccess(walletAddress);
                if (!walletKey || !walletKey.private_key) {
                    return res.json({ "message": "Failed to retrieve wallet key", status: false });
                };
                const wallet = new ethers.Wallet(walletKey.private_key, provider);
                const userAddress = wallet.address;
                const amountTransfer = ethers.parseUnits(amount.toString(), 'ether');
                const tokenContract = new ethers.Contract(EthcontractAddress, EthcontractABI, wallet);
                const tx = await tokenContract.transfer(recipientAddress, amountTransfer);
                console.log('Transaction Hash:', tx.hash);
                await tx.wait();
                await PassbookEntery(userId,-0.01,'swap','E_ETH');
                if (true) {
                    console.log("Transaction confirmed");
                    const adminWallet = new ethers.Wallet(AdminPrivateKey, provider);
                    const adminTokenContract = new ethers.Contract(CtcContractAddress, CtcContractAbi, adminWallet);
                    const adminTransferAmount = ethers.parseUnits((amount * 0.90).toString(), 'ether');
                    const taxesTx = await adminTokenContract.transfer(userAddress, adminTransferAmount);
                    await taxesTx.wait();
                    console.log(amount,'Admin Transfer Confirmed!');
                    let amountgetswapp=amount* 0.90
                    console.log(amountgetswapp)
                     await createTransactionforSwap(eth_token,bsc_token,userId,amount,amountgetswapp)
                    return res.json({message:res.__("swapresponse"), status: true });
                }
            } catch (error) {
                console.error('Error:', error);
                return res.status(500).json({ "message": "Error occurred", status: false });
            };
            case "TP3":
                try {
                    const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                    const [wallets] = await database.execute(userWalletSql, [userId, "BNB"]);
                    const walletAddress = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                    if (!walletAddress) {
                        return res.json({"message":res.__('EthNotFound'), status: false });
                    }
                    const walletKey = await privateKeyAccess(walletAddress);
                    if (!walletKey || !walletKey.private_key) {
                        return res.json({ "message": "Failed to retrieve wallet key", status: false });
                    };
                    const wallet = new ethers.Wallet(walletKey.private_key, provider);
                    const userAddress = wallet.address;
                    const amountTransfer = ethers.parseUnits(amount.toString(), 'ether');
                    const tokenContract = new ethers.Contract(Tp3ContractAddress,Tp3ContractABI, wallet);
                    const tx = await tokenContract.transfer(recipientAddress, amountTransfer);
                    console.log('Transaction Hash:', tx.hash);
                    await tx.wait();
                    await PassbookEntery(userId,-0.01,'swap','E_ETH');
                    if (tx.hash) {
                        console.log("Transaction confirmed");
                        const adminWallet = new ethers.Wallet(AdminPrivateKey, provider);
                        const adminTokenContract = new ethers.Contract(CtcContractAddress, CtcContractAbi, adminWallet);
                        const adminTransferAmount = ethers.parseUnits((amount * 0.93).toString(), 'ether');
                        const taxesTx = await adminTokenContract.transfer(userAddress, adminTransferAmount);
                        await taxesTx.wait();
                        console.log(amount,'Admin Transfer Confirmed!');
                        let amountgetswapp=amount* 0.93;
                        console.log(amountgetswapp)
                         await createTransactionforSwap(eth_token,bsc_token,userId,amount,amountgetswapp)
                        return res.json({message:res.__("swapresponse"), status: true });
                    }
                } catch (error) {
                    console.error('Error:', error);
                    return res.status(500).json({ "message": "Error occurred", status: false });
                };
                case "MC":
                    try {
                        const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                        const [wallets] = await database.execute(userWalletSql, [userId, "BNB"]);
                        const walletAddress = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                        if (!walletAddress) {
                            return res.json({"message":res.__('EthNotFound'), status: false });
                        }
                        const walletKey = await privateKeyAccess(walletAddress);
                        if (!walletKey || !walletKey.private_key) {
                            return res.json({ "message": "Failed to retrieve wallet key", status: false });
                        };
                        const wallet = new ethers.Wallet(walletKey.private_key, provider);
                        const userAddress = wallet.address;
                        const amountTransfer = ethers.parseUnits(amount.toString(), 'ether');
                        const tokenContract = new ethers.Contract(McContractAddress,McContractAbi,wallet);
                        const tx = await tokenContract.transfer(recipientAddress,amountTransfer);
                        console.log('Transaction Hash:', tx.hash);
                        await tx.wait();
                        await PassbookEntery(userId,-0.01,'swap','E_ETH');
                        if (tx.hash) {
                            console.log("Transaction confirmed");
                            const adminWallet = new ethers.Wallet(AdminPrivateKey, provider);
                            const adminTokenContract = new ethers.Contract(CtcContractAddress, CtcContractAbi, adminWallet);
                            const adminTransferAmount = ethers.parseUnits((amount *0.85).toString(), 'ether');
                            const taxesTx = await adminTokenContract.transfer(userAddress, adminTransferAmount);
                            await taxesTx.wait();
                            console.log(amount,'Admin Transfer Confirmed!');
                            let amountgetswapp=amount* 0.83
                            console.log(amountgetswapp)
                             await createTransactionforSwap(eth_token,bsc_token,userId,amount,amountgetswapp)
                            return res.json({message:res.__("swapresponse"), status: true });
                        }
                    } catch (error) {
                        console.error('Error:', error);
                        return res.status(500).json({ "message": "Error occurred", status: false });
                    };
        default:
            return res.json({ "message":res.__("InvalidToken"), status: false });
    }
};
async function createTransactionforSwap(fromSwapped_token,toSwapped_token,client_id,amount_paid,amount_received) {
    const userId = Number(client_id);
    try {
        const query = `INSERT INTO swapTransaction(fromSwapped_token,toSwapped_token,client_id,amount_paid,amount_received) VALUES (?, ?, ?,?,?)`;
        await database.query(query, [fromSwapped_token,toSwapped_token,userId,amount_paid,amount_received]);
        return { message: 'Transaction created successfully', status: true };
    } catch (error) {
        console.error('Unexpected error:', error);
        return{ error: 'Unexpected error occurred' };
    }
};