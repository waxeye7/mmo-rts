const User = require('../../models/user');
const getCost = require('../../../CONSTANTS/getCost');

const updateUserGold = async (userId, instance, increase) => {
  // Get the structure cost

  let cost;
  if(typeof(instance) === "number") {
    cost = instance;
  }
  else {
    cost = getCost(instance)
  }

  // Access the database and update the user's gold
  if(increase) {
    await User.findByIdAndUpdate(
      userId,
      { $inc: { 'resources.gold': cost } },
      { new: true, useFindAndModify: false }
    ).exec();
  }
  else {
    await User.findByIdAndUpdate(
      userId,
      { $inc: { 'resources.gold': -cost } },
      { new: true, useFindAndModify: false }
    ).exec();
  }

};

module.exports = updateUserGold;
