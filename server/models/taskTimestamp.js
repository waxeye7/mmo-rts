const mongoose = require('mongoose');

const TaskTimestampSchema = new mongoose.Schema({
  timestamp: {
    type: Number,
    required: true
  }
});

const TaskTimestamp = mongoose.model('TaskTimestamp', TaskTimestampSchema);
module.exports = TaskTimestamp;