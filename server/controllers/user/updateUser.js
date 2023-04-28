const User = require("../../models/user");
const { hashPassword } = require("../../utils/passwordHashing");

const updateUser = async (req, res) => {
    try {
        // Hash password if provided
        if (req.body.password) {
            req.body.password = await hashPassword(req.body.password);
        }

        const toUpdate_User = await User.findByIdAndUpdate(
            { _id: req.params.id },
            { $set: req.body }
        );

        res.json(toUpdate_User);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = updateUser;
