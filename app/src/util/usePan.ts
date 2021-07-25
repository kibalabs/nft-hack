import React from 'react';

import { ORIGIN_POINT, Point } from './pointUtil';

export const usePan = (): [Point, (event: React.MouseEvent) => void, (event: TouchEvent) => void] => {
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

  const panMouse = React.useCallback((event: Event): void => {
    const mouseEvent = event as MouseEvent;
    const point = { x: mouseEvent.pageX, y: mouseEvent.pageY };
    onPanned(point);
  }, [onPanned]);

  const panTouch = React.useCallback((event: Event): void => {
    const touchEvent = event as TouchEvent;
    const point = { x: touchEvent.touches[0].pageX, y: touchEvent.touches[0].pageY };
    onPanned(point);
  }, [onPanned]);

  const endPanMouse = React.useCallback((event: Event): void => {
    event.target.removeEventListener('mousemove', panMouse);
    event.target.removeEventListener('mouseup', endPanMouse);
  }, [panMouse]);

  const endPanTouch = React.useCallback((event: Event): void => {
    event.target.removeEventListener('touchmove', panTouch);
    event.target.removeEventListener('touchend', endPanTouch);
  }, [panTouch]);

  const startPanMouse = React.useCallback((event: React.MouseEvent): void => {
    lastPointRef.current = { x: event.pageX, y: event.pageY };
    event.target.addEventListener('mousemove', panMouse);
    event.target.addEventListener('mouseup', endPanMouse);
  }, [panMouse, endPanMouse]);

  const startPanTouch = React.useCallback((event: TouchEvent): void => {
    lastPointRef.current = { x: event.touches[0].pageX, y: event.touches[0].pageY };
    event.target.addEventListener('touchmove', panTouch);
    event.target.addEventListener('touchend', endPanTouch);
  }, [panTouch, endPanTouch]);

  const a: EventListener = null;

  return [panState, startPanMouse, startPanTouch];
};
