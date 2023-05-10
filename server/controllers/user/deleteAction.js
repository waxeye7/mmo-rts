const { removeActionFromQueue } = require('../../actionsQueue');
const deleteAction = async (req, res) => {
  try {
    // Get the user identified by the token
    const user = req.user;

    // Get the ID of the action to be cancelled
    const actionId = req.params.id;

    // Find the action with the specified ID
    const index = user.actions.findIndex(action => action.id === actionId);

    // If the action was not found, return an error
    if (index === -1) {
      res.status(404).send({ error: 'Action not found' });
      return;
    }

    // Remove the action at the specified index
    user.actions.splice(index, 1);
    console.log(`Attempting to remove action with id ${actionId} from queue.`);

    removeActionFromQueue(actionId);

    // Save the user
    await user.save();

    res.send({ success: true });
  } catch (err) {
    res.status(500).send({ error: 'Failed to cancel action' });
  }
};

module.exports = deleteAction;