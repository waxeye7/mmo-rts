const TaskTimestamp = require('../../models/taskTimestamp');

const loadNextTaskTimestamp = async () => {
  const taskTimestamp = await TaskTimestamp.findOne({});
  if (!taskTimestamp) {
    // If no timestamp is found in the database, create one and save it
    const newTimestamp = new TaskTimestamp({
      timestamp: Date.now() + 12 * 60 * 60 * 1000,
    });
    await newTimestamp.save();
    return newTimestamp.timestamp;
  }
  return taskTimestamp.timestamp;
};

module.exports = loadNextTaskTimestamp;