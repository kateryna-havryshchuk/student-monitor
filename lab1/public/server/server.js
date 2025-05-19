// public/server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const axios = require('axios'); // <--- ADD THIS LINE
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

// Helper function to capitalize the first letter of a string and lowercase the rest
function capitalizeFirstLetter(string) {
    if (!string || typeof string !== 'string') return '';
    const lower = string.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
}

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
            if (!userData.mysqlUserId) {
                console.log(`Identification failed for socket ${socket.id}: missing mysqlUserId`);
                socket.emit('error', { message: 'Identification failed: missing mysqlUserId.' });
                return;
            }
            // These details are now crucial for updating/creating the definitive record
            if (!userData.email || !userData.firstname || !userData.lastname) {
                console.log(`Identification failed for socket ${socket.id} (mysqlId: ${userData.mysqlUserId}): missing crucial details (email, firstname, lastname).`);
                socket.emit('error', { message: 'Identification failed: missing email, firstname, or lastname.' });
                return;
            }

            const normalizedFirstname = capitalizeFirstLetter(userData.firstname);
            const normalizedLastname = capitalizeFirstLetter(userData.lastname);
            const actualEmail = userData.email.toLowerCase(); // Real email from logged-in user

            let mongoUser = await User.findOne({ mysqlUserId: userData.mysqlUserId });

            if (!mongoUser) {
                // Case 1: No user found by mysqlUserId. This could be:
                //   a) A completely new user to the chat system.
                //   b) A user whose mysqlUserId was never used to create a placeholder (e.g., if they registered in PHP before ever being selected for a chat).

                // Check if another user already exists with the actualEmail but a DIFFERENT mysqlUserId.
                // This would indicate a potential data conflict or a user trying to claim an email already in use.
                let existingByActualEmail = await User.findOne({ email: actualEmail });
                if (existingByActualEmail && existingByActualEmail.mysqlUserId !== userData.mysqlUserId) {
                    console.error(`User identification error: Email ${actualEmail} already exists for mysqlUserId ${existingByActualEmail.mysqlUserId}. Cannot assign to ${userData.mysqlUserId}.`);
                    socket.emit('error', { message: `This email address (${actualEmail}) is already associated with a different account in the chat system.` });
                    return;
                }
                
                // If existingByActualEmail has the SAME mysqlUserId, it means findOne by mysqlUserId should have found it.
                // This path implies: create a new user because no record exists for this mysqlUserId,
                // and no *other* user has claimed this actualEmail.
                console.log(`User not found in MongoDB by mysqlUserId: ${userData.mysqlUserId}. Creating new user profile with actual email: ${actualEmail}.`);
                mongoUser = new User({
                    mysqlUserId: userData.mysqlUserId,
                    firstname: normalizedFirstname,
                    lastname: normalizedLastname,
                    email: actualEmail, // Use the real email from login
                    status: 'online',
                    lastSeen: new Date()
                });
                await mongoUser.save();
            } else {
                // Case 2: User found by mysqlUserId. This is the "Sashko Sobran" student (ID 143) who now logged in.
                // Their record might have a placeholder email. We need to update it.

                // Before updating the email, check if the new actualEmail is already taken by ANOTHER mysqlUserId.
                if (mongoUser.email.toLowerCase() !== actualEmail) { // Only check if email is changing
                    let conflictingUserWithNewEmail = await User.findOne({ email: actualEmail });
                    if (conflictingUserWithNewEmail && conflictingUserWithNewEmail.mysqlUserId !== userData.mysqlUserId) {
                        console.error(`User update error: Cannot change email for mysqlUserId ${userData.mysqlUserId} to ${actualEmail} because it's already used by mysqlUserId ${conflictingUserWithNewEmail.mysqlUserId}.`);
                        socket.emit('error', { message: `The email address (${actualEmail}) you are trying to use is already associated with another account.` });
                        // Potentially, do not update the user and disconnect or keep old data.
                        // For now, we'll just prevent the update of the email.
                        // Or, you might decide to proceed but log a severe warning.
                        // Let's re-fetch the user to avoid saving partial changes if we abort.
                        mongoUser = await User.findOne({ mysqlUserId: userData.mysqlUserId }); // re-fetch
                    } else {
                         mongoUser.email = actualEmail; // OK to update email
                    }
                }
                
                console.log(`User found in MongoDB (mysqlUserId: ${userData.mysqlUserId}). Updating profile. Old email: ${mongoUser.email}, New email: ${actualEmail}`);
                mongoUser.firstname = normalizedFirstname;
                mongoUser.lastname = normalizedLastname;
                // mongoUser.email is updated above if no conflict
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

    socket.on('initiateChat', async ({ targetMysqlUserId }) => { // targetMysqlUserId is the student_id
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
                    const studentDetailsUrl = `${phpAppBaseUrl}/lab1/index.php?url=student/getStudentDetailsAjax&id=${numericTargetMysqlUserId}`;
                    
                    console.log(`Fetching student details from: ${studentDetailsUrl}`);
                    const response = await axios.get(studentDetailsUrl);
                    const studentData = response.data;

                    // CORRECTED CONDITION: Only need id, firstname, lastname from PHP
                    if (studentData && studentData.success && studentData.student && 
                        studentData.student.id && studentData.student.firstname && studentData.student.lastname) {

                    const placeholderEmailDomain = process.env.PLACEHOLDER_EMAIL_DOMAIN || 'chat.system';
                    // Ensure mysqlUserId used for placeholder is the numeric one from the student record
                    const placeholderEmail = `student_${studentData.student.id}@${placeholderEmailDomain}`; // Changed from fetchedStudent.id

                    // Defensive check: ensure this placeholder email isn't somehow already taken
                    let existingByPlaceholderEmail = await User.findOne({ email: placeholderEmail });
                    if (existingByPlaceholderEmail && existingByPlaceholderEmail.mysqlUserId !== numericTargetMysqlUserId) {
                        // Handle this conflict - perhaps generate a different placeholder or log an error
                        console.error(`Placeholder email ${placeholderEmail} conflict for mysqlUserId ${numericTargetMysqlUserId}. Existing user:`, existingByPlaceholderEmail.mysqlUserId);
                        return socket.emit('error', { message: `Could not create chat: Internal email conflict for student ID ${numericTargetMysqlUserId}.` });
                    }
                    
                    targetUser = new User({
                        mysqlUserId: numericTargetMysqlUserId,                            
                        firstname: capitalizeFirstLetter(studentData.student.firstname), // Changed from fetchedStudent.firstname
                        lastname: capitalizeFirstLetter(studentData.student.lastname),   // Changed from fetchedStudent.lastname
                        email: placeholderEmail,                            
                        status: 'offline',
                        lastSeen: new Date(0)                        
                    });
                    await targetUser.save();
                    console.log(`Created new 'offline' stub user in MongoDB for ${targetUser.firstname} ${targetUser.lastname} (Student ID: ${numericTargetMysqlUserId}) with email ${placeholderEmail}`);
                } else {
                    // Error message if essential details (id, firstname, lastname) are missing from PHP response
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
            if (error.code === 11000) { // MongoDB duplicate key error
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
    });

    socket.on('loadMessagesForChat', async (chatId) => {
        if (!socket.mongoUserId) return socket.emit('error', { message: 'User not identified.' });
        if (!chatId) return socket.emit('error', { message: 'Chat ID not provided.' });

        try {
            const messages = await Message.find({ chatId: chatId })
                .sort({ timestamp: 1 }) // Sort by oldest first
                .populate('senderId', 'firstname lastname email mysqlUserId status _id'); // Populate sender details

            socket.emit('messagesLoaded', { chatId, messages });
        } catch (error) {
            console.error(`Error loading messages for chat ${chatId}:`, error);
            socket.emit('error', { message: 'Failed to load messages.' });
        }
    });

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

            // Populate sender information for broadcasting
            const populatedMessage = await Message.findById(newMessage._id)
                .populate('senderId', 'firstname lastname email mysqlUserId status _id');

            // Update the lastMessage in the Chat document
            await Chat.findByIdAndUpdate(chatId, {
                lastMessage: newMessage._id,
                updatedAt: new Date() // Explicitly update updatedAt to trigger sorting/UI updates
            });

            // Emit the new message to all clients in the chat room (including other tabs of the sender)
            io.to(chatId).emit('newMessage', populatedMessage);

            // Notify participants who are not in the room (e.g., for push notifications or badge updates)
            // This part can be enhanced based on specific notification requirements
            const chat = await Chat.findById(chatId).select('participants');
            if (chat) {
                chat.participants.forEach(participantMongoId => {
                    const participantIdStr = participantMongoId.toString();
                    if (userSockets.has(participantIdStr)) {
                        userSockets.get(participantIdStr).forEach(socketId => {
                            // Avoid sending 'newMessage' again if they are already in the room,
                            // but could send a different event like 'unreadMessageNotification' if needed.
                            // For simplicity, 'newMessage' is often sufficient if client handles it well.
                            if (socket.id !== socketId) { // Example: don't re-send to the exact same socket if already handled by io.to(chatId)
                                // io.to(socketId).emit('notification', { type: 'newMessage', chatId: chatId, message: populatedMessage });
                            }
                        });
                    }
                });
            }

        } catch (error) {
            console.error(`Error sending message in chat ${chatId} by user ${socket.mongoUserId}:`, error);
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
                    // No more active connections for this user
                    userSockets.delete(socket.mongoUserId);
                    console.log(`User ${socket.userFullname || socket.mongoUserId} (MongoDB ID: ${socket.mongoUserId}) is now fully offline.`);
                    // Update status to 'offline' and broadcast
                    await updateUserStatus(socket.mongoUserId, 'offline');
                } else {
                    console.log(`User ${socket.userFullname || socket.mongoUserId} (MongoDB ID: ${socket.mongoUserId}) still has ${userConnections.size} active connections.`);
                }
            }
        }
        // Socket.IO automatically handles leaving rooms the socket was in.
    });

}); // End of io.on('connection')

const PORT = process.env.PORT || 4000; // Align with chatClient.js
server.listen(PORT, () => {
    console.log(`Socket.IO server running on http://localhost:${PORT}`);
});