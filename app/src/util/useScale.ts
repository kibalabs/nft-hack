import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

export const useScale = (ref: React.RefObject<HTMLElement | null>, minScale: number, maxScale: number): [number, (newScale: number) => void] => {
  const [scale, setScale] = React.useState<number>(1);

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
        newScale = currentScale + 0.1;
      // @ts-ignore
      } else if (e.deltaY < 0) {
        newScale = currentScale - 0.1;
      }
      return constrainScale(newScale);
    });
  });

  return [scale, setScaleManually];
};
