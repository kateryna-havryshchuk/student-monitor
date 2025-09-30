// server/database/mongodb/schema.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    mysqlUserId: {
        type: Number,
        unique: true,
        sparse: true
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
}, { timestamps: true });

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    chatId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Chat' },
    content: { type: String, required: true, trim: true },
    timestamp: { type: Date, default: Date.now }
});

const chatSchema = new mongoose.Schema({
    type: { type: String, enum: ['private', 'group'], default: 'private' },
    name: {
        type: String,
        trim: true,
        required: function() { return this.type === 'group'; }
    },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

chatSchema.index({ participants: 1 });

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