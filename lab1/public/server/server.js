// public/server/server.js
//Ініціалізація Express та HTTP-сервера:
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const axios = require('axios');
const { User, Message, Chat, MessageSync } = require('../../database/mongodb/schema.js');

const app = express();
const server = http.createServer(app);

//ІНІЦІАЛІЗАЦІЯ SOCKET.IO
const io = socketIo(server, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"],
        credentials: true
    }
});

//ЗАПУСК СЕРВЕРА
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Socket.IO server running on http://localhost:${PORT}`);
});

app.use(express.json());

//ПІДКЛЮЧЕННЯ ДО МОНГОДБ
mongoose.connect('mongodb://localhost:27017/chatdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected to chatdb'))
    .catch(err => console.error('MongoDB connection error:', err));

//ідстежує активні WebSocket-з’єднання для кожного користувача
const userSockets = new Map();

function capitalizeFirstLetter(string) {
    if (!string || typeof string !== 'string') return '';
    const lower = string.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}
//ОНОВЛЕННЯ СТАТУСУ КОРИСТУВАЧА
async function updateUserStatus(mongoUserId, status) {
    try {
        const user = await User.findByIdAndUpdate(mongoUserId, { status: status, lastSeen: new Date() }, { new: true });
        if (user) {
            const chats = await Chat.find({ participants: mongoUserId }).populate('participants', '_id');
            const allParticipantIds = new Set();
            chats.forEach(chat => {
                chat.participants.forEach(p => {
                    if (p._id.toString() !== mongoUserId) {
                        allParticipantIds.add(p._id.toString());
                    }
                });
            });

            allParticipantIds.forEach(participantMongoId => {
                if (userSockets.has(participantMongoId)) {
                    userSockets.get(participantMongoId).forEach(socketId => {
                        io.to(socketId).emit('userStatusChanged', {
                            userId: mongoUserId,
                            mysqlUserId: user.mysqlUserId,
                            status: user.status,
                            lastSeen: user.lastSeen
                        });
                    });
                }
            });
            console.log(`User ${user.firstname} status updated to ${status} and broadcasted.`);
        }
    } catch (error) {
        console.error(`Error updating status for user ${mongoUserId}:`, error);
    }
}
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

