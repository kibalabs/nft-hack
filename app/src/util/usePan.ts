import React from 'react';

import { ORIGIN_POINT, Point } from './pointUtil';

export const usePan = (): [Point, (event: React.MouseEvent) => void, (event: React.TouchEvent) => void] => {
  const [panState, setPanState] = React.useState<Point>(ORIGIN_POINT);
  const lastPointRef = React.useRef<Point>(panState);

  const pan = React.useCallback((point: Point): void => {
    const lastPoint = lastPointRef.current;
    lastPointRef.current = point;
    setPanState((currentPanState: Point): Point => {
      const delta = {
        x: lastPoint.x - point.x,
        y: lastPoint.y - point.y,
      };
      const offset = {
        x: currentPanState.x + delta.x,
        y: currentPanState.y + delta.y,
      };
      return offset;
    });
  }, []);

  const panMobile = React.useCallback((event: MouseEvent): void => {
    pan({ x: event.pageX, y: event.pageY });
  }, [pan]);

  const panTouch = React.useCallback((event: TouchEvent): void => {
    pan({ x: event.touches[0].clientX, y: event.touches[0].clientY });
  }, [pan]);

  const endPanMouse = React.useCallback((): void => {
    document.removeEventListener('mousemove', panMobile);
    document.removeEventListener('mouseup', endPanMouse);
  }, [panMobile]);

  const endPanTouch = React.useCallback((): void => {
    document.removeEventListener('touchmove', panTouch);
    document.removeEventListener('touchend', endPanTouch);
  }, [panTouch]);

  const startPanMouse = React.useCallback((event: React.MouseEvent): void => {
    lastPointRef.current = { x: event.pageX, y: event.pageY };
    document.addEventListener('mousemove', panMobile);
    document.addEventListener('mouseup', endPanMouse);
  }, [panMobile, endPanMouse]);

  const startPanTouch = React.useCallback((event: React.TouchEvent): void => {
    console.log('here', event)
    if (event.touches.length === 1) {
      lastPointRef.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      document.addEventListener('touchmove', panTouch);
      document.addEventListener('touchend', endPanTouch);
    }
  }, [panTouch, endPanTouch]);

  return [panState, startPanMouse, startPanTouch];
};
