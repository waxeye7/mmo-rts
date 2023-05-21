const TaskTimestamp = require('../../models/taskTimestamp');
const getTimerAmount = require('../../CONSTANTS/getTimerAmount');

const loadNextTaskTimestamp = async () => {
  const taskTimestamp = await TaskTimestamp.findOne({});
  const timerValue = getTimerAmount();
  if (!taskTimestamp) {
    // If no timestamp is found in the database, create one and save it
    const newTimestamp = new TaskTimestamp({
      timestamp: Date.now() + timerValue
    });
    await newTimestamp.save();
    return newTimestamp.timestamp;
  }
  return taskTimestamp.timestamp;
};

module.exports = loadNextTaskTimestamp;