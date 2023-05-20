let buildActionsQueue = [];
let spawningActionsQueue = [];
let resourceGatheringActionsQueue = [];
let conflictActionsQueue = [];
let moveActionsQueue = [];

const removeActionFromQueue = (id) => {
  let queueIndex = moveActionsQueue.findIndex(request => request.action.id === id);
  if (queueIndex !== -1) {
    console.log('removing move action with id', id);
    moveActionsQueue.splice(queueIndex, 1);
  } else if ((queueIndex = buildActionsQueue.findIndex(request => request.action.id === id)) !== -1) {
    console.log('removing build action with id', id);
    buildActionsQueue.splice(queueIndex, 1);
  } else if ((queueIndex = spawningActionsQueue.findIndex(request => request.action.id === id)) !== -1) {
    console.log('removing spawning action with id', id);
    spawningActionsQueue.splice(queueIndex, 1);
  } else if ((queueIndex = resourceGatheringActionsQueue.findIndex(request => request.action.id === id)) !== -1) {
    console.log('removing resource gathering action with id', id);
    resourceGatheringActionsQueue.splice(queueIndex, 1);
  } else if ((queueIndex = conflictActionsQueue.findIndex(request => request.action.id === id)) !== -1) {
    console.log('removing conflict action with id', id);
    conflictActionsQueue.splice(queueIndex, 1);
  } else {
    console.log('action not found');
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