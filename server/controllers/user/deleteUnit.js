const User = require("../../models/user");

const deleteUnit = async (unitId, userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      let unitIDs = user.units;
      if(!unitIDs.length) return;
      let index = unitIDs.indexOf(unitId);
      unitIDs.splice(index, 1);
      user.units = unitIDs;
      await user.save();
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = deleteUnit;