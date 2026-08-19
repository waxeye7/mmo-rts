let buildActionsQueue = [];
let spawningActionsQueue = [];
let resourceGatheringActionsQueue = [];
let conflictActionsQueue = [];
let moveActionsQueue = [];

const enqueue = (action, userId) => {
  if (!action || !action.type) return false;
  if (action.type === "build spawn" || action.type === "build tower") {
    buildActionsQueue.push({ action, userId });
  } else if (
    action.type === "spawn worker" ||
    action.type === "spawn axeman" ||
    action.type === "spawn archer"
  ) {
    spawningActionsQueue.push({ action, userId });
  } else if (action.type === "worker mine") {
    resourceGatheringActionsQueue.push({ action, userId });
  } else if (
    action.type === "tower shoot" ||
    action.type === "axeman attack" ||
    action.type === "worker attack" ||
    action.type === "archer shoot"
  ) {
    conflictActionsQueue.push({ action, userId });
  } else if (
    action.type === "move worker" ||
    action.type === "move axeman" ||
    action.type === "move archer"
  ) {
    moveActionsQueue.push({ action, userId });
  } else {
    return false;
  }
  return true;
};

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
  removeActionFromQueue,
  enqueue,
};