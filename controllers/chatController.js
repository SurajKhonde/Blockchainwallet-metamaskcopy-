
const fs = require('fs').promises;
require("dotenv");
const ethers = require('ethers');
const path = require('path');
const pool = require('../config/poolConnection');
const baseurl = process.env.BASEURL
const jwt = require('jsonwebtoken');
const { Erc20ContractFetcher } = require('./ErcTokenFetcher');
module.exports = (io) => {
    let adminSockets = new Set(); 
    let userSockets = {}; 
    let userChatHistories = {};
    let userRoom = {}; 
    let userId; 

    io.on('connection', (socket) => {
        const token = socket.handshake.query?.token;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userId = decoded?.userId;    
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    socket.emit('messageFromServer', { text: 'Your session has expired. Please log in again.' });
                } else {
                    console.error('JWT verification failed:', err);
                    socket.emit('messageFromServer', { text: 'Invalid token. Please log in again.' });
                }
                socket.disconnect(); 
                return;
            }
        } else {
            socket.emit('messageFromServer', { text: 'No token provided. Please log in.' });
            socket.disconnect(); 
            return;
        }
    
        socket.on('join_room', async (userId) => {
            socket.join(userId);
            userSockets[userId] = socket.id;

            try {
                const connection = await pool.getConnection();
                const [rows] = await connection.query(
                    'SELECT * FROM UsersChatHistory WHERE userId = ? ORDER BY id ASC',
                    [userId]
                );
                connection.release();
                socket.emit('recieve-all-message', rows);
            } catch (err) {
                console.error('Error retrieving chat messages:', err);
                socket.emit('messageFromServer', { text: 'Error retrieving your messages. Please try again later.' });
            }
        });
        socket.on('send_message', async (data) => {
            const { userId, text, image } = data;
            let imageUrl = '';
        
            if (image) {
                const imName = `cameraSelfie-${Date.now()}.jpeg`;
                const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
                try {
                    await fs.writeFile(path.join("public/chatImage", imName), base64Data, "base64");
                    imageUrl = `${baseurl}chatImage/${imName}`;
                } catch (error) {
                    console.error("Error saving the image:", error);
                }
            }
        
            try {
                const connection = await pool.getConnection();
                await connection.query(
                    'INSERT INTO UsersChatHistory (userId, text, imageUrl, isResolved, sender) VALUES (?, ?, ?, FALSE, ?)',
                    [userId, text, imageUrl, 'user']
                );
                connection.release();
        
                userChatHistories[userId] = userChatHistories[userId] || [];
                userChatHistories[userId].push({ text, imageUrl, sender: 'user' });
                
                function getCurrentIsoDateTime() {
                    const now = new Date();
                    return now.toISOString();
                }
                socket.emit('messageFromServer', {"userId":userId,"text":text,"imageUrl":imageUrl, sender: 'user' ,createdAt:getCurrentIsoDateTime()});
    
                if (adminSockets.size > 0 && !userRoom[userId]) {
                    adminSockets.forEach(adminSocket => {
                        adminSocket.emit('newSupportRequest', { text, imageUrl, userId });
                    });
                }
            } catch (err) {
                console.error("Error saving message:", err);
                socket.emit('messageFromServer', { text: 'Error saving message. Please try again later.' });
            }
        });
        socket.on('check_user', async (mobileNumber) => {
            console.log(mobileNumber)
            try {
                const connection = await pool.getConnection();
                const [rows] = await connection.query(
                    'SELECT * FROM users WHERE mobile = ? AND status = "active"',
                    [mobileNumber]
                );
                console.log(rows[0])
                connection.release();
                if (userId === rows[0]?.id) {
                    console.log("hello")
                    socket.emit('check_user', { exists: false, message: "You can't be your own sponsor! Please find a valid sponsor." });
                    return;
                }
        
                if (rows.length > 0) {
                    const StakerId = rows[0]?.id;
                    const connection2 = await pool.getConnection();
                    const [data] = await connection2.query(
                        'SELECT * FROM user_staking WHERE user_id = ?',
                        [StakerId]
                    );
                    connection2.release();
                    if (data.length > 0) {
                        console.log(data,'<=================')
                        socket.emit('check_user', { exists:true, SponserId: rows[0]?.id, message: rows[0].fname ? rows[0].fname : "Invalid" });
                    } else {
                        socket.emit('check_user', { exists: false, message: 'Not Own Any Stake' });
                    }
                } else {
                    socket.emit('check_user', { exists: false, message: "Invalid Sponsor" });
                }
            } catch (err) {
                console.error('Error checking user existence:', err);
                socket.emit('check_user', { exists: false, error: 'Error checking user existence. Please try again later.' });
            }
        });
        socket.on('token_verify', async ({contractAddress,network}) => {
            if (!ethers.isAddress(contractAddress)) {
                socket.emit('token_verify', { exists: false, message: "Token Address is Invalid" });
                return; 
            }
            try {
                const data={contractAddress:contractAddress,network:network}
               const tokendata= await Erc20ContractFetcher(data)
               if(tokendata.status){
                socket.emit('token_verify', { exists: true, tokendata});

               }else if(!tokendata.status){
                socket.emit('token_verify', { exists:false,message:tokendata.message});

               }
                
                
            } catch (err) {
                console.error('Error retrieving contract data:', err);
                socket.emit('token_verify', { exists: false, error: 'Error retrieving contract data. Please try again later.' });
            }
        });
        socket.on('disconnect', () => {
            for (const [userId, id] of Object.entries(userSockets)) {
                if (id === socket.id) {
                    delete userSockets[userId];
                    delete userChatHistories[userId];
                    delete userRoom[userId];
                    userId=""
                    if (adminSockets.size > 0) {
                        adminSockets.forEach(adminSocket => {
                            adminSocket.emit('updateActiveSupportRequests', Object.keys(userSockets).map(userId => ({
                                userId,
                                ...userChatHistories[userId]
                            })));
                        });
                    }
                    break;
                }
            }
        });
    });
