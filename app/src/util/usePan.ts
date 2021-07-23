import React from 'react';

import { ORIGIN_POINT, Point } from './pointUtil';

export const usePan = (): [Point, (event: React.MouseEvent) => void, (event: React.TouchEvent) => void] => {
  const [panState, setPanState] = React.useState<Point>(ORIGIN_POINT);
  const lastPointRef = React.useRef<Point>(panState);

  const onPanned = React.useCallback((newPoint: Point): void => {
    const lastPoint = lastPointRef.current;
    lastPointRef.current = newPoint;
    setPanState((currentPanState: Point): Point => {
      const delta = {
        x: lastPoint.x - newPoint.x,
        y: lastPoint.y - newPoint.y,
      };
      const offset = {
        x: currentPanState.x + delta.x,
        y: currentPanState.y + delta.y,
      };
      return offset;
    });
  }, []);

  const panMouse = React.useCallback((event: MouseEvent): void => {
    const point = { x: event.pageX, y: event.pageY };
    onPanned(point);
  }, [onPanned]);

  const panTouch = React.useCallback((event: TouchEvent): void => {
    const point = { x: event.touches[0].pageX, y: event.touches[0].pageY };
    onPanned(point);
  }, [onPanned]);

  const endPanMouse = React.useCallback((): void => {
    document.removeEventListener('mousemove', panMouse);
    document.removeEventListener('mouseup', endPanMouse);
  }, [panMouse]);

  const endPanTouch = React.useCallback((): void => {
    document.removeEventListener('touchmove', panTouch);
    document.removeEventListener('touchend', endPanTouch);
  }, [panTouch]);

  const startPanMouse = React.useCallback((event: React.MouseEvent): void => {
    lastPointRef.current = { x: event.pageX, y: event.pageY };
    document.addEventListener('mousemove', panMouse);
    document.addEventListener('mouseup', endPanMouse);
  }, [panMouse, endPanMouse]);

  const startPanTouch = React.useCallback((event: React.TouchEvent): void => {
    lastPointRef.current = { x: event.touches[0].pageX, y: event.touches[0].pageY };
    document.addEventListener('touchmove', panTouch);
    document.addEventListener('touchend', endPanTouch);
  }, [panTouch, endPanTouch]);

  return [panState, startPanMouse, startPanTouch];
};
