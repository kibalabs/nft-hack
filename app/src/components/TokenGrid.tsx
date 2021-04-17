import React from 'react';

import { useEventListener } from '@kibalabs/core-react';

import { GridItem } from '../client';

const tokenWidth = 10;
const tokenHeight = 10;
const tokenDuplication = 100; //400;
const canvasWidth = 1400;

interface TokenGridProps {
  gridItems: GridItem[];
  onGridItemClicked: (gridItem: GridItem) => void;
}

export type Point = {
  x: number;
  y: number;
}

const ORIGIN: Point = Object.freeze({x: 0, y: 0})

const diffPoints = (point1: Point, point2: Point): Point => {
  return {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
  }
}

const sumPoints = (point1: Point, point2: Point): Point => {
  return {
    x: point1.x + point2.x,
    y: point1.y + point2.y,
  }
}

const scalePoint = (point: Point, scale: number): Point => {
  return {
    x: point.x * scale,
    y: point.y * scale,
  }
}

export type CanvasState = {
  offset: Point;
  scale: number;
}

export const CanvasContext = React.createContext<CanvasState>({ offset: ORIGIN, scale: 1} )

export const useMousePositionRef = (elementRef: React.RefObject<HTMLElement>): React.RefObject<Point> => {
  const mousePositionRef = React.useRef<Point>(ORIGIN);

  const handleMouseMove = React.useCallback((event: Event) => {
    if (elementRef.current) {
      mousePositionRef.current = {
        x: event.clientX - elementRef.current.offsetLeft,
        y: event.clientY - elementRef.current.offsetTop
      };
    }
  }, [elementRef])

  useEventListener(elementRef.current, 'mousemove', handleMouseMove);

  return mousePositionRef;
}

function usePrevious(value) {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}

export const usePan = (): [Point, (event: React.MouseEvent) => void] => {
  const [panState, setPanState] = React.useState<Point>(ORIGIN);
  const lastPointRef = React.useRef(ORIGIN);
  const pan = React.useCallback((mouseEvent: MouseEvent): void => {
    const lastPoint = lastPointRef.current;
    const point = {x: mouseEvent.pageX, y: mouseEvent.pageY};
    lastPointRef.current = point;
    // Find the delta between the last mouse position on `mousemove` and the current mouse position.
    // Then, apply that delta to the current pan offset and set that as the new state.
    setPanState(panState => {
      const delta = {
        x: lastPoint.x - point.x,
        y: lastPoint.y - point.y,
      };
      const offset = {
        x: panState.x + delta.x,
        y: panState.y + delta.y,
        // x: Math.max(0, panState.x + delta.x),
        // y: Math.max(0, panState.y + delta.y),
      };
      return offset;
    })
  }, []);

  const endPan = React.useCallback((): void => {
    document.removeEventListener('mousemove', pan);
    document.removeEventListener('mouseup', endPan);
  }, [pan]);

  const startPan = React.useCallback((mouseEvent: React.MouseEvent): void => {
    document.addEventListener('mousemove', pan);
    document.addEventListener('mouseup', endPan);
    lastPointRef.current = {
      x: mouseEvent.pageX,
      y: mouseEvent.pageY,
    };
  }, [pan, endPan]);

  return [panState, startPan]
}

type ScaleOpts = {
  direction: 'up' | 'down';
  interval: number;
}

const MIN_SCALE = 1;
const MAX_SCALE = 10;

export const useScale = (ref: React.RefObject<HTMLElement | null>): number => {
  const [scale, setScale] = React.useState(1)

  const updateScale = ({direction, interval}: ScaleOpts) => {
    setScale(currentScale => {
      let scale: number
      // Adjust up to or down to the maximum or minimum scale levels by `interval`.
      if (direction === 'up' && currentScale + interval < MAX_SCALE) {
        scale = currentScale + interval
      } else if (direction === 'up') {
        scale = MAX_SCALE
      } else if (direction === 'down' && currentScale - interval > MIN_SCALE) {
        scale = currentScale - interval
      } else if (direction === 'down') {
        scale = MIN_SCALE
      } else {
        scale = currentScale
      }
      return scale
    })
  }

  useEventListener(ref.current, 'wheel', e => {
    e.preventDefault()
    updateScale({
      direction: e.deltaY > 0 ? 'up' : 'down',
      interval: 0.1
    });
  });

  return scale;
}

export const TokenGrid = (props: TokenGridProps): React.ReactElement => {
  console.log('------------ rendering -------------');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const drawImageOnCanvas = (imageUrl: string, context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
    var img = new window.Image();
    img.addEventListener("load", function () {
      context.drawImage(img, x, y, w, h);
      // context.drawImage(img, x * MAX_SCALE, y * MAX_SCALE, w * MAX_SCALE, h * MAX_SCALE);
    });
    img.setAttribute("src", `${imageUrl}?w=${w}&h=${h}`);
  }

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

  const [buffer, setBuffer] = React.useState(ORIGIN);
  const [panOffset, startPan] = usePan();
  const scale = useScale(containerRef);
  const mousePositionRef = useMousePositionRef(containerRef);

  React.useLayoutEffect(() => {
    const height = containerRef.current?.clientHeight ?? 0;
    const width = containerRef.current?.clientWidth ?? 0;
    setBuffer({
      x: (width - width / scale) / 2,
      y: (height - height / scale) / 2
    })
  }, [scale, setBuffer])

  // const onCanvasClicked = (event: React.MouseEvent<HTMLCanvasElement>): void => {
  //   console.log('onCanvasClicked', event, event.clientX, event.clientY);
  // }

  // const onCanvasMouseDown = (event: React.MouseEvent<HTMLCanvasElement>): void => {
  //   console.log('onCanvasMouseDown', event);
  // }

  // const onCanvasMouseUp = (event: React.MouseEvent<HTMLCanvasElement>): void => {
  //   console.log('onCanvasMouseUp', event);
  // }

  const lastOffset = usePrevious(panOffset);
  const lastScale = usePrevious(scale);
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
    test.current = test.current + 1;
  }

  console.log('adjustedOffsetRef', JSON.stringify(adjustedOffsetRef.current));
  console.log('test4', JSON.stringify(test.current));

  return (
    <div
      ref={containerRef}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px)`,
        overflow: 'hidden',
        backgroundColor: 'grey',
        margin: 'auto',
      }}
      onMouseDown={startPan}
    >
      <div
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          transform: `translate(${-adjustedOffsetRef.current.x * scale}px, ${-adjustedOffsetRef.current.y * scale}px) scale(${scale})`,
          transformOrigin: 'left top',
          overflow: 'hidden',
          backgroundColor: 'yellow',
          bottom: buffer.y,
          left: buffer.x,
          right: buffer.x,
          top: buffer.y
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: `${canvasWidth}px`,
            height: `${canvasHeight}px`,
          }}
          // onMouseDown={onCanvasMouseDown}
          // onMouseUp={onCanvasMouseUp}
          // onClick={onCanvasClicked}
          width={canvasWidth}
          height={canvasHeight}
        />
      </div>
    </div>
  );
};
