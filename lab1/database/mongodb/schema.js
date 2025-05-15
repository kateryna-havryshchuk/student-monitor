// server/database/mongodb/schema.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    mysqlUserId: {
        type: Number,
        unique: true,
        sparse: true // Allows null if not all chat users map to MySQL, but required if they do
    },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    status: {
        type: String,
        enum: ['online', 'offline', 'away'],
        default: 'offline'
    },
    lastSeen: { type: Date, default: Date.now },
    // 'chats' field can be removed if not actively maintained or if chats are primarily queried via Chat.participants
    // chats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }]
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    chatId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Chat' },
    content: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    name: { // Name for group chats
        type: String,
        trim: true,
        // Not strictly required for private chats, but can be set to a concatenation of participant names
        required: function() { return this.type === 'group'; }
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For group chat admin controls
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Good to know who initiated
}, { timestamps: true });

chatSchema.index({ participants: 1 }); // Efficiently find chats by participants

// This schema might be simplified or integrated if MySQL sync is primarily for notifications
const messageSyncSchema = new mongoose.Schema({
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
    mysqlSenderId: { type: Number, required: true },
    mysqlRecipientIds: [{ type: Number, required: true }],
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Chat = mongoose.model('Chat', chatSchema);
const MessageSync = mongoose.model('MessageSync', messageSyncSchema);

module.exports = { User, Message, Chat, MessageSync };  