const ethers = require('ethers');
const Database=require('../config/poolConnection');

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
const providerMap = {
  EVM: process.env.RPC_ETH ,
  BSC:process.env.CTC_NEWPROVIDER_BSC
};
exports.Erc20ContractFetcher = async (data) => {
  const{contractAddress,network}=data;
  console.log(network,"===<===>==")
  if (!providerMap[network]) {
    return { message: "Unsupported network",status:false };
  }
  const provider = new ethers.JsonRpcProvider(providerMap[network]);
  switch (network) {
    case "BSC":
      try {
        const contract = new ethers.Contract(contractAddress, erc20Abi, provider);
        const name = await contract.name();
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        console.log(name, symbol, decimals.toString())
    
        return { name, symbol, readableDecimals: decimals.toString(),status:true};
      } catch (error) {
        console.error(error);
        return { error: 'Failed to fetch token details', status: false };
      }
      case "ETH":
        try {
          const contract = new ethers.Contract(contractAddress, erc20Abi, provider);
          const name = await contract.name();
          const symbol = await contract.symbol();
          const decimals = await contract.decimals();
          console.log(name, symbol, decimals.toString())
      
          return { name, symbol, readableDecimals: decimals.toString(),status:true};
        } catch (error) {
          console.error(error);
           return {message:"please select valid Network ",status:false};
        }
    default:
      return { error: 'Please select valid Network', status: false };
  }
 
};
exports.InsertPrivateTokens = async (req, res) => {
  const { network, name, symbol, decimals, token_address } = req.body;
  const { userId } = req.user;
  if (!network || !name || !symbol || !decimals) {
    return res.json({
      message: "It seems you've missed something. Please check!",
      status: true,
    });
  }

  const checkExistanceofToken = `SELECT * FROM token WHERE token_name = ? AND userId = ?`;

  const insertPrivateToken = `
    INSERT INTO token (token_name, token_symbol, blockchain, logo_url, isPrivate, userId, token_address) 
    VALUES (?, ?, ?, ?, 'true', ?, ?)
  `;

  let tokenImage;
  const BseImage = "https://tkcdn.tekedia.com/wp-content/uploads/2023/02/23224828/binance-smart-chain.jpg";
  const EthImage = "https://miro.medium.com/v2/resize:fit:720/format:webp/1*YXFC9gyg_6jBVyOo78lFGQ.png";
  switch (network) {
    case "EVM":
      tokenImage = EthImage;
      break;
    case "BSC":
      tokenImage = BseImage;
      break;
    default:
      return res.json({ message: 'Unsupported network', status: false });
  }

  try {
    const [response] = await Database.query(checkExistanceofToken, [name, userId]);
    if (response.length > 0) {
      return res.json({ message: 'You already imported this token', status: false });
    }
    await Database.query(insertPrivateToken, [name, symbol, network, tokenImage, userId, token_address]);
    res.status(200).json({ message: 'Token imported successfully', status: true });
  } catch (error) {
    console.error('Error inserting token:', error);
    res.status(500).json({ message: 'Error inserting token', status: false });
  }
};

