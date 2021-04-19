export type Point = {
  x: number;
  y: number;
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
