import React from 'react';

import { GridItem } from '../client';
import { diffPoints, Point, scalePoint, sumPoints } from '../util/pointUtil';
import { useMousePositionRef } from '../util/useMousePositionRef';
import { usePan } from '../util/usePan';
import { usePreviousValue } from '../util/usePreviousValue';
import { useScale } from '../util/useScale';

const tokenWidth = 10;
const tokenHeight = 10;
const tokenDuplication = 100; // 400;
const canvasWidth = 1400;

interface TokenGridProps {
  gridItems: GridItem[];
  onGridItemClicked: (gridItem: GridItem) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 10;


export const TokenGrid = (props: TokenGridProps): React.ReactElement => {
  // console.log('------------ rendering -------------');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [panOffset, startPan] = usePan();
  const scale = useScale(containerRef, MIN_SCALE, MAX_SCALE);
  const mousePositionRef = useMousePositionRef(containerRef);

  const lastOffset = usePreviousValue(panOffset);
  const lastScale = usePreviousValue(scale);
  const delta = diffPoints(panOffset, lastOffset);

  const adjustedOffsetRef = React.useRef<Point>(panOffset);
  const test = React.useRef<number>(0);

  if (scale !== lastScale) {
    const lastMouse = scalePoint(mousePositionRef.current, 1.0 / lastScale);
    const newMouse = scalePoint(mousePositionRef.current, 1.0 / scale);
    const mouseOffset = diffPoints(lastMouse, newMouse);
    adjustedOffsetRef.current = sumPoints(adjustedOffsetRef.current, mouseOffset);
  }

  if (delta.x !== 0 || delta.y !== 0) {
    adjustedOffsetRef.current = sumPoints(adjustedOffsetRef.current, scalePoint(delta, 1.0 / scale));
    test.current += 1;
  }

  // console.log('adjustedOffsetRef', JSON.stringify(adjustedOffsetRef.current));
  // console.log('test4', JSON.stringify(test.current));

  const drawImageOnCanvas = (imageUrl: string, context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    const img = new window.Image();
    img.addEventListener('load', () => {
      console.log('drawImageOnCanvas', x, y, w, h);
      console.log('drawImageOnCanvas scaled', x * MAX_SCALE, y * MAX_SCALE, w * MAX_SCALE, h * MAX_SCALE);
      // context.drawImage(img, x, y, w, h);
      context.drawImage(img, x * MAX_SCALE, y * MAX_SCALE, w * MAX_SCALE, h * MAX_SCALE);
    });
    img.setAttribute('src', `${imageUrl}?w=${w * MAX_SCALE}&h=${h * MAX_SCALE}`);
  };

  const canvasHeight = tokenHeight * Math.ceil((props.gridItems.length * tokenDuplication * tokenWidth) / canvasWidth);

  React.useEffect(() => {
    const tokenCount = props.gridItems.length;
    console.log('Total token count:', props.gridItems.length * tokenDuplication);
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    Array(tokenDuplication).fill(null).forEach((_: unknown, duplicationIndex: number): void => {
      props.gridItems.forEach((gridItem: GridItem): void => {
        const tokenIndex = (duplicationIndex * tokenCount) + gridItem.tokenId - 1;
        const x = (tokenIndex * tokenWidth) % canvasWidth;
        const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
        drawImageOnCanvas(gridItem.resizableImageUrl || gridItem.imageUrl, context, x, y, tokenWidth, tokenHeight);
      });
    });
  }, [props.gridItems]);

  return (
    <div
      ref={containerRef}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        overflow: 'hidden',
        backgroundColor: 'grey',
        margin: 'auto',
      }}
      onMouseDown={startPan}
    >
      <div
        style={{
          width: `${canvasWidth * MAX_SCALE}px`,
          height: `${canvasHeight * MAX_SCALE}px`,
          transform: `translate(${-adjustedOffsetRef.current.x * scale}px, ${-adjustedOffsetRef.current.y * scale}px) scale(${scale / MAX_SCALE})`,
          transformOrigin: 'left top',
          overflow: 'hidden',
          backgroundColor: 'yellow',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: `${canvasWidth * MAX_SCALE}px`,
            height: `${canvasHeight * MAX_SCALE}px`,
          }}
          width={canvasWidth * MAX_SCALE}
          height={canvasHeight * MAX_SCALE}
        />
      </div>
    </div>
  );
};
