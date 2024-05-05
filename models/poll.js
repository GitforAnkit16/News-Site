// models/poll.js

const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    options: [{
        text: {
            type: String,
            required: true
        },
        votes: {
            type: Number,
            default: 0
        }
    }],
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    voters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
