const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Chat'
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    messages: [messageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    chats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat'
    }]
});

const Message = mongoose.model('Message', messageSchema);
const Chat = mongoose.model('Chat', chatSchema);
const User = mongoose.model('User', userSchema);

module.exports = { Message, Chat, User };