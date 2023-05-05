const getUnitCost = (unitType) => {
  const unitCosts = {
    worker: 150,
    axeman: 250,
  };

  return unitCosts[unitType];
};