const User = require("../../models/user");
const resetActions = async () => {
  try {
    await User.updateMany({}, { $set: { actions: 10 } });
    console.log("Reset actions for all players.");
    return true;
  } catch (err) {
    console.error("Error resetting actions:", err);
    return false;
  }
};

module.exports = resetActions;