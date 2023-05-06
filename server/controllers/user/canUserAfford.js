const User = require("../../models/user");
const getCost = require('../../../CONSTANTS/getCost');
const canUserAfford = async (userId, instance) => {
  // Get the structure cost
  const cost = getCost(instance);
  // Access the database to retrieve the user's gold using Mongoose
  const user = await User.findById(userId).exec();
  // Check if the user has enough gold
  return user.resources.gold >= cost;
};

module.exports = canUserAfford;