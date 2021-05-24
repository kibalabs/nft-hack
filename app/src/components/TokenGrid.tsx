import React from 'react';

import { useDebouncedCallback, usePreviousValue, useWindowSize } from '@kibalabs/core-react';
import { Alignment, LayerContainer } from '@kibalabs/ui-react';

import { BaseImage, GridItem } from '../client';
import { useGlobals } from '../globalsContext';
import { arePointRangesEqual, arePointsEqual, diffPoints, floorPoint, ORIGIN_POINT, Point, PointRange, scalePoint, sumPoints } from '../util/pointUtil';
import { useMousePositionRef } from '../util/useMousePositionRef';
import { usePan } from '../util/usePan';
import { useScale } from '../util/useScale';
import { GridControl } from './GridControl';

const tokenWidth = 10;
const tokenHeight = 10;
const canvasWidth = 1000;

interface TokenGridProps {
  newGridItems: GridItem[];
  baseImage: BaseImage;
  tokenCount: number;
  onTokenIdClicked: (tokenId: number) => void;
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
  const { apiClient, network } = useGlobals();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const windowSize = useWindowSize();
  const [panOffset, startPan] = usePan();
  const lastPanOffset = usePreviousValue(panOffset);
  const [scale, setScale] = useScale(containerRef, MIN_SCALE, MAX_SCALE, 0.3, true);
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
  const [setRedrawCallback, clearRedrawCallback] = useDebouncedCallback(350);
  const [isMoving, setIsMoving] = React.useState<boolean>(false);

  const canvasHeight = tokenHeight * Math.ceil((props.tokenCount * tokenWidth) / canvasWidth);

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
        context.drawImage(newImage, x * MAX_SCALE, y * MAX_SCALE, tokenWidth * MAX_SCALE, tokenHeight * MAX_SCALE);
      });
      tokenImages.current.set(tokenIndex, newImage);
      image = newImage;
    }

    // @ts-ignore TODO(krishan711): make baseUrl visible in ServiceClient
    image.setAttribute('src', `${apiClient.baseUrl}/v1/networks/${network}/tokens/${tokenId}/go-to-image?w=${tokenWidth * imageScale * window.devicePixelRatio}&h=${tokenHeight * imageScale * window.devicePixelRatio}`);
    tokenScales.current.set(tokenIndex, imageScale);
  }, [apiClient, network]);

  React.useEffect((): void => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) {
      return;
    }
    props.newGridItems.forEach((gridItem: GridItem): void => {
      if (gridItem.updatedDate > props.baseImage.updatedDate) {
        drawTokenImageOnCanvas(context, gridItem.tokenId - 1, 1);
      }
    });
  }, [props.newGridItems, props.baseImage, drawTokenImageOnCanvas]);

  // NOTE(krishan711): due to the "center by default" logic this would probably be better
  // modelled as "offset from center" instead of directly the offset
  const updateAdjustedOffset = React.useCallback((offset: Point | null, sizeChanged = false): void => {
    if (windowSize.width === 0 || windowSize.height === 0 || canvasHeight === 0) {
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
      if (truncatedScale < HALF_SCALE) {
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
              drawTokenImageOnCanvas(context, tokenIndex, truncatedScale);
            }
          }
        }
      }
    });
  }, [props.tokenCount, canvasHeight, scale, lastScale, windowSize, setRedrawCallback, clearRedrawCallback, drawTokenImageOnCanvas]);

  React.useEffect((): void => {
    if (scale !== lastScale) {
      // TODO(krishan711): when scaling with the buttons the mouse position should not be used
      const lastMouse = scalePoint(mousePositionRef.current, 1.0 / lastScale);
      const newMouse = scalePoint(mousePositionRef.current, 1.0 / scale);
      const mouseOffset = diffPoints(lastMouse, newMouse);
      updateAdjustedOffset(mouseOffset);
    }
  }, [scale, lastScale, mousePositionRef, updateAdjustedOffset]);

  React.useEffect((): void => {
    const delta = diffPoints(panOffset, lastPanOffset);
    if (delta.x !== 0 || delta.y !== 0) {
      updateAdjustedOffset(scalePoint(delta, 1.0 / scale));
    }
  }, [panOffset, lastPanOffset, scale, updateAdjustedOffset]);

  React.useLayoutEffect((): void => {
    updateAdjustedOffset(null, true);
  }, [updateAdjustedOffset]);

  const onZoomInClicked = (): void => {
    setScale(scale + 1);
  };

  const onZoomOutClicked = (): void => {
    setScale(scale - 1);
  };

  const onCanvasMouseDown = (event: React.MouseEvent<HTMLElement>): void => {
    lastMouseMoveTimeRef.current = new Date();
    lastMouseMovePointRef.current = { x: event.pageX - event.currentTarget.offsetLeft, y: event.pageY - event.currentTarget.offsetTop };
  };

  const onCanvasMouseMove = (event: React.MouseEvent<HTMLElement>): void => {
    if (!lastMouseMovePointRef.current || !lastMouseMoveTimeRef.current || isMoving) {
      return;
    }
    const timeDiff = new Date().getTime() - lastMouseMoveTimeRef.current.getTime();
    const endPoint = { x: event.pageX - event.currentTarget.offsetLeft, y: event.pageY - event.currentTarget.offsetTop };
    const pointDiff = diffPoints(endPoint, lastMouseMovePointRef.current);

    if (timeDiff > 700 || Math.abs(pointDiff.x) > 15 || Math.abs(pointDiff.y) > 15) {
      setIsMoving(true);
    }
  };

  const onCanvasMouseUp = (event: React.MouseEvent<HTMLElement>): void => {
    if (!isMoving) {
      const endPoint = { x: event.pageX - event.currentTarget.offsetLeft, y: event.pageY - event.currentTarget.offsetTop };
      const targetPoint = sumPoints(endPoint, scalePoint(adjustedOffset, scale));
      const tokenIndex = Math.floor((targetPoint.x / (scale * tokenWidth)) + (Math.floor(targetPoint.y / (scale * tokenHeight)) * (canvasWidth / tokenWidth)));
      props.onTokenIdClicked(tokenIndex + 1);
    }
    setIsMoving(false);

    lastMouseMoveTimeRef.current = null;
    lastMouseMovePointRef.current = null;
  };

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
            transform: `translate(${-adjustedOffset.x * scale}px, ${-adjustedOffset.y * scale}px) scale(${scale / MAX_SCALE})`,
            transformOrigin: 'left top',
            overflow: 'hidden',
            backgroundImage: `url(${props.baseImage.url}?w=${canvasWidth * window.devicePixelRatio}&h=${canvasHeight * window.devicePixelRatio})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
          }}
          onMouseDown={startPan}
        >
          <canvas
            ref={canvasRef}
            width={`${canvasWidth * MAX_SCALE}px`}
            height={`${canvasHeight * MAX_SCALE}px`}
            onMouseDown={onCanvasMouseDown}
            onMouseUp={onCanvasMouseUp}
            onMouseMove={onCanvasMouseMove}
            style={{ cursor: isMoving ? 'move' : 'pointer' }}
          />
        </div>
      </div>
      <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.Start} alignmentHorizontal={Alignment.Start}>
        <GridControl
          zoomLevel={`${Math.floor(100 * (scale / MAX_SCALE))}%`}
          onZoomInClicked={onZoomInClicked}
          onZoomOutClicked={onZoomOutClicked}
        />
      </LayerContainer.Layer>
    </LayerContainer>
  );
};
