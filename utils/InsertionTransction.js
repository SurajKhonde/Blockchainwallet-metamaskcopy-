const DATABASECONNECTION= require('../config/poolConnection');
exports.PassbookEntery= async(user_id,amount,trans_type,token_name)=> {
    console.log("hello")
    if (user_id === undefined || amount === undefined || trans_type === undefined || token_name === undefined) {
        return ({ error: 'Missing required fields' });
    }
    const userId = Number(user_id);
    const amountValue = Number(amount);
    try {
        const query = `INSERT INTO etoken_transactions (user_id,amount,trans_type,token_name) VALUES (?,?,?,?)`;
        await DATABASECONNECTION.query(query, [userId, amountValue, trans_type, token_name]);
        return { message: 'Transaction created successfully', status: true };
    } catch (error) {
        console.error('Unexpected error:', error);
        return{ error: 'Unexpected error occurred' };
    }
};
exports.E_EthPassbook = async (user_id, amount) => {
    if (user_id === undefined || amount === undefined) {
        return { error: 'Missing required fields' };
    }
    const userId = Number(user_id);
    const amountValue = Number(amount);
    if (isNaN(amountValue) || amountValue < 0) {
        return { error: 'Invalid amount value' };
    }

    try {
        const query = `
            INSERT INTO E_Ethtranction (client_id, amount_balance)
            VALUES (?, ?)
        `;
        await DATABASECONNECTION.query(query, [userId, amountValue]);
        return { message: 'Transaction created successfully', status: true };
    } catch (error) {
        console.error('Unexpected error:', error);
        return { error: 'Unexpected error occurred' };
    }
};
exports.ETHbalanceUser = async (user_id,Token_name) => {
    try {
        const userbalance =`SELECT  SUM(amount) AS total_balance FROM etoken_transactions WHERE token_name = ? AND user_id = ? `;
        const [data] = await DATABASECONNECTION.query(userbalance, [Token_name,user_id]);
        
        return data[0]?.total_balance || 0;     
    }catch (error) {
        console.error('Error fetching ETH balance:', error);
        throw error; 
    }
};
