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
    units: {
        type: Array,
        required: true,
    },
    buildings: {
        type: Array,
        required: true,
    },
    actions: {
        type: Array,
        required: true,
    },
    resources: {
        type: Object,
        required: true,
    },
    identifier: {
        backgroundColor: String,
        shape: String,
        fillColor: String,
      },
});

const User = mongoose.model('User', UserSchema);
module.exports = User;