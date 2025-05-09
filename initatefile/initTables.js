const pool = require('../config/poolConnection');

async function createAdminTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255)  NULL,
        deviceid VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        mobile VARCHAR(20) NULL,
        countryCode VARCHAR(20) NULL,
        fname VARCHAR(100),
        lname VARCHAR(100),
        ReferCode VARCHAR(255) NULL,
         imageUrl VARCHAR(255) NULL,
        email_verification BOOLEAN DEFAULT false,
        mobile_verification BOOLEAN DEFAULT false,
        status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await pool.query(query);
    console.log('Users table created or already exists');
  } catch (error) {
    console.error('Error creating users table:', error);
    throw error; 
  }
};
async function referralCode() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS referral_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        user_id INT NOT NULL,
        expiry_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );      
  `;

    await pool.query(query);
    console.log('refrerral_codes table is created  or already exists');
  } catch (error) {
    console.error('Error creating EmailVerification table:', error);
    return error;
  }
};

async function createCurrencyTable() {
  try {
    const query = `
        CREATE TABLE  IF NOT EXISTS cryptocurrencies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          coin_name VARCHAR(255) NOT NULL,
          coin_shortname VARCHAR(100) NOT NULL,
          coin_symbol VARCHAR(10) NOT NULL,
          decimal_places TINYINT NOT NULL,
          blockchain VARCHAR(100),
          total_supply DECIMAL(30, 8),
          website_url VARCHAR(255),
          description TEXT,
          logo_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await pool.query(query);
    console.log('createCurrencyTable created or already exists');
  } catch (error) {
    console.error('Error creating users table:', error);
    return error;
  }
};
async function createTokenTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS token (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token_name VARCHAR(255) NOT NULL,
        token_symbol VARCHAR(10) NOT NULL,
        blockchain VARCHAR(100) NOT NULL,
        logo_url VARCHAR(255) DEFAULT NULL,
        isPrivate ENUM('true', 'false') DEFAULT 'false',
        userId INT DEFAULT NULL,
        token_address VARCHAR(10) DEFAULT NULL,
        IsstakebleCoin ENUM('true', 'false') DEFAULT 'false',
        isSwappable ENUM('true', 'false') DEFAULT 'false',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('createTokenTable created or already exists');
  } catch (error) {
    console.error('Error creating token table:', error);
    return error;
  }
}


async function createETokenTable() {
  try {
    const query = `
        CREATE TABLE  IF NOT EXISTS EToken  (
          id INT AUTO_INCREMENT PRIMARY KEY,
          Etoken_name VARCHAR(255) NOT NULL,
          Etoken_symbol VARCHAR(10) NOT NULL,
          Eblockchain VARCHAR(100),
          Elogo_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;

    await pool.query(query);
    console.log('createTokenTable created or already exists');
  } catch (error) {
    console.error('Error creating users table:', error);
    return error;
  }
};


async function createOTPTable() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS otp_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userkey VARCHAR(255) NOT NULL,
        otp VARCHAR(1000) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        expires_at TIMESTAMP DEFAULT NULL
      )
    `;
    await pool.query(query);
    const createEventQuery = `
      CREATE EVENT IF NOT EXISTS delete_expired_otps
      ON SCHEDULE EVERY 5 MINUTE
      DO
        DELETE FROM otp_data WHERE expires_at <= NOW();
    `;

    await pool.query(createEventQuery);

    console.log('createOTPTable created or already exists');
  } catch (error) {
    console.error('Error creating OTP table:', error);
    throw error;
  }
};
async function userWallet() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS userWallet (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        wallet_name VARCHAR(255)  NULL,
        coin_id INT NOT NULL,
        wallet_type VARCHAR(50) NOT NULL,
        wallet_address VARCHAR(255) NOT NULL,
        private_key VARCHAR(1000) NOT NULL,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (coin_id) REFERENCES cryptocurrencies(id)
      );`;
    await pool.query(query);
    console.log(' WalletAddress table created or already exists');
  } catch (error) {
    console.error('Error creating users table:', error);
    return error; 
    }
};

async function Clienttransaction() {
  try {
    const query = `
  CREATE TABLE IF NOT EXISTS Clienttransaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coin_sortname VARCHAR(20) NOT NULL,
    client_id INT NOT NULL,
    transaction_hash VARCHAR(255) NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    receiver_wallet_address VARCHAR(255) NOT NULL,
    sender_wallet_address VARCHAR(255) NOT NULL,
    transaction_fees DECIMAL(18, 8) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id)
  );
