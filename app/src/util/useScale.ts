import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

export const useScale = (ref: React.RefObject<HTMLElement | null>, minScale: number, maxScale: number, scaleRate: number = 0.1, shouldInvert: boolean = false): [number, (newScale: number) => void] => {
  const [scale, setScale] = React.useState<number>(1);
  const increment = shouldInvert ? -scaleRate : scaleRate;

  const constrainScale = (newScale: number): number => {
    return Math.min(Math.max(newScale, minScale), maxScale);
  };

  const setScaleManually = (newScale: number): void => {
    setScale(constrainScale(newScale));
  };

  useEventListener(ref.current, 'wheel', (e) => {
    e.preventDefault();
    setScale((currentScale: number): number => {
      let newScale = currentScale;
      // @ts-ignore
      if (e.deltaY > 0) {
        newScale = currentScale + increment;
      // @ts-ignore
      } else if (e.deltaY < 0) {
        newScale = currentScale - increment;
      }
      return constrainScale(newScale);
    });
  });

  return [scale, setScaleManually];
};
