// This script initializes the MongoDB database and creates necessary collections.

const { MongoClient } = require('mongodb');

async function initDatabase() {
    const uri = 'mongodb://localhost:27017'; // Connection URL
    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Specify the database
        const database = client.db('chatApp'); // Change 'chatApp' to your desired database name

        // Create collections
        const usersCollection = database.collection('users');
        const messagesCollection = database.collection('messages');
        const chatsCollection = database.collection('chats');

        // Optional: Create indexes for better performance
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await messagesCollection.createIndex({ chatId: 1 });
        await chatsCollection.createIndex({ participants: 1 });

        console.log('Database initialized and collections created successfully.');
    } catch (error) {
        console.error('Error initializing the database:', error);
    } finally {
        // Close the connection
        await client.close();
    }
}

// Run the initialization function
initDatabase();