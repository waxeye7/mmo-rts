const User = require('../../models/user');
const getCost = require('../../../CONSTANTS/getCost');

const updateUserGold = async (userId, instance) => {
  // Get the structure cost
  const cost = getCost(instance);

  // Access the database and update the user's gold
  await User.findByIdAndUpdate(
    userId,
    { $inc: { 'resources.gold': -cost } },
    { new: true, useFindAndModify: false }
  ).exec();
};

module.exports = updateUserGold;
