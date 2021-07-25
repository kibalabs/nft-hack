import React from 'react';

import { deepCompare } from '@kibalabs/core';
import { useDebouncedCallback, usePreviousValue, useSize } from '@kibalabs/core-react';

import { BaseImage, GridItem } from '../client';
import { useGlobals } from '../globalsContext';
import { arePointRangesEqual, arePointsEqual, diffPoints, floorPoint, ORIGIN_POINT, Point, PointRange, scalePoint, sumPoints } from '../util/pointUtil';
import { useMousePositionRef } from '../util/useMousePositionRef';
import { usePan } from '../util/usePan';
import { useScale } from '../util/useScale';

const tokenWidth = 10;
const tokenHeight = 10;
const canvasWidth = 1000;

interface TokenGridProps {
  newGridItems: GridItem[];
  baseImage: BaseImage;
  tokenCount: number;
  scale: number;
  minScale: number;
  maxScale: number;
  onTokenIdClicked: (tokenId: number) => void;
  onScaleChanged: React.Dispatch<React.SetStateAction<number>>;
}

export const TokenGrid = React.memo((props: TokenGridProps): React.ReactElement => {
  const { apiClient, network } = useGlobals();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = React.useRef<HTMLDivElement | null>(null);

  const windowSize = useSize(containerRef.current);
  const [panOffset, startPanMouse, startPanTouch] = usePan();
  const lastPanOffset = usePreviousValue(panOffset);
  const [scale, pinchCenterRef] = useScale(canvasWrapperRef, 0.3, props.scale, props.onScaleChanged);
  const lastScale = usePreviousValue(scale);
  const mousePositionRef = useMousePositionRef(containerRef);
  const [adjustedOffset, setAdjustedOffset] = React.useState<Point>(panOffset);
  const adjustedOffsetRef = React.useRef<Point>(adjustedOffset);
  // NOTE(krishan711): this is only here so updateAdjustedOffset doesn't need adjustedOffset as a dependency. There must be a better way
  adjustedOffsetRef.current = adjustedOffset;
  const tokenScales = React.useRef<Map<number, number>>(new Map<number, number>());
  const tokenImages = React.useRef<Map<number, HTMLImageElement>>(new Map<number, HTMLImageElement>());
  const lastRangeRef = React.useRef<PointRange>({ topLeft: ORIGIN_POINT, bottomRight: ORIGIN_POINT });
  const lastMouseMoveTimeRef = React.useRef<Date | null>(null);
  const lastMouseMovePointRef = React.useRef<Point | null>(null);
  const [setRedrawCallback, clearRedrawCallback] = useDebouncedCallback(150);
  const [isMoving, setIsMoving] = React.useState<boolean>(false);

  const canvasHeight = tokenHeight * Math.ceil((props.tokenCount * tokenWidth) / canvasWidth);

  const truncateScale = React.useCallback((newScale: number): number => {
    if (newScale < (props.maxScale / 2.0) - 0.5) {
      return props.minScale;
    }
    if (newScale < props.maxScale - 0.5) {
      return (props.maxScale / 2.0);
    }
    return props.maxScale;
  }, [props.minScale, props.maxScale]);

  const drawTokenImageOnCanvas = React.useCallback((context: CanvasRenderingContext2D, tokenIndex: number, imageScale: number) => {
    const currentScale = tokenScales.current.get(tokenIndex);
    if (currentScale !== undefined && currentScale >= imageScale) {
      return;
    }

    const tokenId = tokenIndex + 1;
    let image = tokenImages.current.get(tokenIndex);
    if (!image) {
      const x = (tokenIndex * tokenWidth) % canvasWidth;
      const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
      const newImage = new window.Image();
      newImage.addEventListener('load', () => {
        context.fillRect(x * props.maxScale, y * props.maxScale, tokenWidth * props.maxScale, tokenHeight * props.maxScale);
        context.drawImage(newImage, x * props.maxScale, y * props.maxScale, tokenWidth * props.maxScale, tokenHeight * props.maxScale);
      });
      tokenImages.current.set(tokenIndex, newImage);
      image = newImage;
    }

    // @ts-ignore TODO(krishan711): make baseUrl visible in ServiceClient
    image.setAttribute('src', `${apiClient.baseUrl}/v1/networks/${network}/tokens/${tokenId}/go-to-image?w=${tokenWidth * imageScale * window.devicePixelRatio}&h=${tokenHeight * imageScale * window.devicePixelRatio}`);
    tokenScales.current.set(tokenIndex, imageScale);
  }, [apiClient, network, props.maxScale]);

  React.useEffect((): void => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }
    props.newGridItems.forEach((gridItem: GridItem): void => {
      if (gridItem.updatedDate > props.baseImage.generatedDate) {
        drawTokenImageOnCanvas(context, gridItem.tokenId - 1, 1);
      }
    });
  }, [props.newGridItems, props.baseImage, drawTokenImageOnCanvas]);

  // NOTE(krishan711): due to the "center by default" logic this would probably be better
  // modelled as "offset from center" instead of directly the offset
  const updateAdjustedOffset = React.useCallback((offset: Point | null, sizeChanged = false): void => {
    if (!windowSize || windowSize.width === 0 || windowSize.height === 0 || canvasHeight === 0) {
      return;
    }
    const scaledWindowWidth = windowSize.width / scale;
    const scaledWindowHeight = windowSize.height / scale;
    const widthDiff = canvasWidth - scaledWindowWidth;
    const heightDiff = canvasHeight - scaledWindowHeight;
    const minX = widthDiff >= 0 ? -tokenWidth : widthDiff / 2.0;
    const minY = heightDiff >= 0 ? -tokenHeight : heightDiff / 2.0;
    const maxX = minX + (widthDiff >= 0 ? widthDiff + 2 * tokenWidth : 0);
    const maxY = minY + (heightDiff >= 0 ? heightDiff + 2 * tokenHeight : 0);
    const newPoint = sumPoints(adjustedOffsetRef.current, offset || ORIGIN_POINT);
    let constrainedPoint = {
      x: Math.max(minX, Math.min(maxX, newPoint.x)),
      y: Math.max(minY, Math.min(maxY, newPoint.y)),
    };
    if (sizeChanged && (constrainedPoint.x === minX || constrainedPoint.x === 0) && (constrainedPoint.y === minY || constrainedPoint.y === 0)) {
      constrainedPoint = {
        x: minX + ((maxX - minX) / 2.0),
        y: minY + ((maxY - minY) / 2.0),
      };
    }
    if (arePointsEqual(adjustedOffsetRef.current, constrainedPoint)) {
      return;
    }

    setAdjustedOffset(constrainedPoint);
    clearRedrawCallback();
    setRedrawCallback((): void => {
      const context = canvasRef.current?.getContext('2d');
      if (!context) {
        return;
      }
      const truncatedScale = truncateScale(scale);
      if (truncatedScale < props.maxScale / 2.0) {
        return;
      }
      const scaledOffset = { x: adjustedOffsetRef.current.x / tokenWidth, y: adjustedOffsetRef.current.y / tokenHeight };
      const topLeft = floorPoint(scaledOffset);
      const bottomRight = floorPoint(sumPoints(scaledOffset, { x: windowSize.width / tokenWidth / scale, y: windowSize.height / tokenHeight / scale }));
      const range: PointRange = { topLeft, bottomRight };
      if (truncatedScale !== truncateScale(lastScale) || !arePointRangesEqual(range, lastRangeRef.current)) {
        lastRangeRef.current = range;
        for (let y = Math.max(0, topLeft.y); y <= bottomRight.y; y += 1) {
          for (let x = Math.max(0, topLeft.x); x <= bottomRight.x; x += 1) {
            const tokenIndex = x + (y * (canvasWidth / tokenWidth));
            if (tokenIndex < props.tokenCount) {
              // drawTokenImageOnCanvas(context, tokenIndex, truncatedScale);
            }
          }
        }
      }
    });
  }, [props.tokenCount, props.maxScale, truncateScale, scale, canvasHeight, lastScale, windowSize, setRedrawCallback, clearRedrawCallback, drawTokenImageOnCanvas]);

  React.useEffect((): void => {
    if (scale !== lastScale) {
      if (pinchCenterRef.current) {
        const lastCenter = scalePoint(pinchCenterRef.current, 1.0 / lastScale);
        const newCenter = scalePoint(pinchCenterRef.current, 1.0 / scale);
        const offset = diffPoints(lastCenter, newCenter);
        updateAdjustedOffset(offset);
      } else {
        // TODO(krishan711): when scaling with the buttons the mouse position should not be used
        const lastMouse = scalePoint(mousePositionRef.current, 1.0 / lastScale);
        const newMouse = scalePoint(mousePositionRef.current, 1.0 / scale);
        const mouseOffset = diffPoints(lastMouse, newMouse);
        updateAdjustedOffset(mouseOffset);
      }
    }
  }, [scale, lastScale, pinchCenterRef, mousePositionRef, updateAdjustedOffset]);

  React.useEffect((): void => {
    const delta = diffPoints(panOffset, lastPanOffset);
    if (delta.x !== 0 || delta.y !== 0) {
      updateAdjustedOffset(scalePoint(delta, 1.0 / scale));
    }
  }, [panOffset, lastPanOffset, scale, updateAdjustedOffset]);

  React.useLayoutEffect((): void => {
    updateAdjustedOffset(null, true);
  }, [updateAdjustedOffset]);

  const getEventElementPosition = (event: React.MouseEvent<HTMLElement>): Point => {
    const eventPoint = { x: event.clientX, y: event.clientY };
    const elementRect = event.currentTarget.getBoundingClientRect();
    const adjustedElementRect = { x: -elementRect.x, y: -elementRect.y };
    const offsetRect = { x: -event.currentTarget.offsetLeft, y: -event.currentTarget.offsetTop };
    return sumPoints(sumPoints(eventPoint, offsetRect), adjustedElementRect);
  };

  const onCanvasMouseDown = (event: React.MouseEvent<HTMLElement>): void => {
    lastMouseMoveTimeRef.current = new Date();
    lastMouseMovePointRef.current = getEventElementPosition(event);
  };

  const onCanvasMouseMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (!lastMouseMovePointRef.current || !lastMouseMoveTimeRef.current || isMoving) {
      return;
    }
    const timeDiff = new Date().getTime() - lastMouseMoveTimeRef.current.getTime();
    const endPoint = getEventElementPosition(event);
    const pointDiff = diffPoints(endPoint, lastMouseMovePointRef.current);

    if (timeDiff > 700 || Math.abs(pointDiff.x) > 15 || Math.abs(pointDiff.y) > 15) {
      setIsMoving(true);
    }
  };

  const onCanvasMouseUp = (event: React.MouseEvent<HTMLElement>): void => {
    if (!isMoving) {
      const endPoint = getEventElementPosition(event);
      const tokenIndex = Math.floor((endPoint.x / (scale * tokenWidth)) + (Math.floor(endPoint.y / (scale * tokenHeight)) * (canvasWidth / tokenWidth)));
      props.onTokenIdClicked(tokenIndex + 1);
    }

    lastMouseMoveTimeRef.current = null;
    lastMouseMovePointRef.current = null;
    setIsMoving(false);
  };

  return (
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
        ref={canvasWrapperRef}
        style={{
          width: `${canvasWidth * props.maxScale}px`,
          height: `${canvasHeight * props.maxScale}px`,
          transform: `translate(${-adjustedOffset.x * scale}px, ${-adjustedOffset.y * scale}px) scale(${scale / props.maxScale})`,
          transformOrigin: 'left top',
          overflow: 'hidden',
          backgroundImage: `url(${props.baseImage.url}?w=${canvasWidth * window.devicePixelRatio}&h=${canvasHeight * window.devicePixelRatio})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
        onMouseDown={startPanMouse}
        onTouchStart={startPanTouch}
      >
        <canvas
          ref={canvasRef}
          width={`${canvasWidth * props.maxScale}px`}
          height={`${canvasHeight * props.maxScale}px`}
          onMouseDown={onCanvasMouseDown}
          onMouseUp={onCanvasMouseUp}
          onMouseMove={onCanvasMouseMove}
          style={{ cursor: isMoving ? 'move' : 'pointer' }}
        />
      </div>
    </div>
  );
}, deepCompare);
