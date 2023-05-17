let buildActionsQueue = [];
let spawningActionsQueue = [];
let resourceGatheringActionsQueue = [];
let conflictActionsQueue = [];
let moveActionsQueue = [];

const removeActionFromQueue = (id) => {
  const queueIndex = moveActionsQueue.findIndex(request => request.action.id === id);
  if (queueIndex !== -1) {
    console.log('removing move action with id', id)
    moveActionsQueue.splice(queueIndex, 1);
  } else {
    const queueIndex = nonMoveActionsQueue.findIndex(request => request.action.id === id);
    if (queueIndex !== -1) {
      console.log('removing non move action with id', id)
      nonMoveActionsQueue.splice(queueIndex, 1);
    }
  }
};

module.exports = {
  buildActionsQueue,
  spawningActionsQueue,
  resourceGatheringActionsQueue,
  conflictActionsQueue,
  moveActionsQueue,
  removeActionFromQueue
};