`;


    await pool.query(query);
    console.log('Clienttransaction table created or already exists');
  } catch (error) {
    console.error('Error creating Clienttransaction table:', error);
    throw error; 
  }
};
async function  staking_package() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS staking_package (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        quantity INT(11) NULL,
        eth_fee DECIMAL(10,2) NULL,
        staking_days INT(11) NULL,
        total_staking_fee_percent DECIMAL(10,4) NULL,
        eth_daily_payment DECIMAL(20,18) NULL,
        ctc7_daily_payment_percent DECIMAL(10,2) NULL,
        level INT(11) NOT NULL,
        status VARCHAR(255) COLLATE utf8mb4_general_ci NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;
    await pool.query(query);
    console.log('staking_package table created or already exists');
  } catch (error) {
    console.error('Error creating staking_package table:', error);
    return error; 
  }
};
async function createETokenTransactionsTable() {
  try {
    const query = `CREATE TABLE IF NOT EXISTS etoken_transactions (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(11) NULL,
        amount DECIMAL(20,8) NULL,
        trans_type VARCHAR(255) COLLATE utf8mb4_general_ci NULL,
        token_name VARCHAR(255) COLLATE utf8mb4_general_ci NULL,
        user_staking_id INT(11) NULL,
        tx_id VARCHAR(255) COLLATE utf8mb4_general_ci NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`;
    await pool.query(query);
    console.log('etoken_transactions table created or already exists');
  } catch (error) {
    console.error('Error creating etoken_transactions table:', error);
    return error; 
  }
};
async function user_stakingdata() {
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS user_staking (
        id INT(11) AUTO_INCREMENT PRIMARY KEY,
        user_id INT(11) NULL,
        referral_id INT(11) NULL,
        staking_package_id INT(11) NULL,
        amount INT(11) NULL,
        received_eth_roi DECIMAL(20,15) DEFAULT 0.000000000000000,
        received_ctc7_roi DECIMAL(20,8) DEFAULT 0.00000000,
        sent_roi_days INT(11) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`;

    await pool.query(query);
    console.log('user_staking table created or already exists');
  } catch (error) {
    console.error('Error creating user_staking table:', error);
    return error;
  }
};
async function createCurrencyUserChoiceTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS userCoinsAccess (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        coin_data JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`;

    await pool.query(createTableQuery);
    console.log('userCoinsAccess table created or already exists');
  } catch (error) {
    console.error('Error creating userCoinsAccess table:', error);
    throw error;
  }
}
async function swapTransaction() {
  try {
    const createTableQuery = 
    `CREATE TABLE IF NOT EXISTS swapTransaction (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fromSwapped_token VARCHAR(20) NOT NULL,
    toSwapped_token VARCHAR(20) NOT NULL,
    client_id INT NOT NULL,
    transaction_hash VARCHAR(255) NULL,
    amount_paid DECIMAL(18, 8) NOT NULL,
    amount_received DECIMAL(18, 8) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id)
)`;

    await pool.query(createTableQuery);
    console.log('swapTransaction table created or already exists');
  } catch (error) {
    console.error('Error creating userCoinsAccess table:', error);
    throw error;
  }
}
async function E_Ethtranction() {
  try {
    const createTableQuery = 
    `CREATE TABLE IF NOT EXISTS E_Ethtranction (
    id INT AUTO_INCREMENT PRIMARY KEY,
     client_id INT NOT NULL,
    amount_balance DECIMAL(18, 8) NOT NULL DEFAULT 0.000000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users(id)
)`;

    await pool.query(createTableQuery);
    console.log('E_Ethtranction table created or already exists');
  } catch (error) {
    console.error('Error creating userCoinsAccess table:', error);
    throw error;
  }
}

async function initTables() {
  try {
    await createAdminTable();
    await createCurrencyTable();
    await createTokenTable();
    await referralCode();
    await userWallet();
    await Clienttransaction() 
    await createOTPTable();
    await staking_package() 
    await user_stakingdata()
    await createETokenTransactionsTable();
    await createCurrencyUserChoiceTable();
    await E_Ethtranction();
    await swapTransaction();
    await createETokenTable()
    console.log('Table initialization complete');
  } catch (error) {
    console.error('Error initializing tables:', error);
    process.exit(1);
  }
};
initTables()
  .catch((error) => {
    console.error('Error in initialization:', error);
    process.exit(1);
  });

module.exports = initTables;
