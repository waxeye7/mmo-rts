const User = require("../../models/user");
const getAllUserIdentifiers = async (req, res) => {
  try {
    const users = await User.find().select("username identifier.backgroundColor identifier.fillColor identifier.shape -_id");
    const usersWithoutId = users.map((user) => {
      const { _id, ...userWithoutId } = user.toObject();
      return userWithoutId;
    });


    const userIdentifierInfo = {};
    usersWithoutId.forEach((user) => {
      userIdentifierInfo[user.username] = user.identifier;
    });

    res.json(userIdentifierInfo);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

module.exports = getAllUserIdentifiers;
