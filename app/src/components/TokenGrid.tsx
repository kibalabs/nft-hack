import React from 'react';

import { useDebouncedCallback, usePreviousValue, useWindowSize } from '@kibalabs/core-react';

import { GridItem } from '../client';
import { arePointsEqual, diffPoints, floorPoint, ORIGIN_POINT, Point, PointRange, scalePoint, sumPoints } from '../util/pointUtil';
import { useMousePositionRef } from '../util/useMousePositionRef';
import { usePan } from '../util/usePan';
import { useScale } from '../util/useScale';
import { Alignment, LayerContainer } from '@kibalabs/ui-react';
import { GridControl } from './GridControl';

const tokenWidth = 10;
const tokenHeight = 10;
// const canvasWidth = 1000;
const canvasWidth = 300;

interface TokenGridProps {
  gridItems: GridItem[];
  onGridItemClicked: (gridItem: GridItem) => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 10;
const HALF_SCALE = 5.0;

const truncateScale = (scale: number): number => {
  if (scale < HALF_SCALE - 0.5) {
    return MIN_SCALE;
  }
  if (scale < MAX_SCALE - 0.5) {
    return HALF_SCALE;
  }
  return MAX_SCALE;
};

export const TokenGrid = (props: TokenGridProps): React.ReactElement => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [panOffset, startPan] = usePan();
  const lastPanOffset = usePreviousValue(panOffset);
  const [scale, setScale] = useScale(containerRef, MIN_SCALE, MAX_SCALE);
  const lastScale = usePreviousValue(scale);
  const mousePositionRef = useMousePositionRef(containerRef);
  const adjustedOffsetRef = React.useRef<Point>(panOffset);
  const tokenScales = React.useRef<Map<number, number>>(new Map<number, number>());
  const tokenImages = React.useRef<Map<number, HTMLImageElement>>(new Map<number, HTMLImageElement>());
  const lastRangeRef = React.useRef<PointRange>({ topLeft: ORIGIN_POINT, bottomRight: ORIGIN_POINT });
  const lastMouseMoveTimeRef = React.useRef<Date | null>(null);
  const lastMouseMovePointRef = React.useRef<Point | null>(null);
  const [setRedrawCallback, clearRedrawCallback] = useDebouncedCallback(350);
  const windowSize = useWindowSize();

  const canvasHeight = tokenHeight * Math.ceil((props.gridItems.length * tokenWidth) / canvasWidth);

  const drawImageOnCanvas = React.useCallback((imageUrl: string, context: CanvasRenderingContext2D, tokenIndex: number, imageScale: number) => {
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
  }, []);

  React.useEffect((): void => {
    const context = canvasRef.current?.getContext('2d', { alpha: false });
    if (!context) {
      return;
    }
    props.gridItems.forEach((gridItem: GridItem, index: number): void => {
      drawImageOnCanvas(gridItem.resizableImageUrl || gridItem.imageUrl, context, index, 1);
    });
  }, [props.gridItems, drawImageOnCanvas]);

  const setAdjustedOffset = React.useCallback((point: Point): void => {
    const scaledWindowWidth = windowSize.width / scale;
    const scaledWindowHeight = windowSize.height / scale;
    const widthDiff = canvasWidth - scaledWindowWidth;
    const heightDiff = canvasHeight - scaledWindowHeight;
    const isCanvasWiderThanScreen = widthDiff >= 0;
    const isCanvasTallerThanScreen = heightDiff >= 0;
    const minX = isCanvasWiderThanScreen ? -tokenWidth : -Math.abs(widthDiff) / 2.0;
    const minY = isCanvasTallerThanScreen ? -tokenHeight : -Math.abs(heightDiff) / 2.0;
    const maxX = widthDiff + (isCanvasWiderThanScreen ? tokenWidth : 0);
    const maxY = heightDiff + (isCanvasTallerThanScreen ? tokenHeight : 0);
    const constrainedPoint = {
      x: Math.max(minX, Math.min(maxX, point.x)),
      y: Math.max(minY, Math.min(maxY, point.y)),
    };

    if (arePointsEqual(adjustedOffsetRef.current, constrainedPoint)) {
      return;
    }
    adjustedOffsetRef.current = constrainedPoint;
    clearRedrawCallback();
    setRedrawCallback((): void => {
      const context = canvasRef.current?.getContext('2d', { alpha: false });
      if (context == null) {
        return;
      }
      const scaledOffset = { x: adjustedOffsetRef.current.x / tokenWidth, y: adjustedOffsetRef.current.y / tokenHeight };
      const topLeft = floorPoint(scaledOffset);
      const bottomRight = floorPoint(sumPoints(scaledOffset, { x: windowSize.width / tokenWidth / scale, y: windowSize.height / tokenHeight / scale }));
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
    });
  }, [props.gridItems, canvasHeight, scale, lastScale, windowSize, setRedrawCallback, clearRedrawCallback, drawImageOnCanvas]);

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

  React.useEffect((): void => {
    if (scale !== lastScale) {
      // TODO(krishan711): when scaling with the buttons the mouse position should not be used
      const lastMouse = scalePoint(mousePositionRef.current, 1.0 / lastScale);
      const newMouse = scalePoint(mousePositionRef.current, 1.0 / scale);
      const mouseOffset = diffPoints(lastMouse, newMouse);
      setAdjustedOffset(sumPoints(adjustedOffsetRef.current, mouseOffset));
    }
  }, [scale, lastScale, mousePositionRef, setAdjustedOffset]);

  React.useEffect((): void => {
    const delta = diffPoints(panOffset, lastPanOffset);
    if (delta.x !== 0 || delta.y !== 0) {
      setAdjustedOffset(sumPoints(adjustedOffsetRef.current, scalePoint(delta, 1.0 / scale)));
    }
  }, [panOffset, lastPanOffset, scale, setAdjustedOffset]);

  React.useLayoutEffect((): void => {
    setAdjustedOffset(adjustedOffsetRef.current);
  }, [windowSize, setAdjustedOffset]);

  return (
    <LayerContainer>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#111111',
          margin: 'auto',
        }}
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
          onMouseDown={startPan}
        >
          <canvas
            ref={canvasRef}
            width={`${canvasWidth * MAX_SCALE}px`}
            height={`${canvasHeight * MAX_SCALE}px`}
            onMouseDown={onCanvasMouseDown}
            onMouseUp={onCanvasMouseUp}
          />
        </div>
      </div>
      <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Start} alignmentHorizontal={Alignment.Start}>
        <GridControl
          onZoomInClicked={(): void => setScale(scale + 1)}
          onZoomOutClicked={(): void => setScale(scale - 1)}
        />
      </LayerContainer.Layer>
    </LayerContainer>
  );
};
