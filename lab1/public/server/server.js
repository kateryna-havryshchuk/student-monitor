// public/server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
// Corrected path to schema.js based on typical project structure from screenshot
const { User, Message, Chat, MessageSync } = require('../../database/mongodb/schema.js');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
    cors: {
        origin: "http://localhost", // Your PHP app's domain
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(express.json());

mongoose.connect('mongodb://localhost:27017/chatdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected to chatdb'))
.catch(err => console.error('MongoDB connection error:', err));

const userSockets = new Map(); // MongoDB User ID (string) -> Set of socket IDs

async function updateUserStatus(mongoUserId, status) {
    try {
        const user = await User.findByIdAndUpdate(mongoUserId, { status: status, lastSeen: new Date() }, { new: true });
        if (user) {
            // Broadcast status update to relevant users (e.g., participants of shared chats)
            const chats = await Chat.find({ participants: mongoUserId }).populate('participants', '_id');
            const allParticipantIds = new Set();
            chats.forEach(chat => {
                chat.participants.forEach(p => {
                    if (p._id.toString() !== mongoUserId) { // Don't send to self
                        allParticipantIds.add(p._id.toString());
                    }
                });
            });

            allParticipantIds.forEach(participantMongoId => {
                if (userSockets.has(participantMongoId)) {
                    userSockets.get(participantMongoId).forEach(socketId => {
                        io.to(socketId).emit('userStatusChanged', {
                            userId: mongoUserId,
                            mysqlUserId: user.mysqlUserId, // Send mysqlUserId as client might use it
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

    socket.on('identifyUser', async (userData) => {
        try {
            if (!userData.mysqlUserId) { // MySQL User ID is crucial
                console.log(`Identification failed for socket ${socket.id}: missing mysqlUserId`);
                socket.emit('error', { message: 'Identification failed: missing mysqlUserId.' });
                return;
            }

            let mongoUser = await User.findOne({ mysqlUserId: userData.mysqlUserId });

            if (!mongoUser) {
                if (!userData.firstname || !userData.lastname || !userData.email) {
                    console.log(`Cannot create new user for socket ${socket.id} (mysqlId: ${userData.mysqlUserId}): missing details.`);
                    socket.emit('error', { message: 'Cannot create new user: missing details (firstname, lastname, email).' });
                    return;
                }
                console.log(`User not found in MongoDB (mysqlUserId: ${userData.mysqlUserId}), creating new one for ${userData.email}`);
                mongoUser = new User({
                    mysqlUserId: userData.mysqlUserId,
                    firstname: userData.firstname,
                    lastname: userData.lastname,
                    email: userData.email,
                    status: 'online', // Set status to online on creation and identification
                    lastSeen: new Date()
                });
                await mongoUser.save();
            } else {
                // User exists, update status to online
                mongoUser.status = 'online';
                mongoUser.lastSeen = new Date();
                await mongoUser.save();
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
                 status: mongoUser.status
            });

            // Broadcast user's online status
            updateUserStatus(socket.mongoUserId, 'online');

        } catch (error) {
            console.error(`Error in identifyUser for socket ${socket.id}:`, error);
            socket.emit('error', { message: 'Server error during user identification.' });
        }
    });

    socket.on('loadMyChats', async () => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified.' });
        try {
            const chats = await Chat.find({ participants: socket.mongoUserId })
                .populate('participants', 'firstname lastname mysqlUserId email status lastSeen') // Include status
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

    socket.on('initiateChat', async ({ targetMysqlUserId }) => {
        if (!socket.mongoUserId || !socket.mysqlUserId) return socket.emit('error', { message: 'Cannot initiate chat: Your user is not identified.' });
        if (!targetMysqlUserId) return socket.emit('error', { message: 'Cannot initiate chat: Target user ID is missing.' });

        if (socket.mysqlUserId === parseInt(targetMysqlUserId)) {
             return socket.emit('error', { message: "You cannot start a chat with yourself." });
        }

        try {
            const currentUserMongoId = socket.mongoUserId;
            const targetUser = await User.findOne({ mysqlUserId: targetMysqlUserId }).select('_id firstname lastname mysqlUserId email status lastSeen');

            if (!targetUser) {
                return socket.emit('error', { message: `User with MySQL ID ${targetMysqlUserId} not found in chat system. Ensure they log in once to register.` });
            }
            const targetUserMongoId = targetUser._id.toString();

            const participantsMongoIds = [currentUserMongoId, targetUserMongoId].sort();

            let chat = await Chat.findOne({
                type: 'private', // Ensure it's a private chat
                participants: { $all: participantsMongoIds, $size: 2 }
            })
            .populate('participants', 'firstname lastname mysqlUserId email status lastSeen')
            .populate({
                path: 'lastMessage',
                populate: { path: 'senderId', select: 'firstname lastname mysqlUserId' }
            });

            if (!chat) {
                console.log(`No existing private chat found between ${currentUserMongoId} and ${targetUserMongoId}. Creating new one.`);
                chat = new Chat({
                    participants: participantsMongoIds,
                    type: 'private',
                    createdBy: currentUserMongoId
                });
                await chat.save();
                chat = await Chat.findById(chat._id) // Re-fetch to populate correctly
                    .populate('participants', 'firstname lastname mysqlUserId email status lastSeen');
            }
            socket.emit('chatInitiated', chat);

            // Also inform the target user if they are online and not the initiator
            if (userSockets.has(targetUserMongoId)) {
                userSockets.get(targetUserMongoId).forEach(socketId => {
                    io.to(socketId).emit('newChatStarted', chat); // Or use chatInitiated if it makes sense
                });
            }

        } catch (error) {
            console.error('Error initiating chat:', error);
            socket.emit('error', { message: 'Failed to initiate chat.' });
        }
    });

    socket.on('addMembersToChat', async ({ chatId, newMemberMysqlUserIds }) => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified.' });
        if (!chatId || !newMemberMysqlUserIds || !Array.isArray(newMemberMysqlUserIds) || newMemberMysqlUserIds.length === 0) {
            return socket.emit('error', { message: 'Invalid data for adding members.' });
        }

        try {
            const chat = await Chat.findById(chatId).populate('participants', '_id mysqlUserId');
            if (!chat) return socket.emit('error', { message: 'Chat not found.' });

            // Optional: Check if current user is an admin or participant
            const isParticipant = chat.participants.some(p => p._id.toString() === socket.mongoUserId);
            if (!isParticipant) return socket.emit('error', { message: 'You are not a member of this chat.' });
            // const isAdmin = chat.admins.includes(socket.mongoUserId);
            // if (!isAdmin && chat.type ==='group') return socket.emit('error', { message: 'Only admins can add members.' });


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
                    if (!chat.name) { // Set a default group name if not exists
                        chat.name = "Group Chat"; // Or generate based on participants
                    }
                }
                // Add current user as admin if they are the one creating/expanding to a group
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

                // Notify all (old and new) participants about the chat update
                updatedChat.participants.forEach(participant => {
                    if (userSockets.has(participant._id.toString())) {
                        userSockets.get(participant._id.toString()).forEach(socketId => {
                            io.to(socketId).emit('chatUpdated', updatedChat); // Event for client to update chat info/member list
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


    socket.on('joinChatRoom', (chatId) => {
        if (socket.currentRoom) {
            socket.leave(socket.currentRoom);
        }
        socket.join(chatId);
        socket.currentRoom = chatId;
        console.log(`Socket ${socket.id} (user ${socket.mongoUserId}) joined room ${chatId}`);