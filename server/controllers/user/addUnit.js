const User = require("../../models/user");

const addUnit = async (buildingId, userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      user.units.push(buildingId)
      await user.save();
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = addUnit;