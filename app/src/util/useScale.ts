import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

import { Point } from './pointUtil';

const getTouchDistance = (event: TouchEvent): number => {
  return Math.sqrt((event.touches[0].pageX - event.touches[1].pageX) ** 2 + (event.touches[0].pageY - event.touches[1].pageY) ** 2);
};

const getTouchCenter = (event: TouchEvent): Point => {
  return {
    x: (event.touches[0].clientX + event.touches[1].clientX) / 2.0,
    y: (event.touches[0].clientY + event.touches[1].clientY) / 2.0,
  };
};

export const useScale = (ref: React.RefObject<HTMLElement | null>, scaleRate = 0.1, scale = 1.0, setScale: React.Dispatch<React.SetStateAction<number>>): [number, React.RefObject<Point | null>] => {
  const pinchDistanceRef = React.useRef<number | null>(null);
  const pinchCenterRef = React.useRef<Point | null>(null);

  const zoomTouch = React.useCallback((event: Event): void => {
    if (!event.target || !pinchDistanceRef.current) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const distance = getTouchDistance(event as TouchEvent);
    const distanceDiff = distance - pinchDistanceRef.current;
    if (Math.abs(distanceDiff) >= 1) {
      setScale((currentScale: number): number => {
        let newScale = currentScale;
        newScale += distanceDiff / 50.0;
        return newScale;
      });
      pinchDistanceRef.current = distance;
      pinchCenterRef.current = getTouchCenter(event as TouchEvent);
    }
  }, [setScale]);

  const endZoomTouch = React.useCallback((event: Event): void => {
    if (!event.target) {
      return;
    }
    event.target.removeEventListener('touchmove', zoomTouch);
    event.target.removeEventListener('touchend', endZoomTouch);
    event.stopPropagation();
    event.preventDefault();
    pinchDistanceRef.current = null;
    pinchCenterRef.current = null;
  }, [zoomTouch]);

  // @ts-ignore
  useEventListener(ref.current, 'wheel', (event: WheelEvent) => {
    event.preventDefault();
    setScale((currentScale: number): number => {
      let newScale = currentScale;
      if (event.deltaY < 0) {
        newScale += scaleRate;
      } else if (event.deltaY > 0) {
        newScale -= scaleRate;
      }
      return newScale;
    });
  });

  // @ts-ignore
  useEventListener(ref.current, 'touchstart', (event: TouchEvent) => {
    if (!event.target) {
      return;
    }
    if (event.touches.length > 1) {
      event.target.addEventListener('touchmove', zoomTouch);
      event.target.addEventListener('touchend', endZoomTouch);
      event.stopPropagation();
      event.preventDefault();
      const distance = getTouchDistance(event);
      pinchDistanceRef.current = distance;
      pinchCenterRef.current = getTouchCenter(event);
    }
  });

  return [scale, pinchCenterRef];
};
