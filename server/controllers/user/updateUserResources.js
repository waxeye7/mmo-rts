const User = require('../../models/user');
const getCost = require('../../../CONSTANTS/getCost');

const updateUserResources = async (userId, resources = {}) => {
  // Get the structure cost
  const update = {};
  for (let resource in resources) {
    let cost = 0;
    if (typeof(resources[resource]) === "number") {
      cost += resources[resource];
    } else {
      cost -= getCost(resources[resource]);
    }
    update[`resources.${resource}`] = cost;
  }

  // Access the database and update the user's resources
  await User.findByIdAndUpdate(
    userId,
    { $inc: update },
    { new: true, useFindAndModify: false }
  ).exec();
};

module.exports = updateUserResources;
