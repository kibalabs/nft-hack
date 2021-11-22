import React from 'react';

import { deepCompare, isMobile } from '@kibalabs/core';
import { arePointRangesEqual, arePointsEqual, diffPoints, floorPoint, ISize, ORIGIN_POINT, Point, PointRange, scalePoint, sumPoints, useDebouncedCallback, useDeepCompareEffect, useMousePositionRef, usePan, usePreviousValue, useScale, useSize } from '@kibalabs/core-react';
import { useColors } from '@kibalabs/ui-react';

import { BaseImage, GridItem } from '../client';
import { useGlobals } from '../globalsContext';
import { useTokenSelection } from '../tokenSelectionContext';

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

// eslint-disable-next-line react/display-name
export const TokenGrid = React.memo((props: TokenGridProps): React.ReactElement => {
  const { apiClient, network } = useGlobals();
  const colors = useColors();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const focussedTokenIds = useTokenSelection();

  const windowSize = useSize(containerRef.current);
  const windowSizeRef = React.useRef<ISize | null>(windowSize);
  const lastWindowSizeRef = React.useRef<ISize | null>(windowSize);
  const [hasCentered, setHasCentered] = React.useState<boolean>(false);
  const [centerOffset, setCenterOffset] = React.useState<Point | null>(null);
  const [focusOffsetRange, setFocusOffsetRange] = React.useState<PointRange | null>(null);
  const lastFocusOffsetRangeRef = React.useRef<PointRange | null>(focusOffsetRange);
  const panOffset = usePan(canvasWrapperRef);
  const lastPanOffset = usePreviousValue(panOffset);
  const [scale, pinchCenterRef] = useScale(canvasWrapperRef, 0.1, props.scale, props.onScaleChanged);
  const scaleRef = React.useRef<number>(scale);
  const adjustedScaleRef = React.useRef<number>(scale);
  const lastScale = usePreviousValue(scale);
  const lastScaleRef = React.useRef<number>(lastScale);
  const mousePositionRef = useMousePositionRef(canvasWrapperRef);
  const [adjustedOffset, setAdjustedOffset] = React.useState<Point>(panOffset);
  const adjustedOffsetRef = React.useRef<Point>(adjustedOffset);
  const tokenScales = React.useRef<Map<number, number>>(new Map<number, number>());
  const tokenImages = React.useRef<Map<number, HTMLImageElement>>(new Map<number, HTMLImageElement>());
  const lastRangeRef = React.useRef<PointRange>({ topLeft: ORIGIN_POINT, bottomRight: ORIGIN_POINT });
  const lastMouseMoveTimeRef = React.useRef<Date | null>(null);
  const lastMouseMovePointRef = React.useRef<Point | null>(null);
  const [setRedrawCallback, clearRedrawCallback] = useDebouncedCallback(150);
  const [isMoving, setIsMoving] = React.useState<boolean>(false);

  const isRunningOnMobile = isMobile();
  const canvasHeight = tokenHeight * Math.ceil((props.tokenCount * tokenWidth) / canvasWidth);

  // NOTE(krishan711): these are here so updateAdjustedOffset doesn't need adjustedOffset and scale as a dependency.
  adjustedOffsetRef.current = adjustedOffset;
  scaleRef.current = scale;
  lastScaleRef.current = lastScale;
  windowSizeRef.current = windowSize;
  const windowHeight = windowSize?.height || 0;
  const windowWidth = windowSize?.width || 0;

  const truncateScale = React.useCallback((newScale: number): number => {
    if (newScale < (props.maxScale / 2.0) - 0.5) {
      return props.minScale;
    }
    if (newScale < props.maxScale - 0.5) {
      return (props.maxScale / 2.0);
    }
    return props.maxScale;
  }, [props.minScale, props.maxScale]);

  const drawTokenImageOnCanvas = React.useCallback((tokenIndex: number, imageScale: number) => {
    const currentScale = tokenScales.current.get(tokenIndex);
    if (currentScale !== undefined && currentScale >= imageScale) {
      return;
    }
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }

    let image = tokenImages.current.get(tokenIndex);
    if (!image) {
      const x = (tokenIndex * tokenWidth) % canvasWidth;
      const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
      const newImage = new window.Image();
      newImage.addEventListener('load', (): void => {
        context.fillRect(x * props.maxScale, y * props.maxScale, tokenWidth * props.maxScale, tokenHeight * props.maxScale);
        context.drawImage(newImage, x * props.maxScale, y * props.maxScale, tokenWidth * props.maxScale, tokenHeight * props.maxScale);
      });
      tokenImages.current.set(tokenIndex, newImage);
      image = newImage;
    }

    const tokenId = tokenIndex + 1;
    // @ts-ignore TODO(krishan711): make baseUrl visible in ServiceClient
    image.setAttribute('src', `${apiClient.baseUrl}/v1/networks/${network}/tokens/${tokenId}/go-to-image?w=${Math.ceil(tokenWidth * imageScale * window.devicePixelRatio)}&h=${Math.ceil(tokenHeight * imageScale * window.devicePixelRatio)}`);
    tokenScales.current.set(tokenIndex, imageScale);
  }, [props.maxScale, apiClient, network, canvasRef]);

  React.useEffect((): void => {
    props.newGridItems.forEach((gridItem: GridItem): void => {
      if (gridItem.updatedDate > props.baseImage.generatedDate) {
        drawTokenImageOnCanvas(gridItem.tokenId - 1, 1);
      }
    });
  }, [props.newGridItems, props.baseImage, drawTokenImageOnCanvas]);

  React.useLayoutEffect((): void => {
    if (windowWidth === 0 || windowHeight === 0 || hasCentered) {
      return;
    }
    const centerTokenId = (props.tokenCount / 2) - ((canvasWidth / tokenWidth) / 2);
    const tokenIndex = centerTokenId - 1;
    const x = (tokenIndex * tokenWidth) % canvasWidth;
    const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
    const newOffset = {
      x: (x + (x + tokenWidth) - windowWidth) / 2.0,
      y: (y + (y + tokenHeight) - windowHeight) / 2.0,
    };
    setCenterOffset(newOffset);
  }, [props.tokenCount, windowHeight, windowWidth, hasCentered]);

  useDeepCompareEffect((): void => {
    if (focussedTokenIds.length === 0) {
      setFocusOffsetRange(null);
      return;
    }
    let tokenMinX = Number.MAX_VALUE;
    let tokenMinY = Number.MAX_VALUE;
    let tokenMaxX = Number.MIN_VALUE;
    let tokenMaxY = Number.MIN_VALUE;
    focussedTokenIds.forEach((tokenId: number): void => {
      const tokenIndex = tokenId - 1;
      const x = (tokenIndex * tokenWidth) % canvasWidth;
      const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
      tokenMinX = Math.min(tokenMinX, x);
      tokenMinY = Math.min(tokenMinY, y);
      tokenMaxX = Math.max(tokenMaxX, x + tokenWidth);
      tokenMaxY = Math.max(tokenMaxY, y + tokenHeight);
    });
    const newOffsetRange = {
      topLeft: { x: tokenMinX, y: tokenMinY },
      bottomRight: { x: tokenMaxX, y: tokenMaxY },
    };
    setFocusOffsetRange(newOffsetRange);
  }, [focussedTokenIds]);

  const redrawVisibleArea = React.useCallback((): void => {
    if (!windowSizeRef.current) {
      return;
    }
    const scaledOffset = { x: adjustedOffsetRef.current.x / tokenWidth, y: adjustedOffsetRef.current.y / tokenHeight };
    const topLeft = floorPoint(scaledOffset);
    const bottomRight = floorPoint(sumPoints(scaledOffset, { x: windowSizeRef.current.width / tokenWidth / scaleRef.current, y: windowSizeRef.current.height / tokenHeight / scaleRef.current }));
    const range = { topLeft, bottomRight };
    if (arePointRangesEqual(range, lastRangeRef.current)) {
      return;
    }
    const truncatedScale = truncateScale(scaleRef.current);
    lastRangeRef.current = range;
    for (let y = Math.max(0, topLeft.y); y <= bottomRight.y; y += 1) {
      for (let x = Math.max(0, topLeft.x); x <= bottomRight.x; x += 1) {
        const tokenIndex = x + (y * (canvasWidth / tokenWidth));
        if (tokenIndex < props.tokenCount) {
          requestAnimationFrame((): void => {
            drawTokenImageOnCanvas(tokenIndex, truncatedScale);
          });
        }
      }
    }
  }, [props.tokenCount, adjustedOffsetRef, scaleRef, windowSizeRef, truncateScale, drawTokenImageOnCanvas]);

  const updateAdjustedOffset = React.useCallback((offset: Point | null): void => {
    if (windowWidth === 0 || windowHeight === 0 || canvasHeight === 0) {
      return;
    }
    const scaledWindowWidth = windowWidth / scaleRef.current;
    const scaledWindowHeight = windowHeight / scaleRef.current;
    const widthDiff = canvasWidth - scaledWindowWidth;
    const heightDiff = canvasHeight - scaledWindowHeight;
    const minX = widthDiff >= 0 ? -tokenWidth : widthDiff / 2.0;
    const minY = heightDiff >= 0 ? -tokenHeight : heightDiff / 2.0;
    const maxX = minX + (widthDiff >= 0 ? widthDiff + 2 * tokenWidth : 0);
    const maxY = minY + (heightDiff >= 0 ? heightDiff + 2 * tokenHeight : 0);
    let newOffset = sumPoints(adjustedOffsetRef.current, offset || { x: 0, y: 0 });
    if (!hasCentered && centerOffset && ((newOffset.x === minX || newOffset.x === 0) && (newOffset.y === minY || newOffset.y === 0))) {
      newOffset = centerOffset;
      setHasCentered(true);
    }
    const hasWindowSizeChanged = !lastWindowSizeRef.current || (windowWidth !== lastWindowSizeRef.current.width || windowHeight !== lastWindowSizeRef.current.height);
    const focusOffsetHasChanged = focusOffsetRange && (!lastFocusOffsetRangeRef.current || !arePointRangesEqual(lastFocusOffsetRangeRef.current, focusOffsetRange));
    if (hasCentered && (focusOffsetHasChanged || (focusOffsetRange && hasWindowSizeChanged))) {
      if (focusOffsetRange.topLeft.x < newOffset.x) {
        newOffset.x = focusOffsetRange.topLeft.x - tokenWidth;
      } else if (focusOffsetRange.bottomRight.x > newOffset.x + scaledWindowWidth) {
        newOffset.x = focusOffsetRange.bottomRight.x + tokenWidth - scaledWindowWidth;
      }
      if (focusOffsetRange.topLeft.y < newOffset.y) {
        newOffset.y = focusOffsetRange.topLeft.y - tokenHeight;
      } else if (focusOffsetRange.bottomRight.y > newOffset.y + scaledWindowHeight) {
        newOffset.y = focusOffsetRange.bottomRight.y + tokenHeight - scaledWindowHeight;
      }
      lastFocusOffsetRangeRef.current = focusOffsetRange;
    }
    lastWindowSizeRef.current = windowSizeRef.current;
    adjustedScaleRef.current = scaleRef.current;
    const constrainedOffset = {
      x: Math.floor(Math.max(minX, Math.min(maxX, newOffset.x))),
      y: Math.floor(Math.max(minY, Math.min(maxY, newOffset.y))),
    };
    setAdjustedOffset(constrainedOffset);
    const truncatedScale = truncateScale(scaleRef.current);
    if (truncatedScale < props.maxScale / 2.0 || truncatedScale < 3) {
      return;
    }
    const hasMoved = !arePointsEqual(adjustedOffsetRef.current, constrainedOffset);
    const hasScaled = truncatedScale !== truncateScale(lastScaleRef.current);
    if (!hasScaled && !hasMoved) {
      return;
    }
    // NOTE(krishan711): on android the zooming behaves very badly. Find an alternative and then remove this.
    if (isRunningOnMobile) {
      return;
    }
    clearRedrawCallback();
    setRedrawCallback(redrawVisibleArea);
  }, [props.maxScale, truncateScale, hasCentered, centerOffset, focusOffsetRange, lastFocusOffsetRangeRef, scaleRef, lastScaleRef, canvasHeight, windowHeight, windowWidth, windowSizeRef, lastWindowSizeRef, isRunningOnMobile, setRedrawCallback, clearRedrawCallback, redrawVisibleArea]);

  React.useEffect((): void => {
    updateAdjustedOffset(null);
  }, [updateAdjustedOffset]);

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
      updateAdjustedOffset(scalePoint(delta, 1.0 / scaleRef.current));
    }
  }, [panOffset, lastPanOffset, scaleRef, updateAdjustedOffset]);

  const getEventElementPosition = (event: React.MouseEvent<HTMLElement>): Point => {
    const eventPoint = { x: event.clientX, y: event.clientY };
    const elementRect = event.currentTarget.getBoundingClientRect();
    const adjustedElementRect = { x: -elementRect.x, y: -elementRect.y };
    // TODO(krishan711): im not totally sure which of these (if any are correct).
    // The offset (without client) is different on safari (where its from the window) and chrome (where from parent).
    // This code seems to only work when always (0,0)
    // const offsetRect = { x: -event.currentTarget.offsetLeft, y: -event.currentTarget.offsetTop };
    const offsetClientRect = { x: -event.currentTarget.clientLeft, y: -event.currentTarget.clientTop };
    const position = sumPoints(sumPoints(eventPoint, offsetClientRect), adjustedElementRect);
    return position;
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
        backgroundColor: '#000000',
        margin: 'auto',
      }}
    >
      <div
        ref={canvasWrapperRef}
        style={{
          width: `${canvasWidth * props.maxScale}px`,
          height: `${canvasHeight * props.maxScale}px`,
          transform: `translate(${-adjustedOffset.x * adjustedScaleRef.current}px, ${-adjustedOffset.y * adjustedScaleRef.current}px) scale(${adjustedScaleRef.current / props.maxScale})`,
          transformOrigin: 'left top',
          overflow: 'hidden',
          backgroundImage: `url(${props.baseImage.url}?w=${Math.ceil(canvasWidth * window.devicePixelRatio)}&h=${Math.ceil(canvasHeight * window.devicePixelRatio)})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
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
        {focussedTokenIds.length > 0 && (
          <svg
            width={`${canvasWidth * props.maxScale}px`}
            height={`${canvasHeight * props.maxScale}px`}
            style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
          >
            <defs>
              <mask id='hole'>
                {/* for a mask make everything to keep white and everything else black */}
                <rect width='100%' height='100%' fill='white' />
                {focussedTokenIds.map((tokenId: number): React.ReactElement => {
                  const tokenIndex = tokenId - 1;
                  const x = (tokenIndex * tokenWidth) % canvasWidth;
                  const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
                  return (
                    <rect key={tokenIndex} x={x * props.maxScale} y={y * props.maxScale} width={tokenHeight * props.maxScale} height={tokenHeight * props.maxScale} fill='black' />
                  );
                })}
              </mask>
            </defs>
            <rect width='100%' height='100%' fill={colors.gridOverlay} mask='url(#hole)' />
            {focussedTokenIds.map((tokenId: number): React.ReactElement => {
              const tokenIndex = tokenId - 1;
              const x = (tokenIndex * tokenWidth) % canvasWidth;
              const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
              return (
                <rect key={tokenIndex} x={(x - 2) * props.maxScale} y={(y - 2) * props.maxScale} width={(tokenWidth + 4) * props.maxScale} height={(tokenHeight + 4) * props.maxScale} fill={colors.pastel1} mask='url(#hole)' />
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}, deepCompare);
