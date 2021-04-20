import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

type ScaleOpts = {
  direction: 'up' | 'down';
  interval: number;
}

export const useScale = (ref: React.RefObject<HTMLElement | null>, minScale: number, maxScale: number): number => {
  const [scale, setScale] = React.useState<number>(1);

  const updateScale = ({ direction, interval }: ScaleOpts) => {
    setScale((currentScale: number): number => {
      let newScale: number;
      if (direction === 'up' && currentScale + interval < maxScale) {
        newScale = currentScale + interval;
      } else if (direction === 'up') {
        newScale = maxScale;
      } else if (direction === 'down' && currentScale - interval > minScale) {
        newScale = currentScale - interval;
      } else if (direction === 'down') {
        newScale = minScale;
      } else {
        newScale = currentScale;
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

  return scale;
};
