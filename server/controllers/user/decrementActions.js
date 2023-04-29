const User = require("../../models/user");

const decrementActions = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user.actions > 0) {
      user.actions -= 1;
      await user.save();
      return user;
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = decrementActions;