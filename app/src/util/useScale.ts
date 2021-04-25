import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

type ScaleOpts = {
  direction: 'up' | 'down';
  interval: number;
}

export const useScale = (ref: React.RefObject<HTMLElement | null>, minScale: number, maxScale: number): [number, (newScale: number) => void] => {
  const [scale, setScale] = React.useState<number>(1);

  const updateScale = ({ direction, interval }: ScaleOpts) => {
    setScale((currentScale: number): number => {
      let newScale = currentScale;
      // if (direction === 'up' && currentScale + interval < maxScale) {
      //   newScale = currentScale + interval;
      // } else
      if (direction === 'up') {
        newScale = Math.min(currentScale + interval, maxScale);
      } else
      // if (direction === 'down' && currentScale - interval > minScale) {
      //   newScale = currentScale - interval;
      // } else
       if (direction === 'down') {
        newScale = Math.max(currentScale - interval, minScale);
      }
      return newScale;
    });
  };

  useEventListener(ref.current, 'wheel', (e) => {
    e.preventDefault();
    updateScale({
      // @ts-ignore
      direction: e.deltaY > 0 ? 'up' : 'down',
      interval: 0.1,
    });
  });

  const setScaleManually = (newScale: number): void => {
    setScale(Math.min(Math.max(newScale, minScale), maxScale));
  }

  return [scale, setScaleManually];
};