io.of('/admin').on('connection', (socket) => {
    adminSockets.add(socket);

    socket.on('getUnresolvedChats', async () => {
        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.query(
                'SELECT userId, text, imageUrl, createdAt FROM UsersChatHistory WHERE isResolved = 0'
            );
            connection.release();
            socket.emit('unresolvedChats', rows);

            const [uniqueUsers] = await connection.query(
                'SELECT DISTINCT userId FROM UsersChatHistory WHERE isResolved = 0'
            );
            socket.emit('updateUserDropdown', uniqueUsers);
        } catch (err) {
            console.error('Error retrieving unresolved chats:', err);
            socket.emit('messageFromServer', { text: 'Error retrieving unresolved chats. Please try again later.' });
        }
    });
    socket.on('getOnlineUsers', () => {
        const onlineUsers = Object.keys(userSockets);
        socket.emit('updateOnlineUsers', onlineUsers);
    });
    // When the admin sends a message
socket.on('sendResponse', async (data) => {
    const { userId, text, image } = data;
    let imageUrl = '';
    
    if (image) {
        // Handle image processing
        const imName = `adminResponse-${Date.now()}.jpeg`;
        const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
        try {
            await fs.writeFile(path.join("public/chatImage", imName), base64Data, "base64");
            imageUrl = `${baseurl}chatImage/${imName}`;
        } catch (error) {
            console.error("Error saving the image:", error);
        }
    }
    
    // Update chat history
    userChatHistories[userId] = userChatHistories[userId] || [];
    userChatHistories[userId].push({ text, imageUrl, sender: 'admin' });
    
    // Send the message to the user
    if (userSockets[userId]) {
        io.to(userSockets[userId]).emit('messageFromServer', { text: `Admin: ${text}`, imageUrl, sender: 'admin' });
    } else {
        io.to(socket.id).emit('messageFromServer', { text: 'User not found or offline.' });
    }
    
    // Save the message to the database
    try {
        const connection = await pool.getConnection();
        await connection.query(
            'INSERT INTO UsersChatHistory (userId, text, imageUrl, isResolved, sender) VALUES (?, ?, ?, FALSE, ?)',
            [userId, text, imageUrl, 'admin']
        );
        connection.release();
    } catch (err) {
        console.error("Error logging response:", err);
    }
});


    socket.on('selectUserForChat', async (userId) => {
        if (userRoom[userId] && userRoom[userId] !== socket.id) {
            io.to(socket.id).emit('messageFromServer', { text: 'User is already assigned to another admin.' });
            return;
        }

        socket.join(userId);
        userRoom[userId] = socket.id;
        io.to(socket.id).emit('chatStarted', { userId });

        if (userSockets[userId]) {
            io.to(userSockets[userId]).emit('messageFromServer', { text: 'An admin has started the chat with you.', sender: 'admin' });
            io.to(userSockets[userId]).emit('chatHistory', { userId, history: userChatHistories[userId] });
        }

        // Mark messages as resolved when the chat starts
        try {
            const connection = await pool.getConnection();
            await connection.query(
                'UPDATE UsersChatHistory SET isResolved = TRUE WHERE userId = ? AND isResolved = FALSE',
                [userId]
            );
            connection.release();
        } catch (err) {
            console.error('Error marking messages as resolved:', err);
        }
    });

    socket.on('disconnect', () => {
        adminSockets.delete(socket);
        for (const userId in userRoom) {
            if (userRoom[userId] === socket.id) {
                delete userRoom[userId];
                break;
            }
        }
    });
});
};
