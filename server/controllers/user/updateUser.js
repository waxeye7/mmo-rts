const User = require("../../models/user");
const { hashPassword } = require("../../utils/passwordHashing");

const updateUser = async (req, res) => {
  try {
    // Extract the properties that can be updated
    const { password, identifier } = req.body;
    const updateData = {};

    // Hash and update the password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update the identifier if provided
    if (identifier) {
      updateData.identifier = identifier;
    }

    const toUpdate_User = await User.findByIdAndUpdate(
      { _id: req.params.id },
      { $set: updateData },
      { new: true } // Return the updated document
    );

    res.json(toUpdate_User);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = updateUser;