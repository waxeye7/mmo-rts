const User = require("../../models/user");

const deleteBuilding = async (buildingId, userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      let buildingIDs = user.buildings;
      if(!buildingIDs.length) return;
      let index = buildingIDs.indexOf(buildingId);
      buildingIDs.splice(index, 1);
      user.buildings = buildingIDs;
      await user.save();
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = deleteBuilding;