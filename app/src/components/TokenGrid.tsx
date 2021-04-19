import React from 'react';

import { GridItem } from '../client';
import { diffPoints, Point, scalePoint, sumPoints } from '../util/pointUtil';
import { useMousePositionRef } from '../util/useMousePositionRef';
import { usePan } from '../util/usePan';
import { usePreviousValue } from '../util/usePreviousValue';
import { useScale } from '../util/useScale';

const tokenWidth = 10;
const tokenHeight = 10;
const canvasWidth = 1000;

interface TokenGridProps {
  gridItems: GridItem[];
  onGridItemClicked: (gridItem: GridItem) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 10;

const truncateScale = (scale: number): number => {
  if (scale < 5) {
    return 1;
  }
  if (scale < 10) {
    return 5;
  }
  return 10;
}

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
  const scales = React.useRef<Map<Point, number>>(new Map());
  const images1 = React.useRef<Map<Point, number>>(new Map());
  // const images5 = React.useRef<Map<Point, number>>(new Map());
  // const images10 = React.useRef<Map<Point, number>>(new Map());

  const canvasHeight = tokenHeight * Math.ceil((props.gridItems.length * tokenWidth) / canvasWidth);

  const drawImageOnCanvas = (imageUrl: string, context: CanvasRenderingContext2D, tokenIndex: number, scale: number) => {
    const x = (tokenIndex * tokenWidth) % canvasWidth;
    const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);

    const actualScale = truncateScale(scale);
    const imagesMap: Map<Point, number> = images1.current;

    let currentScale = scales.current[tokenIndex];
    if (currentScale === actualScale) {
      return;
    }
    let image = imagesMap[tokenIndex];
    if (!image) {
      image = new window.Image();
      image.addEventListener('load', () => {
        context.drawImage(image, x * MAX_SCALE, y * MAX_SCALE, tokenWidth * MAX_SCALE, tokenHeight * MAX_SCALE);
      });
    }

    console.log('drawImageOnCanvas', tokenIndex, scale);
    image.setAttribute('src', `${imageUrl}?w=${tokenWidth * actualScale}&h=${tokenHeight * actualScale}`);
    imagesMap[tokenIndex] = image;
    scales.current[tokenIndex] = actualScale;
  };

  React.useEffect((): void => {
    console.log('Total token count:', props.gridItems.length);
    const context = canvasRef.current.getContext('2d');
    props.gridItems.forEach((gridItem: GridItem): void => {
      const tokenIndex = gridItem.tokenId - 1;
      drawImageOnCanvas(gridItem.resizableImageUrl || gridItem.imageUrl, context, tokenIndex, 1);
      scales.current[tokenIndex] = 1;
    });
  }, [props.gridItems]);

  const setAdjustedOffset = (point: Point): void => {
    console.log('setAdjustedOffset', scale, point);

    adjustedOffsetRef.current = point;

    if (truncateScale(scale) !== truncateScale(lastScale)) {
      // const topLeft = scalePoint(point, 1.0 / tokenWidth);
      // const bottomRight = scalePoint(sumPoints(point, scalePoint({x: canvasWidth, y: canvasHeight}, 1.0 / scale)), 1.0 / tokenWidth);
      const minX = Math.floor(point.x / tokenWidth);
      const minY = Math.floor(point.y / tokenHeight);
      const maxX = Math.floor((point.x + (canvasWidth / scale)) / tokenWidth);
      const maxY = Math.floor((point.y + (canvasHeight / scale)) / tokenHeight);
      const context = canvasRef.current.getContext('2d');
      console.log('minX, minY, maxX, maxY', minX, minY, maxX, maxY);
      for (var x = minX; x <= maxX; x++) {
        for (var y = minY; y <= maxY; y++) {
          const tokenIndex = x + (y * (canvasWidth / tokenWidth));
          if (tokenIndex > 0 && tokenIndex < props.gridItems.length) {
            const gridItem = props.gridItems[tokenIndex];
            // console.log('tokenIndex', tokenIndex);
            drawImageOnCanvas(gridItem.resizableImageUrl || gridItem.imageUrl, context, tokenIndex, 1);
          }
        }
      }
    }
  };

  if (scale !== lastScale) {
    const lastMouse = scalePoint(mousePositionRef.current, 1.0 / lastScale);
    const newMouse = scalePoint(mousePositionRef.current, 1.0 / scale);
    const mouseOffset = diffPoints(lastMouse, newMouse);
    setAdjustedOffset(sumPoints(adjustedOffsetRef.current, mouseOffset));
  }

  if (delta.x !== 0 || delta.y !== 0) {
    setAdjustedOffset(sumPoints(adjustedOffsetRef.current, scalePoint(delta, 1.0 / scale)));
    test.current += 1;
  }

  // console.log('adjustedOffsetRef', JSON.stringify(adjustedOffsetRef.current));
  // console.log('test4', JSON.stringify(test.current));

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
