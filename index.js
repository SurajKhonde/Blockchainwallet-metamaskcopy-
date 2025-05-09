
 const { i18n, i18nMiddleware } = require('./ i18nSetup');
const cron = require('node-cron');
const express = require('express');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const userRouter = require('./routes/Admin');
const walletgenrate = require('./routes/Wallet');
const stakehandler = require('./routes/Adminstake');
const CryptoCurrencies = require('./routes/CryproCurrency');
const pool = require("./config/poolConnection");
const initTables = require('./initatefile/initTables');
const fundTransfer = require("./routes/transfer");
const Userinvestment =require('./routes/Stake')
const { updateUserStaking } = require('./StakeCrone/Dailyroidistrubate');
const cors = require('cors');
const morgan = require("morgan");
const { stakeDailyRoidistribution } = require('./StakeCrone/dailywrok');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
initTables(); 
app.use(cors());
app.use(morgan('tiny')); 
app.use(i18nMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(i18n.init);
app.use('/api',userRouter);
app.use('/api',walletgenrate);
app.use('/api',CryptoCurrencies);
app.use('/api',fundTransfer);
app.use('/api',stakehandler);
app.use('/api',Userinvestment);
app.get('/privacy-policy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/PrivacyPolicy.html'));
});
app.get('/termofUse', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Termofuse.html'));
});
cron.schedule('* * * * *', async () => {
  try {
    await stakeDailyRoidistribution();
    console.log('User staking data updated successfully');
  } catch (error) {
    console.error('Error updating user staking data:', error);
  }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  connection.release();
});

const io = socketIo(server,{
  cors: {
    origin:  "*",
    methods: ["GET", "POST"]
  }
});
require('./controllers/chatController')(io);
io.on('connection', (socket) => {
  console.log('A user connected...');
  socket.emit('message', 'Welcome to the WebSocket server!');
});
