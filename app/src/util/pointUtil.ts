export type Point = {
  x: number;
  y: number;
}

export type PointRange = {
  topLeft: Point;
  bottomRight: Point;
}

export const ORIGIN_POINT: Point = Object.freeze({ x: 0, y: 0 });

export const diffPoints = (point1: Point, point2: Point): Point => {
  return {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
  };
};

export const sumPoints = (point1: Point, point2: Point): Point => {
  return {
    x: point1.x + point2.x,
    y: point1.y + point2.y,
  };
};

export const scalePoint = (point: Point, scale: number): Point => {
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
};

export const floorPoint = (point: Point): Point => {
  return {
    x: Math.floor(point.x),
    y: Math.floor(point.y),
  };
};

export const arePointsEqual = (point1: Point, point2: Point): boolean => {
  return point1.x === point2.x && point1.y === point2.y;
};

export const arePointRangesEqual = (pointRange1: PointRange, pointRange2: PointRange): boolean => {
  return arePointsEqual(pointRange1.topLeft, pointRange2.topLeft) && arePointsEqual(pointRange1.bottomRight, pointRange2.bottomRight);
};
