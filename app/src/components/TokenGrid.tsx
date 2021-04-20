import React from 'react';

import { GridItem } from '../client';
import { arePointsEqual, diffPoints, floorPoint, ORIGIN_POINT, Point, PointRange, scalePoint, sumPoints } from '../util/pointUtil';
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
  if (scale < 4.5) {
    return 1;
  }
  if (scale < 9.5) {
    return 5;
  }
  return 9.5;
};

export const TokenGrid = (props: TokenGridProps): React.ReactElement => {
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
  const tokenScales = React.useRef<Map<number, number>>(new Map<number, number>());
  const tokenImages = React.useRef<Map<number, HTMLImageElement>>(new Map<number, HTMLImageElement>());
  const lastRangeRef = React.useRef<PointRange>({ topLeft: ORIGIN_POINT, bottomRight: ORIGIN_POINT });
  const lastMouseMoveTimeRef = React.useRef<Date | null>(null);
  const lastMouseMovePointRef = React.useRef<Point | null>(null);

  const canvasHeight = tokenHeight * Math.ceil((props.gridItems.length * tokenWidth) / canvasWidth);

  const drawImageOnCanvas = (imageUrl: string, context: CanvasRenderingContext2D, tokenIndex: number, imageScale: number) => {
    if (tokenScales.current.get(tokenIndex) === imageScale) {
      return;
    }

    let image = tokenImages.current.get(tokenIndex);
    if (!image) {
      const x = (tokenIndex * tokenWidth) % canvasWidth;
      const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
      const newImage = new window.Image();
      newImage.addEventListener('load', () => {
        context.drawImage(newImage, x * MAX_SCALE, y * MAX_SCALE, tokenWidth * MAX_SCALE, tokenHeight * MAX_SCALE);
      });
      tokenImages.current.set(tokenIndex, newImage);
      image = newImage;
    }

    image.setAttribute('src', `${imageUrl}?w=${tokenWidth * imageScale}&h=${tokenHeight * imageScale}`);
    tokenScales.current.set(tokenIndex, imageScale);
  };

  React.useEffect((): void => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }
    props.gridItems.forEach((gridItem: GridItem, index: number): void => {
      drawImageOnCanvas(gridItem.resizableImageUrl || gridItem.imageUrl, context, index, 1);
    });
  }, [props.gridItems]);

  const setAdjustedOffset = (point: Point): void => {
    const constrainedPoint = {
      x: Math.min(canvasWidth - ((canvasWidth / tokenWidth) * (MAX_SCALE / scale)), Math.max(0, point.x)),
      y: Math.min(canvasHeight - ((canvasHeight / tokenHeight) * (MAX_SCALE / scale)), Math.max(0, point.y)),
    };
    if (arePointsEqual(adjustedOffsetRef.current, constrainedPoint)) {
      return;
    }
    adjustedOffsetRef.current = constrainedPoint;
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }
    const topLeft = floorPoint(scalePoint(constrainedPoint, 1.0 / tokenWidth));
    const bottomRight = floorPoint(scalePoint(sumPoints(constrainedPoint, scalePoint({ x: canvasWidth, y: canvasHeight }, 1.0 / scale)), 1.0 / tokenWidth));
    const range: PointRange = { topLeft, bottomRight };
    const truncatedScale = truncateScale(scale);
    if (truncatedScale !== truncateScale(lastScale) || !arePointsEqual(topLeft, lastRangeRef.current.topLeft) || !arePointsEqual(bottomRight, lastRangeRef.current.bottomRight)) {
      lastRangeRef.current = range;
      for (let y = Math.max(0, topLeft.y); y <= bottomRight.y; y += 1) {
        for (let x = Math.max(0, topLeft.x); x <= bottomRight.x; x += 1) {
          const tokenIndex = x + (y * (canvasWidth / tokenWidth));
          if (tokenIndex < props.gridItems.length) {
            const gridItem = props.gridItems[tokenIndex];
            drawImageOnCanvas(gridItem.resizableImageUrl || gridItem.imageUrl, context, tokenIndex, truncatedScale);
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

  const onCanvasMouseDown = (event: React.MouseEvent<HTMLElement>): void => {
    lastMouseMoveTimeRef.current = new Date();
    lastMouseMovePointRef.current = { x: event.pageX - event.currentTarget.offsetLeft, y: event.pageY - event.currentTarget.offsetTop };
  };

  const onCanvasMouseUp = (event: React.MouseEvent<HTMLElement>): void => {
    if (!lastMouseMovePointRef.current || !lastMouseMoveTimeRef.current) {
      return;
    }
    const timeDiff = new Date().getTime() - lastMouseMoveTimeRef.current.getTime();
    const endPoint = { x: event.pageX - event.currentTarget.offsetLeft, y: event.pageY - event.currentTarget.offsetTop };
    const pointDiff = diffPoints(endPoint, lastMouseMovePointRef.current);

    if (timeDiff < 700 && Math.abs(pointDiff.x) < 15 && Math.abs(pointDiff.y) < 15) {
      const targetPoint = sumPoints(endPoint, scalePoint(adjustedOffsetRef.current, scale));
      const tokenIndex = Math.floor((targetPoint.x / (scale * tokenWidth)) + (Math.floor(targetPoint.y / (scale * tokenHeight)) * (canvasWidth / tokenWidth)));
      props.onGridItemClicked(props.gridItems[tokenIndex]);
    }

    lastMouseMoveTimeRef.current = null;
    lastMouseMovePointRef.current = null;
  };

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
        onMouseDown={onCanvasMouseDown}
        onMouseUp={onCanvasMouseUp}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth * MAX_SCALE}
          height={canvasHeight * MAX_SCALE}
        />
      </div>
    </div>
  );
};
