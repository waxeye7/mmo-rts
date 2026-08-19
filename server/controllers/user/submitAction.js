const addAction = require("./addAction");
const { enqueue } = require("../../actionsQueue");

const submitAction = async (req, res) => {
  try {
    const action = req.body;
    if (!action || !action.type) {
      return res.status(400).json({ message: "action type required" });
    }
    const user = req.user;
    if (user.actions.length >= 10) {
      return res.status(400).json({ message: "no actions left this turn" });
    }
    const updated = await addAction(action, req.userId);
    if (!updated) {
      return res.status(400).json({ message: "could not queue action" });
    }
    if (!enqueue(action, req.userId)) {
      return res.status(400).json({ message: "invalid action type" });
    }
    const safe = updated.toObject ? updated.toObject() : updated;
    delete safe.password;
    delete safe._id;
    res.json(safe);
  } catch (error) {
    console.error("submitAction:", error);
    res.status(500).json({ message: "failed to queue action" });
  }
};

module.exports = submitAction;
