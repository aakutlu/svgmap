function getEastMostPoint(pointArr) {
  let x = -Infinity;
  let y = undefined;
  pointArr.forEach((point) => {
    if (point.x > x) {
      x = point.x;
      y = point.y;
    }
  });
  return { x, y };
}
function getWestMostPoint(pointArr) {
  let x = Infinity;
  let y = undefined;
  pointArr.forEach((point) => {
    if (point.x < x) {
      x = point.x;
      y = point.y;
    }
  });
  return { x, y };
}
function getSouthMostPoint(pointArr) {
  let x = undefined;
  let y = -Infinity;
  pointArr.forEach((point) => {
    if (point.y > y) {
      x = point.x;
      y = point.y;
    }
  });
  return { x, y };
}
function getNorthMostPoint(pointArr) {
  let x = undefined;
  let y = Infinity;
  pointArr.forEach((point) => {
    if (point.y < y) {
      x = point.x;
      y = point.y;
    }
  });
  return { x, y };
}

function distance(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}
function getTopLeftMostPoint(pointArr) {
  let corner = { x: getWestMostPoint(pointArr).x, y: getNorthMostPoint(pointArr).y };
  return closestPoint(pointArr, corner);
}
function getBottomRightMostPoint(pointArr) {
  let corner = { x: getEastMostPoint(pointArr).x, y: getSouthMostPoint(pointArr).y };
  return closestPoint(pointArr, corner);
}
function getTopRightMostPoint(pointArr) {
  let corner = { x: getEastMostPoint(pointArr).x, y: getNorthMostPoint(pointArr).y };
  return closestPoint(pointArr, corner);
}
function getBottomLeftMostPoint(pointArr) {
  let corner = { x: getWestMostPoint(pointArr).x, y: getSouthMostPoint(pointArr).y };
  return closestPoint(pointArr, corner);
}

function closestPoint(pointArr, refPoint) {
  let dist = +Infinity;
  let x = undefined;
  let y = undefined;
  pointArr.forEach((point) => {
    if (distance(refPoint, point) < dist) {
      dist = distance(refPoint, point);
      x = point.x;
      y = point.y;
    }
  });
  return { x, y };
}
function getLongestDiameter(pointArr) {
  let p1 = getBottomLeftMostPoint(pointArr);
  let p2 = getTopRightMostPoint(pointArr);
  let p3 = getTopLeftMostPoint(pointArr);
  let p4 = getBottomRightMostPoint(pointArr);
  let p5 = getWestMostPoint(pointArr);
  let p6 = getEastMostPoint(pointArr);
  let p7 = getNorthMostPoint(pointArr);
  let p8 = getSouthMostPoint(pointArr);
  if (distance(p1, p2) > distance(p3, p4) && distance(p1, p2) > distance(p5, p6)) return { start: p1, end: p2 };
  else if (distance(p3, p4) > distance(p1, p2) && distance(p3, p4) > distance(p5, p6)) return { start: p3, end: p4 };
  else if (distance(p5, p6) > distance(p1, p2) && distance(p5, p6) > distance(p3, p4)) return { start: p5, end: p6 };
  else return { start: p7, end: p8 };
}
//TESTS
/* let points = [
  { x: 0, y: 1 },
  { x: 0.9, y: 0.9 },
  { x: 10, y: 10 },
  { x: 10, y: 0 },
  { x: 0, y: 10 },
  { x: 5, y: 5 },
];

console.log(distance({ x: 3, y: 0 }, { x: 0, y: 4 }));
console.log(getTopLeftMostPoint(points));
console.log(getTopRightMostPoint(points));
console.log(getBottomRightMostPoint(points));
console.log(getBottomLeftMostPoint(points)); */

const Utility = {
  getEastMostPoint,
  getWestMostPoint,
  getSouthMostPoint,
  getNorthMostPoint,
  distance,
  getTopLeftMostPoint,
  getBottomRightMostPoint,
  getTopRightMostPoint,
  getBottomLeftMostPoint,
  closestPoint,
  getLongestDiameter,
};