//Обробник події identifyUser викликається, коли клієнт підключається та надсилає свої дані (наприклад, mysqlUserId, email, firstname, lastname).
    socket.on('identifyUser', async (userData) => {
        try {
            if (!userData.mysqlUserId) {
                console.log(`Identification failed for socket ${socket.id}: missing mysqlUserId`);
                socket.emit('error', { message: 'Identification failed: missing mysqlUserId.' });
                return;
            }
            if (!userData.email || !userData.firstname || !userData.lastname) {
                console.log(`Identification failed for socket ${socket.id} (mysqlId: ${userData.mysqlUserId}): missing crucial details (email, firstname, lastname).`);
                socket.emit('error', { message: 'Identification failed: missing email, firstname, or lastname.' });
                return;
            }

            const normalizedFirstname = capitalizeFirstLetter(userData.firstname);
            const normalizedLastname = capitalizeFirstLetter(userData.lastname);
            const actualEmail = userData.email.toLowerCase();

            let mongoUser = await User.findOne({ mysqlUserId: userData.mysqlUserId });

            if (!mongoUser) {
                let existingByActualEmail = await User.findOne({ email: actualEmail });
                if (existingByActualEmail && existingByActualEmail.mysqlUserId !== userData.mysqlUserId) {
                    console.error(`User identification error: Email ${actualEmail} already exists for mysqlUserId ${existingByActualEmail.mysqlUserId}. Cannot assign to ${userData.mysqlUserId}.`);
                    socket.emit('error', { message: `This email address (${actualEmail}) is already associated with a different account in the chat system.` });
                    return;
                }
                console.log(`User not found in MongoDB by mysqlUserId: ${userData.mysqlUserId}. Creating new user profile with actual email: ${actualEmail}.`);
                mongoUser = new User({
                    mysqlUserId: userData.mysqlUserId,
                    firstname: normalizedFirstname,
                    lastname: normalizedLastname,
                    email: actualEmail,
                    status: 'online',
                    lastSeen: new Date()
                });
                await mongoUser.save();
            } else {
                if (mongoUser.email.toLowerCase() !== actualEmail) {
                    let conflictingUserWithNewEmail = await User.findOne({ email: actualEmail });
                    if (conflictingUserWithNewEmail && conflictingUserWithNewEmail.mysqlUserId !== userData.mysqlUserId) {
                        console.error(`User update error: Cannot change email for mysqlUserId ${userData.mysqlUserId} to ${actualEmail} because it's already used by mysqlUserId ${conflictingUserWithNewEmail.mysqlUserId}.`);
                        socket.emit('error', { message: `The email address (${actualEmail}) you are trying to use is already associated with another account.` });
                        mongoUser = await User.findOne({ mysqlUserId: userData.mysqlUserId });
                    } else {
                        mongoUser.email = actualEmail;
                    }
                }
                console.log(`User found in MongoDB (mysqlUserId: ${userData.mysqlUserId}). Updating profile. Old email: ${mongoUser.email}, New email: ${actualEmail}`);
                mongoUser.firstname = normalizedFirstname;
                mongoUser.lastname = normalizedLastname;
                mongoUser.status = 'online';
                mongoUser.lastSeen = new Date();
                await mongoUser.save();
                console.log(`User profile for mysqlUserId: ${userData.mysqlUserId} updated. Email is now ${mongoUser.email}.`);
            }

            socket.mongoUserId = mongoUser._id.toString();
            socket.mysqlUserId = mongoUser.mysqlUserId;
            socket.userFullname = `${mongoUser.firstname} ${mongoUser.lastname}`;
            if (!userSockets.has(socket.mongoUserId)) {
                userSockets.set(socket.mongoUserId, new Set());
            }
            userSockets.get(socket.mongoUserId).add(socket.id);
            console.log(`User ${socket.userFullname} (MongoDB ID: ${socket.mongoUserId}, MySQL ID: ${socket.mysqlUserId}) identified for socket ${socket.id}. Status: online.`);
            socket.emit('userIdentified', {
                mongoUserId: socket.mongoUserId,
                mysqlUserId: socket.mysqlUserId,
                fullname: socket.userFullname,
                email: mongoUser.email,
                status: mongoUser.status
            });
            updateUserStatus(socket.mongoUserId, 'online');
        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
                console.error(`Error in identifyUser (MongoDB duplicate key on email):`, error.keyValue);
                socket.emit('error', { message: `This email address (${userData.email || error.keyValue.email}) is already registered in the chat system.` });
            } else {
                console.error(`Error in identifyUser for socket ${socket.id} (mysqlUserId: ${userData.mysqlUserId}):`, error);
                socket.emit('error', { message: 'Server error during user identification.' });
            }
        }
    });

    socket.on('loadMyChats', async () => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified.' });
        try {
            const chats = await Chat.find({ participants: socket.mongoUserId })
                .populate('participants', 'firstname lastname mysqlUserId email status lastSeen')
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'senderId', select: 'firstname lastname mysqlUserId' }
                })
                .sort({ updatedAt: -1 });
            socket.emit('myChatsLoaded', chats);
        } catch (error) {
            console.error('Error loading user chats:', error);
            socket.emit('error', { message: 'Failed to load chats.' });
        }
    });

    //СТВОРЕННЯ ПРИВАТНОГО ЧАТУ
    socket.on('initiateChat', async ({ targetMysqlUserId }) => {
        if (!socket.mongoUserId || !socket.mysqlUserId) return socket.emit('error', { message: 'Cannot initiate chat: Your user is not identified.' });
        if (!targetMysqlUserId) return socket.emit('error', { message: 'Cannot initiate chat: Target student ID is missing.' });

        const numericTargetMysqlUserId = parseInt(targetMysqlUserId);
        console.log(`Initiate chat attempt: Current user MySQL ID ${socket.mysqlUserId}, Target Student ID: ${numericTargetMysqlUserId}`);
        if (socket.mysqlUserId === numericTargetMysqlUserId) {
            return socket.emit('error', { message: "You cannot start a chat with yourself." });
        }
        try {
            const currentUserMongoId = socket.mongoUserId;
            let targetUser = await User.findOne({ mysqlUserId: numericTargetMysqlUserId });

            if (!targetUser) {
                console.log(`Target student (ID: ${numericTargetMysqlUserId}) not in MongoDB. Attempting to fetch from PHP and create stub user.`);
                try {
                    const phpAppBaseUrl = process.env.PHP_APP_URL || 'http://localhost';
                    
                    //ІНТЕГРАЦІЯ З PHP ДЛЯ ОТРИМАННЯ ДЕТАЛЕЙ СТУДЕНТА
                    const studentDetailsUrl = `${phpAppBaseUrl}/lab1/index.php?url=student/getStudentDetailsAjax&id=${numericTargetMysqlUserId}`;

                    console.log(`Fetching student details from: ${studentDetailsUrl}`);
                    const response = await axios.get(studentDetailsUrl);
                    const studentData = response.data;
                    if (studentData && studentData.success && studentData.student &&
                        studentData.student.id && studentData.student.firstname && studentData.student.lastname) {

                        const placeholderEmailDomain = process.env.PLACEHOLDER_EMAIL_DOMAIN || 'chat.system';
                        const placeholderEmail = `student_${studentData.student.id}@${placeholderEmailDomain}`;
                        let existingByPlaceholderEmail = await User.findOne({ email: placeholderEmail });
                        if (existingByPlaceholderEmail && existingByPlaceholderEmail.mysqlUserId !== numericTargetMysqlUserId) {
                            console.error(`Placeholder email ${placeholderEmail} conflict for mysqlUserId ${numericTargetMysqlUserId}. Existing user:`, existingByPlaceholderEmail.mysqlUserId);
                            return socket.emit('error', { message: `Could not create chat: Internal email conflict for student ID ${numericTargetMysqlUserId}.` });
                        }

                        targetUser = new User({
                            mysqlUserId: numericTargetMysqlUserId,
                            firstname: capitalizeFirstLetter(studentData.student.firstname),
                            lastname: capitalizeFirstLetter(studentData.student.lastname), 
                            email: placeholderEmail,
                            status: 'offline',
                            lastSeen: new Date(0)
                        });
                        await targetUser.save();
                        console.log(`Created new 'offline' stub user in MongoDB for ${targetUser.firstname} ${targetUser.lastname} (Student ID: ${numericTargetMysqlUserId}) with email ${placeholderEmail}`);
                    } else {
                        let errorMsg = `Could not create chat: Essential details (ID, firstname, lastname) for student (ID: ${numericTargetMysqlUserId}) not found or incomplete via backend.`;
                        if (studentData && !studentData.success) {
                            errorMsg = `Could not create chat: Failed to retrieve details for student ID ${numericTargetMysqlUserId} from backend: ${studentData.message || 'Unknown error'}`;
                        }
                        console.error(errorMsg, studentData);
                        return socket.emit('error', { message: errorMsg });
                    }
                } catch (fetchError) {
                    let errMsg = `Server error: Could not retrieve details for student ID ${numericTargetMysqlUserId} from the main system.`;
                    if (fetchError.response && fetchError.response.status === 404 && fetchError.config.url.includes('getStudentDetailsAjax')) {
                        errMsg = `Could not create chat: The backend method to fetch student details (ID: ${numericTargetMysqlUserId}) was not found. Please check server logs.`;
                        console.error(`Error fetching student details for ${numericTargetMysqlUserId} from PHP backend (URL: ${fetchError.config.url}): Method not found (404) or other error.`, fetchError.message);
                    } else {
                        console.error(`Error fetching student details for ${numericTargetMysqlUserId} from PHP backend:`, fetchError.response ? fetchError.response.data : fetchError.message);
                    }
                    return socket.emit('error', { message: errMsg });
                }
            }

            const targetUserMongoId = targetUser._id.toString();
            const participantsMongoIds = [currentUserMongoId, targetUserMongoId].sort();
            let chat = await Chat.findOne({
                type: 'private',
                participants: { $all: participantsMongoIds, $size: 2 }
            })
                .populate('participants', 'firstname lastname mysqlUserId email status lastSeen')
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'senderId', select: 'firstname lastname mysqlUserId email' }
                });

            if (!chat) {
                console.log(`No existing private chat found between ${currentUserMongoId} and ${targetUserMongoId}. Creating new one.`);
                chat = new Chat({
                    participants: participantsMongoIds,
                    type: 'private',
                    createdBy: currentUserMongoId,
                    updatedAt: new Date()
                });
                await chat.save();
                chat = await Chat.findById(chat._id)
                    .populate('participants', 'firstname lastname mysqlUserId email status lastSeen')
                    .populate({
                        path: 'lastMessage',
                        populate: { path: 'senderId', select: 'firstname lastname mysqlUserId email' }
                    });
            }
            socket.emit('chatInitiated', chat);
            if (targetUser.status === 'online' && userSockets.has(targetUserMongoId)) {
                userSockets.get(targetUserMongoId).forEach(socketId => {
                    io.to(socketId).emit('newChatStarted', chat);
                });
            }

        } catch (error) {
            if (error.code === 11000) {
                console.error('Error initiating chat (duplicate key):', error.keyValue);
                socket.emit('error', { message: `Failed to initiate chat. A conflicting record already exists (e.g. email: ${error.keyValue.email}).` });
            } else if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                socket.emit('error', { message: `Validation Error: ${messages.join(', ')}` });
            } else {
                console.error('Error initiating chat:', error);
                socket.emit('error', { message: 'Failed to initiate chat due to a server error.' });
            }
        }
    });

    //СТВОРЕННЯ ГРУПОВОГО ЧАТУ
    socket.on('createGroupChat', async ({ memberMysqlUserIds, groupName }) => {
        if (!socket.mongoUserId || !socket.mysqlUserId) return socket.emit('error', { message: 'Cannot create group: Your user is not identified.' });
        if (!memberMysqlUserIds || !Array.isArray(memberMysqlUserIds) || memberMysqlUserIds.length === 0) {
            return socket.emit('error', { message: 'Cannot create group: No members selected.' });
        }
        if (!groupName || groupName.trim() === '') {
            return socket.emit('error', { message: 'Cannot create group: Group name is required.' });
        }

        console.log(`Create group chat attempt: Creator MySQL ID ${socket.mysqlUserId}, Members: ${memberMysqlUserIds.join(', ')}, Name: ${groupName}`);

        try {
            const creatorMongoId = socket.mongoUserId;
            const allMemberMysqlIds = [socket.mysqlUserId, ...memberMysqlUserIds.map(id => parseInt(id))];
            const uniqueMemberMysqlIds = [...new Set(allMemberMysqlIds)];

            if (uniqueMemberMysqlIds.length < 2) { // Technically a group should have at least 2, but creator + 1 other = 2. If only creator, it's not a group.
                 return socket.emit('error', { message: 'A group chat requires at least one other member besides yourself.' });
            }

            const memberMongoUsers = [];
            for (const mysqlId of uniqueMemberMysqlIds) {
                let user = await User.findOne({ mysqlUserId: mysqlId });
                if (!user) {
                    // Attempt to fetch and create stub user if not found (similar to initiateChat)
                    try {
                        const phpAppBaseUrl = process.env.PHP_APP_URL || 'http://localhost';
                        const studentDetailsUrl = `${phpAppBaseUrl}/lab1/index.php?url=student/getStudentDetailsAjax&id=${mysqlId}`;
                        const response = await axios.get(studentDetailsUrl);
                        const studentData = response.data;

                        if (studentData && studentData.success && studentData.student) {
                            const placeholderEmailDomain = process.env.PLACEHOLDER_EMAIL_DOMAIN || 'chat.system';
                            const placeholderEmail = `student_${studentData.student.id}@${placeholderEmailDomain}`;
                            
                            user = new User({
                                mysqlUserId: mysqlId,
                                firstname: capitalizeFirstLetter(studentData.student.firstname),
                                lastname: capitalizeFirstLetter(studentData.student.lastname),
                                email: placeholderEmail, // Ensure this email is unique or handled
                                status: 'offline', // Or determine based on actual data if available
                                lastSeen: new Date(0)
                            });
                            await user.save();
                            console.log(`Created stub user for group member: ${user.firstname} ${user.lastname} (MySQL ID: ${mysqlId})`);
                        } else {
                            console.warn(`Could not fetch details for potential group member with MySQL ID: ${mysqlId}. Skipping.`);
                            continue; // Skip this user if details can't be fetched
                        }
                    } catch (fetchError) {
                        console.error(`Error fetching details for group member MySQL ID ${mysqlId}:`, fetchError.message);
                        continue; // Skip this user
                    }
                }
                memberMongoUsers.push(user);
            }
            
            const participantMongoIds = memberMongoUsers.map(u => u._id);

            if (participantMongoIds.length < 2) {
                 return socket.emit('error', { message: 'Not enough valid members to create a group chat.' });
            }

            let chat = new Chat({
                type: 'group',
                name: groupName.trim(),
                participants: participantMongoIds,
                admins: [creatorMongoId], // Creator is admin
                createdBy: creatorMongoId,
                updatedAt: new Date()
            });
            await chat.save();

            chat = await Chat.findById(chat._id)
                .populate('participants', 'firstname lastname mysqlUserId email status lastSeen')
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'senderId', select: 'firstname lastname mysqlUserId email' }
                });

            // Notify creator
            socket.emit('chatInitiated', chat);

            // Notify other participants
            participantMongoIds.forEach(participantMongoId => {
                if (participantMongoId.toString() !== creatorMongoId) {
                    if (userSockets.has(participantMongoId.toString())) {
                        userSockets.get(participantMongoId.toString()).forEach(socketId => {
                            io.to(socketId).emit('newChatStarted', chat); // Or 'chatUpdated' if more appropriate
                        });
                    }
                }
            });
            console.log(`Group chat "${chat.name}" created by ${socket.userFullname} with ${chat.participants.length} members.`);

        } catch (error) {
            if (error.code === 11000) {
                console.error('Error creating group chat (duplicate key):', error.keyValue);
                socket.emit('error', { message: `Failed to create group. A conflicting record might exist (e.g., unique constraint on chat properties).` });
            } else if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(val => val.message);
                socket.emit('error', { message: `Validation Error: ${messages.join(', ')}` });
            } else {
                console.error('Error creating group chat:', error);
                socket.emit('error', { message: 'Failed to create group chat due to a server error.' });
            }
        }
    });

    //ДОДАВАННЯ УЧАСНИКІВ ДО ГРУПОВОГО ЧАТУ
    socket.on('addMembersToChat', async ({ chatId, newMemberMysqlUserIds }) => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified.' });
        if (!chatId || !newMemberMysqlUserIds || !Array.isArray(newMemberMysqlUserIds) || newMemberMysqlUserIds.length === 0) {
            return socket.emit('error', { message: 'Invalid data for adding members.' });
        }
        try {
            const chat = await Chat.findById(chatId).populate('participants', '_id mysqlUserId');
            if (!chat) return socket.emit('error', { message: 'Chat not found.' });

            const isParticipant = chat.participants.some(p => p._id.toString() === socket.mongoUserId);
            if (!isParticipant) return socket.emit('error', { message: 'You are not a member of this chat.' });

            const newMemberMongoUsers = await User.find({ mysqlUserId: { $in: newMemberMysqlUserIds } }).select('_id');
            const newMemberMongoIds = newMemberMongoUsers.map(u => u._id);
            let membersAddedCount = 0;
            newMemberMongoIds.forEach(newMongoId => {
                if (!chat.participants.some(p => p._id.equals(newMongoId))) {
                    chat.participants.push(newMongoId);
                    membersAddedCount++;
                }
            });
            if (membersAddedCount > 0) {
                if (chat.type === 'private' && chat.participants.length > 2) {
                    chat.type = 'group';
                    if (!chat.name) {
                        chat.name = "Group Chat";
                    }
                }
                if (chat.type === 'group' && !chat.admins.includes(socket.mongoUserId)) {
                    chat.admins.push(socket.mongoUserId);
                }

                await chat.save();
                const updatedChat = await Chat.findById(chatId)
                    .populate('participants', 'firstname lastname mysqlUserId email status lastSeen')
                    .populate({
                        path: 'lastMessage',
                        populate: { path: 'senderId', select: 'firstname lastname mysqlUserId' }
                    });
                updatedChat.participants.forEach(participant => {
                    if (userSockets.has(participant._id.toString())) {
                        userSockets.get(participant._id.toString()).forEach(socketId => {
                            io.to(socketId).emit('chatUpdated', updatedChat);
                        });
                    }
                });
                console.log(`${membersAddedCount} members added to chat ${chatId} by ${socket.userFullname}`);
            } else {
                socket.emit('info', { message: 'Selected users are already in the chat or not found.' });
            }

        } catch (error) {
            console.error('Error adding members to chat:', error);
            socket.emit('error', { message: 'Failed to add members to chat.' });
        }
    });

    //ВІДКРИТТЯ ЧАТУ
    socket.on('requestOpenChat', async ({ chatId }) => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified.' });
        if (!chatId) return socket.emit('error', { message: 'Chat ID not provided for opening.' });

        try {
            const chat = await Chat.findOne({ _id: chatId, participants: socket.mongoUserId })
                .populate('participants', 'firstname lastname mysqlUserId email status lastSeen _id')
                .populate({
                    path: 'lastMessage',
                    populate: { path: 'senderId', select: 'firstname lastname mysqlUserId email _id' }
                });

            if (chat) {
                socket.emit('openThisChat', chat);
            } else {
                socket.emit('error', { message: `Chat not found or you do not have access: ${chatId}` });
            }
        } catch (error) {
            console.error(`Error fetching chat ${chatId} for user ${socket.mongoUserId}:`, error);
            socket.emit('error', { message: 'Failed to fetch chat details.' });
        }
    });

    //ПРИЄДНАННЯ ДО ЧАТУ
    socket.on('joinChatRoom', (chatId) => {
        if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
        }
        socket.join(chatId);
        socket.currentRoom = chatId;
        console.log(`Socket ${socket.id} (user ${socket.mongoUserId}) joined room ${chatId}`);
    });

    //ЗАВАНТАЖЕННЯ ПОВІДОМЛЕНЬ ДЛЯ ЧАТУ
    socket.on('loadMessagesForChat', async (chatId) => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified.' });
        if (!chatId) return socket.emit('error', { message: 'Chat ID not provided.' });

        try {
            const messages = await Message.find({ chatId: chatId })
                .sort({ timestamp: 1 }) // Sort by oldest first
                .populate('senderId', 'firstname lastname email mysqlUserId status _id');

            socket.emit('messagesLoaded', { chatId, messages });
        } catch (error) {
            console.error(`Error loading messages for chat ${chatId}:`, error);
            socket.emit('error', { message: 'Failed to load messages.' });
        }
    });

    //НАДСИЛАННЯ ПОВІДОМЛЕННЯ
    socket.on('sendMessage', async ({ chatId, content }) => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified. Cannot send message.' });
        if (!chatId || !content || content.trim() === '') {
            return socket.emit('error', { message: 'Invalid message data.' });
        }

        try {
            const newMessage = new Message({
                senderId: socket.mongoUserId,
                chatId: chatId,
                content: content.trim(),
                timestamp: new Date()
            });
            await newMessage.save();

            const populatedMessage = await Message.findById(newMessage._id)
                .populate('senderId', 'firstname lastname email mysqlUserId status _id');
            const updatedChat = await Chat.findByIdAndUpdate(
                chatId,
                {
                    lastMessage: newMessage._id,
                    updatedAt: new Date()
                },
                { new: true }
            ).populate('participants', '_id');

            if (!updatedChat) {
                console.error(`[sendMessage] Помилка: Чат з ID ${chatId} не знайдено після оновлення.`);
                return socket.emit('error', { message: `Failed to process message: Chat ${chatId} not found.` });
            }
            io.to(chatId).emit('newMessage', populatedMessage);
            updatedChat.participants.forEach(participant => {
                const participantMongoIdStr = participant._id.toString();

                if (participantMongoIdStr === socket.mongoUserId) {
                    return;
                }
                const participantSocketIds = userSockets.get(participantMongoIdStr);
                if (participantSocketIds) {
                    participantSocketIds.forEach(socketId => {
                        const targetSocket = io.sockets.sockets.get(socketId);
                        if (targetSocket && targetSocket.currentRoom !== chatId) {
                            console.log(`SERVER: Надсилаю 'notification' користувачу ${participantMongoIdStr} на сокет ${socketId} для чату ${chatId}`);
                            targetSocket.emit('notification', {
                                chatId: chatId,
                                message: populatedMessage // Це повний об'єкт повідомлення
                            });
                        } else if (targetSocket && targetSocket.currentRoom === chatId) {
                        } else if (!targetSocket) {
                        }
                    });
                }
            });
        } catch (error) {
            console.error(`Помилка надсилання повідомлення в чаті ${chatId} користувачем ${socket.mongoUserId}:`, error);
            socket.emit('error', { message: 'Failed to send message.' });
        }
    });
    socket.on('disconnect', async () => {
        console.log(`Client disconnected: ${socket.id}, User MongoDB ID: ${socket.mongoUserId}, MySQL ID: ${socket.mysqlUserId}`);
        if (socket.mongoUserId) {
            const userConnections = userSockets.get(socket.mongoUserId);
            if (userConnections) {
                userConnections.delete(socket.id);
                if (userConnections.size === 0) {
                    userSockets.delete(socket.mongoUserId);
                    console.log(`User ${socket.userFullname || socket.mongoUserId} (MongoDB ID: ${socket.mongoUserId}) is now fully offline.`);
                    await updateUserStatus(socket.mongoUserId, 'offline');
                } else {
                    console.log(`User ${socket.userFullname || socket.mongoUserId} (MongoDB ID: ${socket.mongoUserId}) still has ${userConnections.size} active connections.`);
                }
            }
        }
    });

});
