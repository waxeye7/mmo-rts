const User = require("../../models/user");

const addAction = async (action, userId) => {
  try {
    const user = await User.findById(userId);
    if (user.actions.length <= 10) {
      user.actions.push(action)
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

module.exports = addAction;