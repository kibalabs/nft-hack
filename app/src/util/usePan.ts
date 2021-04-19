import React from 'react';

import { ORIGIN_POINT, Point } from './pointUtil';

export const usePan = (): [Point, (event: React.MouseEvent) => void] => {
  const [panState, setPanState] = React.useState<Point>(ORIGIN_POINT);
  const lastPointRef = React.useRef<Point>(panState);

  const pan = React.useCallback((mouseEvent: MouseEvent): void => {
    const lastPoint = lastPointRef.current;
    const point = { x: mouseEvent.pageX, y: mouseEvent.pageY };
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

  const endPan = React.useCallback((): void => {
    document.removeEventListener('mousemove', pan);
    document.removeEventListener('mouseup', endPan);
  }, [pan]);

  const startPan = React.useCallback((mouseEvent: React.MouseEvent): void => {
    document.addEventListener('mousemove', pan);
    document.addEventListener('mouseup', endPan);
    lastPointRef.current = {
      x: mouseEvent.pageX,
      y: mouseEvent.pageY,
    };
  }, [pan, endPan]);

  return [panState, startPan];
};
