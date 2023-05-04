const User = require("../../models/user");
const getUser = async (req, res) => {
    try {
        const IDed_User = await User.findById({ _id: req.params.id }).select(
            "username actions resources"
          );
        res.json(IDed_User)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error getting user by ID" });
    }
}

module.exports = getUser;