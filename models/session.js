const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
        username: { type: String, required: true },
        password: { type: String, required: true }
});

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;