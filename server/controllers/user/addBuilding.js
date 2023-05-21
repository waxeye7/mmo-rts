const User = require("../../models/user");

const addBuilding = async (buildingId, userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.buildings.push(buildingId)
      await user.save();
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = addBuilding;