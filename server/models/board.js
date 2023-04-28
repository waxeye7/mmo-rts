const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema({
  state: {
    type: Array,
    required: true
  }
});

const Board = mongoose.model('Board', BoardSchema);
module.exports = Board;