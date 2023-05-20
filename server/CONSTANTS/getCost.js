const getCost = (instance) => {
  const costs = {
    worker: 150,
    axeman: 250,
    structureSpawn: 1500,
    structureTower: 750,
  };

  return costs[instance];
};

module.exports = getCost;