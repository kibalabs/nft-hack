import React from 'react';

import { deepCompare } from '@kibalabs/core';
import { ISize, useDebouncedCallback, useDeepCompareEffect, usePreviousValue, useSize } from '@kibalabs/core-react';
import { useColors } from '@kibalabs/ui-react';

import { BaseImage, GridItem } from '../client';
import { useGlobals } from '../globalsContext';
import { useTokenSelection } from '../tokenSelectionContext';
import { isMobile } from '../util/browserUtil';
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
  const colors = useColors();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const canvasWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const focussedTokenIds = useTokenSelection();

  const windowSize = useSize(containerRef.current);
  const windowSizeRef = React.useRef<ISize>(windowSize);
  const lastWindowSizeRef = React.useRef<ISize>(windowSize);
  const [hasCentered, setHasCentered] = React.useState<boolean>(false);
  const [centerOffset, setCenterOffset] = React.useState<Point | null>(null);
  const [focusOffsetRange, setFocusOffsetRange] = React.useState<PointRange | null>(null);
  const lastFocusOffsetRangeRef = React.useRef<PointRange | null>(focusOffsetRange);
  const panOffset = usePan(canvasWrapperRef);
  const lastPanOffset = usePreviousValue(panOffset);
  const [scale, pinchCenterRef] = useScale(canvasWrapperRef, 0.1, props.scale, props.onScaleChanged);
  const scaleRef = React.useRef<number>(scale);
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
  const [setRedrawCallback, clearRedrawCallback] = useDebouncedCallback(250);
  const [isMoving, setIsMoving] = React.useState<boolean>(false);

  const isRunningOnMobile = isMobile();
  const canvasHeight = tokenHeight * Math.ceil((props.tokenCount * tokenWidth) / canvasWidth);

  // NOTE(krishan711): these are here so updateAdjustedOffset doesn't need adjustedOffset and scale as a dependency.
  adjustedOffsetRef.current = adjustedOffset;
  scaleRef.current = scale;
  lastScaleRef.current = lastScale;
  windowSizeRef.current = windowSize;
  const windowHeight = windowSize ? windowSize.height : 0;
  const windowWidth = windowSize ? windowSize.width : 0;

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
    if (windowWidth === 0 || windowHeight === 0) {
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
  }, [props.tokenCount, windowHeight, windowWidth]);

  useDeepCompareEffect((): void => {
    console.log('setFocusOffsetRange');
    // if (windowWidth === 0 || windowHeight === 0) {
    //   return;
    // }
    console.log('setFocusOffsetRange 2');
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
    // NOTE(krishan711): the bottomRight is actually relative to the right had side of the canvas rather than left.
    // This is so that the focusOffset is forced to update when the windowSize changes because usually this code will
    // run before the side panel is shown, meaning the window size will change after the below code has run once.
    const newOffsetRange = {
      topLeft: {
        x: tokenMinX,
        y: tokenMinY,
      },
      bottomRight: {
        x: tokenMaxX,
        y: tokenMaxY,
        // x: tokenMaxX - windowWidth,
        // y: tokenMaxY - windowHeight,
      },
    };
    setFocusOffsetRange(newOffsetRange);
  // }, [props.maxScale, windowHeight, windowWidth, focussedTokenIds]);
  }, [focussedTokenIds]);

  const redrawVisibleArea = React.useCallback((): void => {
    console.log('redrawVisibleArea');
    const scaledOffset = { x: adjustedOffsetRef.current.x / tokenWidth, y: adjustedOffsetRef.current.y / tokenHeight };
    const topLeft = floorPoint(scaledOffset);
    const bottomRight = floorPoint(sumPoints(scaledOffset, { x: windowSizeRef.current.width / tokenWidth / scaleRef.current, y: windowSizeRef.current.height / tokenHeight / scaleRef.current }));
    const range: PointRange = { topLeft, bottomRight };
    const truncatedScale = truncateScale(scaleRef.current);
    if (truncatedScale === truncateScale(lastScaleRef.current) && arePointRangesEqual(range, lastRangeRef.current)) {
      console.log('would have skipped because scaleRef and arePointRangesEqual');
    }
    if (arePointRangesEqual(range, lastRangeRef.current)) {
      console.log('skipping because arePointRangesEqual');
      return;
    }
    lastRangeRef.current = range;
    for (let y = Math.max(0, topLeft.y); y <= bottomRight.y; y += 1) {
      for (let x = Math.max(0, topLeft.x); x <= bottomRight.x; x += 1) {
        const tokenIndex = x + (y * (canvasWidth / tokenWidth));
        if (tokenIndex < props.tokenCount) {
          setTimeout((): void => {
            drawTokenImageOnCanvas(tokenIndex, truncatedScale);
          });
        }
      }
    }
  }, [props.tokenCount, adjustedOffsetRef, scaleRef, lastScaleRef, windowSizeRef, truncateScale, drawTokenImageOnCanvas]);

  const updateAdjustedOffset = React.useCallback((offset: Point | null): void => {
    console.log('updateAdjustedOffset --------------');
    if (!windowSize || windowSize.width === 0 || windowSize.height === 0 || canvasHeight === 0) {
      return;
    }
    console.log('updateAdjustedOffset inside');
    const scaledWindowWidth = windowSize.width / scaleRef.current;
    const scaledWindowHeight = windowSize.height / scaleRef.current;
    const widthDiff = canvasWidth - scaledWindowWidth;
    const heightDiff = canvasHeight - scaledWindowHeight;
    const minX = widthDiff >= 0 ? -tokenWidth : widthDiff / 2.0;
    const minY = heightDiff >= 0 ? -tokenHeight : heightDiff / 2.0;
    const maxX = minX + (widthDiff >= 0 ? widthDiff + 2 * tokenWidth : 0);
    const maxY = minY + (heightDiff >= 0 ? heightDiff + 2 * tokenHeight : 0);
    console.log('min', minX, minY);
    console.log('max', maxX, maxY);
    let newOffset = sumPoints(adjustedOffsetRef.current, offset || ORIGIN_POINT);
    console.log('screenSize', scaledWindowWidth, scaledWindowHeight);
    const hasWindowSizeChanged = !lastWindowSizeRef.current || (windowWidth != lastWindowSizeRef.current.width || windowHeight != lastWindowSizeRef.current.height);
    console.log('hasWindowSizeChanged', hasWindowSizeChanged);
    console.log('lastFocusOffsetRangeRef.current', lastFocusOffsetRangeRef.current);
    console.log('focusOffsetRange', focusOffsetRange);
    const focusOffsetHasChanged = focusOffsetRange && (!lastFocusOffsetRangeRef.current || !arePointRangesEqual(lastFocusOffsetRangeRef.current, focusOffsetRange));
    console.log('focusOffsetHasChanged', focusOffsetHasChanged);
    console.log('scaleRef.current', scaleRef.current);
    console.log('newOffset', newOffset);
    if (!hasCentered && centerOffset && ((newOffset.x === minX || newOffset.x === 0) && (newOffset.y === minY || newOffset.y === 0))) {
      console.log('centering');
      newOffset = centerOffset;
      setHasCentered(true);
    }
    console.log('newOffset', newOffset);
    if (focusOffsetHasChanged || (focusOffsetRange && hasWindowSizeChanged)) {
      console.log('focussing');
      if (focusOffsetRange.topLeft.x < newOffset.x) {
        console.log('hello 1');
        newOffset.x = focusOffsetRange.topLeft.x - tokenWidth;
      } else if (focusOffsetRange.bottomRight.x > newOffset.x + scaledWindowWidth) {
        console.log('hello 2');
        newOffset.x = focusOffsetRange.bottomRight.x + tokenWidth - scaledWindowWidth;
      }
      if (focusOffsetRange.topLeft.y < newOffset.y) {
        console.log('hello 3');
        newOffset.y = focusOffsetRange.topLeft.y - tokenHeight;
      } else if (focusOffsetRange.bottomRight.y > newOffset.y + scaledWindowHeight) {
        console.log('hello 4');
        newOffset.y = focusOffsetRange.bottomRight.y + tokenHeight - scaledWindowHeight;
      }
      lastFocusOffsetRangeRef.current = focusOffsetRange;
    }
    lastWindowSizeRef.current = windowSizeRef.current;
    console.log('newOffset', newOffset);
    const constrainedOffset = {
      x: Math.max(minX, Math.min(maxX, newOffset.x)),
      y: Math.max(minY, Math.min(maxY, newOffset.y)),
    };
    console.log('constrainedOffset', constrainedOffset);
    const truncatedScale = truncateScale(scaleRef.current);

    setAdjustedOffset(constrainedOffset);
    const hasMoved = !arePointsEqual(adjustedOffsetRef.current, constrainedOffset);
    const hasScaled = truncatedScale !== truncateScale(lastScaleRef.current);
    if (truncatedScale < props.maxScale / 2.0) {
      return;
    }
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
    console.log('updateAdjustedOffset changed');
    updateAdjustedOffset(null);
  }, [updateAdjustedOffset]);

  React.useEffect((): void => {
    if (scale !== lastScale) {
      console.log('Dealing with scale...');
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
      console.log('Dealing with move...');
      updateAdjustedOffset(scalePoint(delta, 1.0 / scaleRef.current));
    }
  }, [panOffset, lastPanOffset, scaleRef, updateAdjustedOffset]);

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

  const drawHighlight = React.useCallback((): void => {
    console.log('drawHighlight');
    const context = overlayCanvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }
    context.clearRect(0, 0, canvasWidth * props.maxScale, canvasHeight * props.maxScale);
    if (focussedTokenIds.length > 0) {
      context.fillStyle = colors.gridOverlay;
      context.fillRect(0, 0, canvasWidth * props.maxScale, canvasHeight * props.maxScale);
      context.fillStyle = colors.pastel1;
      focussedTokenIds.forEach((tokenId: number): void => {
        const tokenIndex = tokenId - 1;
        const x = (tokenIndex * tokenWidth) % canvasWidth;
        const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
        context.fillRect((x - 2) * props.maxScale, (y - 2) * props.maxScale, (tokenWidth + 4) * props.maxScale, (tokenHeight + 4) * props.maxScale);
      });
      focussedTokenIds.forEach((tokenId: number): void => {
        const tokenIndex = tokenId - 1;
        const x = (tokenIndex * tokenWidth) % canvasWidth;
        const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
        context.clearRect(x * props.maxScale, y * props.maxScale, tokenWidth * props.maxScale, tokenHeight * props.maxScale);
      });
    }
  }, [props.maxScale, colors.gridOverlay, colors.pastel1, canvasHeight, focussedTokenIds]);

  React.useEffect((): void => {
    drawHighlight();
  }, [drawHighlight]);

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
          transform: `translate(${-adjustedOffset.x * scale}px, ${-adjustedOffset.y * scale}px) scale(${scale / props.maxScale})`,
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
        <canvas
          ref={overlayCanvasRef}
          width={`${canvasWidth * props.maxScale}px`}
          height={`${canvasHeight * props.maxScale}px`}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        />
      </div>
    </div>
  );
}, deepCompare);
