import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

export const useScale = (ref: React.RefObject<HTMLElement | null>, scaleRate = 0.1, shouldInvert = false, scale = 1.0, setScale: React.Dispatch<React.SetStateAction<number>>): number => {
  const increment = shouldInvert ? -scaleRate : scaleRate;

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
      return newScale;
    });
  });

  return scale;
};
