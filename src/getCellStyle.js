import { validateTarget } from "./validateTarget";
export function getCellStyle(cell, user, selectedCell, actionPopup) {
  const baseStyle = {
    width: "100px",
    height: "100px",
  };

  let backgroundImageUrl = "";

  if (actionPopup) {
    baseStyle["filter"] = validateTarget(cell)
      ? "brightness(1.05)"
      : "brightness(0.6)";
  }

  if (cell.unit || cell.building) {
    const ownedByUser =
      (user && cell.unit && cell.unit.owner === user.username) ||
      (user &&
        cell.building &&
        cell.building.owner === user.username);
    baseStyle.border = ownedByUser ? "2px solid green" : "2px solid red";
  }

  if (cell === selectedCell) {
    baseStyle.border = "2px solid blue !important";
  }

  if (!baseStyle.border) {
    baseStyle.border = "2px solid transparent !important";
  }

  if (cell.building) {
    if (cell.building.structureType === "structureSpawn") {
      backgroundImageUrl = "/images/buildings/hut.png";
    } else if (cell.building.structureType === "structureTower") {
      backgroundImageUrl = "/images/buildings/tower.jpg";
    }
  } else if (cell.unit && cell.unit.unitType === "worker") {
    backgroundImageUrl = "/images/units/worker.png";
  } else if (cell.unit && cell.unit.unitType === "axeman") {
    backgroundImageUrl = "/images/units/axeman.png";
  } else if (cell.resource && cell.resource.resourceType === "gold") {
    backgroundImageUrl = "/images/resources/gold.png";
  } else if (cell.terrain === "plains") {
    backgroundImageUrl = "/images/terrain/grass.jpg";
  } else if (cell.terrain === "tundra") {
    backgroundImageUrl = "/images/terrain/tundra.jpg";
  } else if (cell.terrain === "mountain") {
    backgroundImageUrl = "/images/terrain/mountain.jpg";
  }

  if (cell.unit && cell.unit.owner !== user.username)
    baseStyle.backgroundColor = "red";

  if (backgroundImageUrl) {
    baseStyle.backgroundImage = `url("${backgroundImageUrl}")`;
    baseStyle.backgroundSize = "cover";
    baseStyle.backgroundPosition = "center";
    if (cell.resource) baseStyle.backgroundColor = "black";
  }

  // // Identifier style
  // if (cell.unit || cell.building) {
  //   const identifierSize = zoom <= 0.5 ? 20 : 100;
  //   const identifierPosition = zoom <= 0.5 ? "0 0" : "center";
  //   baseStyle.backgroundColor = cell.user.identifier.backgroundColor;
  //   baseStyle.backgroundPosition = identifierPosition;
  //   baseStyle.backgroundSize = `${identifierSize}px ${identifierSize}px`;
  //   baseStyle.borderColor = cell.user.identifier.fillColor;
  // }

  return baseStyle;
}