const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('../../database/mongodb/schema'); // Adjust the path as necessary

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log('New user connected');

    // Join a chat room
    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
    });

    // Send a message
    socket.on('sendMessage', async (data) => {
        const { room, message, sender } = data;

        // Save message to the database
        const newMessage = new Message({
            room,
            message,
            sender,
            timestamp: new Date(),
        });

        await newMessage.save();

        // Emit the message to the room
        io.to(room).emit('receiveMessage', newMessage);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});