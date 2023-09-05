require('dotenv').config();

const mongoose = require('mongoose')

async function connectToDb() {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('Connected to summitStylesDB');
        return mongoose.connection;
    } catch (error) {
        console.log('Failed to connect to summitStylesDB', error);
        throw error;
    }
}

module.exports = connectToDb;