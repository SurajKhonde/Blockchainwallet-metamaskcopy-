const erc20Abi = [
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

const pool = require('../config/poolConnection'); 
const Web3 = require('web3');
const ethers = require('ethers');
require('dotenv').config();
const infuraUrl =process.env.INFRAURL
const web3 = new Web3(new Web3.providers.HttpProvider(infuraUrl));
const CtcContractABI =process.env.CTCWALLETABI;
const CtcwalletAddress =process.env.CTCWALLETADDRESS;
const EthcontactAdress=process.env.ETHCONTR;
const Tp3ContractAddress=process.env.TP3CONTRACTADDRESS;
const Tp3ContractABI=process.env.TP3CONTRACTABI;
const McContractAddress =process.env.MCETH_CONTRACTADDRESS;
const McContractAbi=process.env.MCETH_CONTRACTABI;
const providerUrl=process.env.PROVIDER_URL;
const provider = new ethers.JsonRpcProvider(providerUrl);
const privatekeyaccess = require('../utils/PrivatekeyFetcher');
const AdminSecrateKey =process.env.ADMINWALLETPRIVATEKEY;
const { address } = require('bitcoinjs-lib');
const { TokenFetcher, TokenAdressFetcher } = require('../utils/Tokenfetcher');
const { ETHbalanceUser } = require('../utils/InsertionTransction');
const { getBnbBalance } = require('../utils/getallBalance');
const contractAbiforETH=process.env.ETHWALLETABI
exports.insertToken = async (req, res) => {
    const { token_name, token_symbol, blockchain,logo_url } = req.body;
    try {
        const sql = `
            INSERT INTO token (token_name, token_symbol, blockchain,logo_url)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.execute(sql, [token_name, token_symbol, blockchain,logo_url]);
        res.status(200).json({ message: 'Token record inserted successfully', status: true });
    } catch (error) {10e18
        console.error('Database error:', error);
        res.status(500).json({ message: 'Failed to insert Token record', status: false });
    }
};
exports.getAllTokens = async (req, res) => {
    const { userId } = req.user;
    try {
        const tokenSql =`SELECT * FROM token WHERE IsstakebleCoin ='true'`;
        const [tokens] = await pool.execute(tokenSql);
        let BalanceafterFixed = '0';
        let CtcApproval = 100000000;
        const E_token =`SELECT * FROM EToken `;
        const [Etoken] = await pool.execute(E_token);
        const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
        const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
        const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
        const ECTC7Balance = await ETHbalanceUser(userId,"E-CTC7");
        const Eethbalance =await ETHbalanceUser(userId,"E_ETH")
        if (wallet_address) {
            const privateKey = await privatekeyaccess(wallet_address);
            if (privateKey) {
                const wallet = new ethers.Wallet(privateKey.private_key, provider);
                try {
                    const Ctcttokencontract = new ethers.Contract(CtcwalletAddress, CtcContractABI, wallet);
                    const rawCtcttokenBalance = await Ctcttokencontract.balanceOf(wallet_address);
                     const CtcttokenBalance = ethers.formatUnits(rawCtcttokenBalance, 'ether');
                    BalanceafterFixed=String(Number(CtcttokenBalance).toFixed(4));
                } catch (error) {
                    console.error('Error retrieving token balances:', error);
                }
            }
        }
        const UpdateEtoken =Etoken.map(etoken=>{
            if(etoken.Etoken_symbol ==="E_CTC7"){
                return{...etoken,tokenBalance:ECTC7Balance ||0}
            }else if(etoken.Etoken_symbol ==="E_ETH"){
                return{...etoken,tokenBalance:Eethbalance ||0}

            }
        });
        const updatedTokens = tokens.map(token => {
            if (token.id === 1) {
                return { ...token, tokenBalance: BalanceafterFixed, tokenApproval: CtcApproval };
            } else {
                return { ...token, tokenBalance: '0', tokenApproval: '0' };
            }
        });
         
        res.status(200).json({ tokens:updatedTokens,etokens:UpdateEtoken,TotalStaking:0, status: true });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Failed to retrieve tokens', status: false });
    }
};

exports.transferToken = async (data) => {
    const {token_name,userId,toAddress,amount}=data;
    try {
        const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
        const [wallets] = await pool.execute(userWalletSql, [userId, 'BNB']);
        const fromAddress = wallets.length > 0 ? wallets[0]?.wallet_address : null;
        if (!fromAddress) {
            return ({ message: 'User wallet address not found', status: false });
        }
        const { private_key } = await privatekeyaccess(fromAddress);
        if (!private_key) {
            return ({ message: 'Private key not found', status: false });
        }
        const wallet = new ethers.Wallet(private_key, provider);
        const amountInWei =  ethers.parseUnits(amount, 'ether');
        let tokenContract;
        let receipt;
        if (token_name==='E_ETH') {
            tokenContract = new ethers.Contract(EthcontactAdress, contractAbiforETH, wallet);
                const balanceOf = await tokenContract.balanceOf(wallet.address);
                if((balanceOf)>amountInWei){
                const tx = await tokenContract.transfer(toAddress, amountInWei);
                receipt = await tx.wait();
                return ({ receipt, status: true });
                }
        } else if (token_name === 'CTC7') {
            tokenContract = new ethers.Contract(CtcwalletAddress,CtcContractABI , wallet);
            const balanceOf = await tokenContract.balanceOf(wallet.address);
            if((balanceOf)>amountInWei){
                const taxesTx = await tokenContract.transfer(toAddress, amountInWei);
                receipt = await taxesTx.wait();
                return ({ receipt, status: true });
            }else{
                return ({status:false });
            }
        } else {
            return({ message: 'Unsupported token shortname', status: false });
        }

    } catch (error) {
        console.error('Error during token transfer:', error);
        return ({ message: 'Failed to transfer tokens', status: false });
    }
};
exports.getSwapCoinList = async (req, res) => {
    const { userId } = req.user;
    try {
        const tokenSql = 'SELECT token_symbol AS tokenSymbol, token_name AS tokenName, logo_url AS image ,blockchain,isPrivate,userId AS userexist,isSwappable FROM token';
        const [tokens] = await pool.execute(tokenSql);
        const BseCoin = [];
        const ETHCOINs = [];
        tokens.forEach(token => {
            if (token.blockchain ==='BSC' && token.isSwappable == "true" ) {
                BseCoin.push(token);
            } else if (token.blockchain ==='ETH' && token.isSwappable == "true") {
                ETHCOINs.push(token);
            }
        });
        const responseData = {
            data: {
                BseCoin: BseCoin,
                ETHCOIN: ETHCOINs
            },
            status: true
        };
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: 'Failed to retrieve tokens', status: false });
    }
};
exports.existTokenname = async (req, res) =>{ 
    const { userId } = req.user;
    try {
        const tokenSql = 'SELECT blockchain AS tokenSymbol, token_name AS tokenName, logo_url AS image,userId as userExistance FROM token';
        const [rawToken] = await pool.execute(tokenSql);
          let tokens=[]
        rawToken.forEach(token => {
            if (!token.userExistance  || token.userExistance == userId ) {
                tokens.push(token);
            }
        });
        const blockchainsArray=[{Network_baseCoin:"ETH"},{Network_baseCoin:"BSC"}]
        res.status(200).json({ 
            data: { 
                tokens, 
                Networklist: blockchainsArray 
            }, 
            status: true 
        });

    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ message: res.__("Tokenexisstance"), status: false });
    }
};
exports.getParticularTokenBalance = async (req, res) => {
    const { userId } = req.user;
    const { token_name } = req.body;
    
    try {
        switch (token_name) {
            case "CTCTM":
                try {
                    const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                    const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                    const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                    if (wallet_address) {
                        try {
                            const ethTokenContract = new ethers.Contract(contractAddress, contractAbi, provider);
                            const rawETHtokenBalance = await ethTokenContract.balanceOf(wallet_address);
                            const balance =ethers.formatUnits(rawETHtokenBalance, 'ether');

                            return res.status(200).json({ balance, status: true });
                        } catch (contractError) {
                            console.error('Contract interaction error:', contractError);
                            return res.status(500).json({ message: 'Failed to interact with the contract', status: false });
                        }
                    } else {
                        return res.json({ message: 'Atlest you have BNB & ETH Address', status: false });
                    }
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    return res.status(500).json({ message: 'Failed to retrieve wallet address', status: false });
                }
            case "CTC":
                try {
                    const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                    const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                    const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                    if (wallet_address) {
                        try {
                            const ethTokenContract = new ethers.Contract(EthcontactAdress, contractAbiforETH, provider);
                            const rawETHtokenBalance = await ethTokenContract.balanceOf(wallet_address);
                            const balance =ethers.formatUnits(rawETHtokenBalance, 'ether');

                            return res.status(200).json({ balance, status: true });
                        } catch (contractError) {
                            console.error('Contract interaction error:', contractError);
                            return res.status(500).json({ message: 'Failed to interact with the contract', status: false });
                        }
                    } else {
                        return res.json({ message: 'Atlest you have BNB & ETH Address', status: false });
                    }
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    return res.status(500).json({ message: 'Failed to retrieve wallet address', status: false });
                };
                case "TP3":
                try {
                    const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                    const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                    const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                    if (wallet_address) {
                        try {
                            const ethTokenContract = new ethers.Contract(Tp3ContractAddress,Tp3ContractABI, provider);
                            const rawETHtokenBalance = await ethTokenContract.balanceOf(wallet_address);
                            const balance =ethers.formatUnits(rawETHtokenBalance, 'ether');

                            return res.status(200).json({ balance, status: true });
                        } catch (contractError) {
                            console.error('Contract interaction error:', contractError);
                            return res.status(500).json({ message: 'Failed to interact with the contract', status: false });
                        }
                    } else {
                        return res.json({ message: 'Atlest you have BNB & ETH Address', status: false });
                    }
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    return res.status(500).json({ message: 'Failed to retrieve wallet address', status: false });
                };
                case "MC":
                try {
                    const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                    const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                    const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                    if (wallet_address) {
                        try {
                            const ethTokenContract = new ethers.Contract(McContractAddress,McContractAbi, provider);
                            const rawETHtokenBalance = await ethTokenContract.balanceOf(wallet_address);
                            const balance =ethers.formatUnits(rawETHtokenBalance, 'ether');
                            return res.status(200).json({ balance, status: true });
                        } catch (contractError) {
                            console.error('Contract interaction error:', contractError);
                            return res.status(500).json({ message: 'Failed to interact with the contract', status: false });
                        }
                    } else {
                        return res.json({ message: 'Atlest you have BNB & ETH Address', status: false });
                    }
                } catch (dbError) {
                    console.error('Database error:', dbError);
                    return res.status(500).json({ message: 'Failed to retrieve wallet address', status: false });
                };
                
            default:
                const data={token_name:token_name,userId:userId}
                let tokendetails=  await TokenFetcher(data);
                if(tokendetails.status){
                    return res.json({ balance:tokendetails.balance, status: true});
                }
                return res.json({ message: 'Token is not supported ', status: false });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({ message: 'An unexpected error occurred', status: false });
    }
};
exports.finalSettlementoftokens = async (data) => {
    console.log("finalSettlement is started");
    const {token_name,toAddress,widrawlAmount}=data;
    console.log(token_name,toAddress,widrawlAmount)
    try {
        console.log("we are here ",data)
        const wallet = new ethers.Wallet(AdminSecrateKey,provider);
        console.log(wallet)
        console.log(typeof(widrawlAmount))
        const amountInWei =  ethers.parseUnits(widrawlAmount,'ether');
        console.log("test001")
        let tokenContract;
        let receipt;
        if (token_name==='E_ETH') {
            tokenContract = new ethers.Contract(EthcontactAdress, contractAbiforETH, wallet);
                const balanceOf = await tokenContract.balanceOf(wallet.address);
                if((balanceOf)>amountInWei){
                const tx = await tokenContract.transfer(toAddress, amountInWei);
                receipt = await tx.wait();
                return ({ receipt, status: true });
                }
        } else if (token_name ==='E_CTC7') {
            tokenContract = new ethers.Contract(CtcwalletAddress,CtcContractABI, wallet);
            const balanceOf = await tokenContract.balanceOf(wallet.address);
            console.log(balanceOf,"000258");
            console.log(amountInWei,"000259")
            if((balanceOf)>amountInWei){
                const taxesTx = await tokenContract.transfer(toAddress,amountInWei);
                receipt = await taxesTx.wait();
                return ({ receipt, status: true });
            }else{
                return ({status:false });
            }
        } else {
            return({ message: 'Unsupported token shortname', status: false });
        }

    } catch (error) {
        console.error('Error during token transfer:', error);
        return ({ message: 'Failed to transfer tokens', status: false });
    }
};
exports.fetchWalletAddress =async(req,res)=>{
    const { userId } = req.user;
    const { token_name } = req.body;
    switch (token_name) {
        case "CTCTM":
            try {
                const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                if(wallet_address){
                 return res.json({wallet:wallet_address,status:true});
                }
                 return res.json({message:"please Genrate wallet_Address",status:false});
            }catch(error){
                return res.json({message:"please try again after some time",status:false})
            }
        case "CTC":
            try {
                const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                if(wallet_address){
                 return res.json({wallet:wallet_address,status:true});
                }
                 return res.json({message:"please Genrate wallet_Address",status:false});
            }catch(error){
                return res.json({message:"please try again after some time",status:false})
            } 
        case "TP3":
            try {
                const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                if(wallet_address){
                 return res.json({wallet:wallet_address,status:true});
                }
                 return res.json({message:"please Genrate wallet_Address",status:false});
            }catch(error){
                return res.json({message:"please try again after some time",status:false})
            }
        case "MC":
            try {
                const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
                const [wallets] = await pool.execute(userWalletSql, [userId, "BNB"]);
                const wallet_address = wallets.length > 0 ? wallets[0]?.wallet_address : null;
                if(wallet_address){
                 return res.json({wallet:wallet_address,status:true});
                }
                 return res.json({message:"please Genrate wallet_Address",status:false});
            }catch(error){
                return res.json({message:"please try again after some time",status:false})
            } 
        default:
            const data={token_name:token_name,userId:userId}
              const walletAddress =await TokenAdressFetcher(data);
              if(walletAddress.status){
                return res.json({message:walletAddress.wallet_address,status:true});
              }else{
                return res.json({message:"wallet is not found",status:false});
              }
            
    }


};
exports.tokentransferuser = async (req, res) => {
    const { userId } = req.user;
    const { token_name, toAddress,amount } = req.body;

    if (!token_name || !toAddress || !amount) {
        return res.json({ message: "All fields are required", status: false });
    }
    const getTokenAddress = 'SELECT token_address,blockchain FROM token WHERE token_name=?' ;
    const [tokenAddressResult] = await pool.execute(getTokenAddress,[token_name]);
    console.log(tokenAddressResult)
    if (tokenAddressResult.length === 0) {
        return res.json({ message:"Please select a valid Token", status: false });
    }
    const { token_address: TokenCurrentAddress, blockchain: BlockchainName } = tokenAddressResult[0];
    const walletAddress = await getWalletAddress(userId, BlockchainName);
    if (!walletAddress) {
        return res.json({ message: 'User wallet address not found', status: false });
    }
    const { private_key } = await privatekeyaccess(walletAddress);
    if (!private_key) {
        return res.json({ message: 'Private key not found', status: false });
    }
    const wallet = new ethers.Wallet(private_key, provider);
    if (!ethers.isAddress(toAddress)) {
        return res.json({ message: "Invalid receiver address", status: false });
    }
    try {
        const balanceOfUser = await getBnbBalance(wallet.address);
        if (balanceOfUser < 0) {
            return res.json({ message: "Please maintain your BNB balance", status: false });
        }
        const amountInWei = ethers.parseUnits(amount, 'ether');
        const tokenContract = await getTokenContract(wallet, token_name,TokenCurrentAddress);
        console.log(amountInWei,'hello ')
        const balanceOf = await tokenContract.balanceOf(wallet.address);
         console.log(balanceOf,'<=============')
        console.log(amountInWei,'<================')
        if (balanceOf <amountInWei) {
            return res.json({ message: "Please maintain enough balance for the token transaction.", status: false });
        }
         
        const tx = await tokenContract.transfer(toAddress, amountInWei);
        await tx.wait();
        return res.status(200).json({ message: "Transaction Successful", status: true });
        
    } catch (error) {
        console.error(error);
        return res.json({ message: "Oops! Something went wrong", status: false });
    }
};
async function getWalletAddress(userId, blockchainName) {
    const coinName = blockchainName === 'BSC' ? 'BNB' : 'BNB';
    const userWalletSql = 'SELECT wallet_address FROM userWallet WHERE user_id = ? AND coin_name = ?';
    const [walletAddressResult] = await pool.execute(userWalletSql, [userId, coinName]);
    return walletAddressResult.length ? walletAddressResult[0].wallet_address : null;
};
async function getTokenContract(wallet,tokenName, tokenAddress) {
    let contractAbi, contractAddress;
    
    switch (tokenName) {
        case "CTC7":
            contractAddress = CtcwalletAddress;
            contractAbi = CtcContractABI; 
            break;
        case "CTC":
            contractAddress = EthcontactAdress; 
            contractAbi = contractAbiforETH; 
            break;
        case "TP3":
            contractAddress = Tp3ContractAddress; 
            contractAbi = Tp3ContractABI; 
            break;
        case "MC":
            console.log("hello")
            contractAddress = McContractAddress;
            contractAbi = McContractAbi;
            break;
        default:
            contractAddress = tokenAddress; 
            contractAbi = erc20Abi; 
            break;
    }

    return new ethers.Contract(contractAddress,contractAbi, wallet);
};