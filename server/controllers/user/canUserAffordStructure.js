const getStructureCost = require('../../../CONSTANTS/getStructureCost');
const canUserAffordStructure = async (userId, structureType) => {
  // Get the structure cost
  const structureCost = getStructureCost(structureType);

  // Access the database to retrieve the user's gold
  // Replace the example query with your database query to get the user's resources
  const user = await database.collection('users').findOne({ _id: userId });

  // Check if the user has enough gold
  return user.resources.gold >= structureCost;
};