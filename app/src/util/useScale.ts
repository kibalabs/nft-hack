import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

export const useScale = (ref: React.RefObject<HTMLElement | null>, minScale: number, maxScale: number, scaleRate = 0.1, shouldInvert = false): [number, (newScale: number) => void] => {
  const [scale, setScale] = React.useState<number>(1);
  const increment = shouldInvert ? -scaleRate : scaleRate;

  const constrainScale = (newScale: number): number => {
    return Math.min(Math.max(newScale, minScale), maxScale);
  };

  const setScaleManually = (newScale: number): void => {
    setScale(constrainScale(newScale));
  };

  const updateScale = (zoomingIn: boolean): void => {
    setScale((currentScale: number): number => {
      const newScale = currentScale + (zoomingIn ? increment : -increment);
      return constrainScale(newScale);
    });
  }

  useEventListener(ref.current, 'wheel', (event: React.WheelEvent) => {
    event.preventDefault();
    if (event.deltaY > 0) {
      updateScale(true);
    } else if (event.deltaY < 0) {
      updateScale(false);
    }
  });

  useEventListener(ref.current, 'wheel', (event: React.WheelEvent) => {
    event.preventDefault();
    if (event.deltaY > 0) {
      updateScale(true);
    } else if (event.deltaY < 0) {
      updateScale(false);
    }
  });

  return [scale, setScaleManually];
};
