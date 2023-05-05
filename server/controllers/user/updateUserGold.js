const getStructureCost = require('../../../CONSTANTS/getStructureCost');
const updateUserGold = async (userId, structureType) => {
  // Get the structure cost
  const structureCost = getStructureCost(structureType);

  // Access the database and update the user's gold
  await database.collection('users').updateOne(
    { _id: userId },
    { $inc: { 'resources.gold': -structureCost } }
  );
};