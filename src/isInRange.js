export function isInRange(cell1, cell2, range) {
  if (!cell1 || !cell2) {
    return false;
  }
  const xDistance = Math.abs(cell1.x - cell2.x);
  const yDistance = Math.abs(cell1.y - cell2.y);

  return xDistance <= range && yDistance <= range;
}