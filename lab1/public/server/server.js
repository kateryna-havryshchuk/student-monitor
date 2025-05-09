const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const Message = require('../../database/mongodb/schema.js'); // Adjust the path as necessary

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to parse JSON requests
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/chatdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.IO connection
io.on('connection', (socket) => {
    console.log('New client connected');

    // Handle incoming messages
    socket.on('sendMessage', async (data) => {
        const newMessage = new Message(data);
        await newMessage.save();
        io.emit('receiveMessage', data); // Broadcast the message to all clients
    });

    // Handle user typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start the server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});