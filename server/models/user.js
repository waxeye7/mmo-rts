const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    password: {
        type: String,
        required: true,
    },
    actions: {
        type: Number,
        required: true,
    },
    resources: {
        type: Object,
        required: true,
    },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;