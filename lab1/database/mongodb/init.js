//database/mongodb/init.js
const { MongoClient } = require('mongodb');

async function initDatabase() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();

        const database = client.db('chatApp');

        const usersCollection = database.collection('users');
        const messagesCollection = database.collection('messages');
        const chatsCollection = database.collection('chats');

        await usersCollection.createIndex({ email: 1 }, { unique: true });
        await messagesCollection.createIndex({ chatId: 1 });
        await chatsCollection.createIndex({ participants: 1 });

        console.log('Database initialized and collections created successfully.');
    } catch (error) {
        console.error('Error initializing the database:', error);
    } finally {
        await client.close();
    }
}
initDatabase();