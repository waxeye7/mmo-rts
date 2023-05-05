const getStructureCost = (structureType) => {
  const structureCosts = {
    structureSpawn: 1500,
    anotherStructure: 750,
  };

  return structureCosts[structureType];
};