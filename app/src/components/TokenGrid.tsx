import React from 'react';

import { Box, Text } from '@kibalabs/ui-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import styled from 'styled-components';

import { Token } from '../model';
import { TokenCard } from './TokenCard';

interface TokenGridProps {
  tokens: Token[];
  onTokenClicked: (token: Token) => void;
}

const FlexWrapContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  align-content: flex-start;
`;

export type Point = {
  x: number;
  y: number;
}

const ORIGIN: Point = Object.freeze({x: 0, y: 0})

export type CanvasState = {
  offset: Point;
  scale: number;
}

export const CanvasContext = React.createContext<CanvasState>({ offset: ORIGIN, scale: 1} )

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
      };
      return offset
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

const MIN_SCALE = 1
const MAX_SCALE = 3

export const useEventListener = <K extends keyof GlobalEventHandlersEventMap>(ref: React.RefObject<HTMLElement | null>, event: K, listener: (event: GlobalEventHandlersEventMap[K]) => void, options?: boolean | AddEventListenerOptions): void => {
  React.useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }
    const listenerWrapper = ((e: GlobalEventHandlersEventMap[K]) =>
      listener(e)) as EventListener
    node.addEventListener(event, listenerWrapper, options)
    return () => node.removeEventListener(event, listenerWrapper)
  }, [ref, event, listener, options])
}

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
  // Set up an event listener such that on `wheel`, we call `updateScale`.
  useEventListener(ref, 'wheel', e => {
    e.preventDefault()
    updateScale({
      direction: e.deltaY > 0 ? 'up' : 'down',
      interval: 0.1
    });
  });

  return scale;
}

export const TokenGrid = (props: TokenGridProps): React.ReactElement => {
  // const canvasState = React.useContext(CanvasContext)
  // const ref = React.useRef<HTMLDivElement | null>(null)
  // const [offset, startPan] = usePan()
  // const scale = useScale(ref)

  // return (
  //   <Box isFullHeight={true} isFullWidth={true}>
  //     <div onMouseDown={startPan} ref={ref} style={{
  //       height: '100%',
  //       width: '100%',
  //       backgroundColor: '#f5f5f5',
  //       backgroundImage: 'url(/assets/grid.svg)',
  //       transform: `scale(${scale})`,
  //       backgroundPosition: `${-offset.x}px ${-offset.y}px`
  //     }}>
  //       <Text>The desired user zoom level is {scale}.</Text>
  //       <Text>The offset is {JSON.stringify(offset)}.</Text>
  //       <FlexWrapContainer>
  //         { Array(500).fill(null).map((_: unknown, index: number): React.ReactElement => (
  //           <React.Fragment key={index}>
  //             { props.tokens.map((token: Token): React.ReactElement => (
  //               <TokenCard
  //                 key={token.tokenId}
  //                 // zoomLevel={zoomLevel}
  //                 token={token}
  //                 // onClicked={onTokenClicked}
  //               />
  //             ))}
  //           </React.Fragment>
  //         ))}
  //       </FlexWrapContainer>
  //     </div>
  //   </Box>
  // );

  // const [isMoving, setIsMoving] = React.useState<boolean>(false);
  const isMovingRef = React.useRef<boolean>(false);
  const zoomLevelRef = React.useRef<number>(1);
  const lastMoveStartRef = React.useRef<number | null>(null);
  const lastMoveEndRef = React.useRef<number | null>(null);
  const [zoomLevel, setZoomLevel] = React.useState<number>(1);
  const canvasRef = React.useRef(null)

  const onMovingStart = (): void => {
    isMovingRef.current = false;
    lastMoveStartRef.current = new Date().getTime();
  };

  const onMovingStop = (): void => {
    isMovingRef.current = false;
    lastMoveEndRef.current = new Date().getTime();
    setZoomLevel(zoomLevelRef.current);
  };

  const onZoomChange = (zoomInfo: object): void => {
    zoomLevelRef.current = zoomInfo.scale;
  };

  const onTokenClicked = (token: Token): void => {
    if (isMovingRef.current) {
      return;
    }
    if (lastMoveEndRef.current && lastMoveStartRef.current) {
      const timeSinceLastMove = new Date().getTime() - lastMoveEndRef.current;
      const timeSpentOnLastMove = lastMoveEndRef.current - lastMoveStartRef.current;
      // NOTE(krishan711): guessed numbers for interaction lengths
      if (timeSinceLastMove < 50 && timeSpentOnLastMove > 90) {
        return;
      }
    }
    props.onTokenClicked(token);
  };

  const drawDataURIOnCanvas = (strDataURI, context, x, y, w, h) => {
    var img = new window.Image();
    img.addEventListener("load", function () {
      context.drawImage(img, x, y, w, h);
    });
    img.setAttribute("src", strDataURI);
  }

  const tokenWidth = 20;
  const tokenHeight = 20;
  const tokenDuplication = 2000;

  const canvasWidth = 1600;
  const canvasHeight = tokenHeight * ((props.tokens.length * tokenDuplication * tokenWidth) / canvasWidth)

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    props.tokens.forEach((token: Token): void => {
      Array(tokenDuplication).fill(null).forEach((_: unknown, index: number): void => {
        const tokenIndex = ((token.tokenId - 1) * tokenDuplication) + index;
        const x = (tokenIndex * tokenWidth) % canvasWidth;
        const y = tokenHeight * Math.floor((tokenIndex * tokenWidth) / canvasWidth);
        console.log('tokenIndex', tokenIndex);
        console.log('x, y', x, y);
        drawDataURIOnCanvas(token.metadata.imageUrl, context, x, y, tokenWidth, tokenHeight);
     });
    });
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

        // { props.tokens.map((token: Token): React.ReactElement => (
        //   <TokenCard
        //     key={token.tokenId}
        //     isZoomedIn={zoomLevel > 7}
        //     token={token}
        //     onClicked={onTokenClicked}
        //   />
        // ))
  }, []);

  return (
    <Box isFullHeight={true} isFullWidth={true}>
      <TransformWrapper
        defaultScale={1}
        options={{ minScale: 1, maxScale: 8 }}
        zoomIn={{ step: 100, animationTime: 100 }}
        zoomOut={{ step: 100, animationTime: 100 }}
        wheel={{ step: 100 }}
        onZoomChange={onZoomChange}
        onWheelStart={onMovingStart}
        onWheelStop={onMovingStop}
        onPanningStart={onMovingStart}
        onPanningStop={onMovingStop}
        onPinchingStart={onMovingStart}
        onPinchingStop={onMovingStop}
      >
        <TransformComponent>
          <FlexWrapContainer>
            {/* { Array(2000).fill(null).map((_: unknown, index: number): React.ReactElement => (
              <React.Fragment key={index}>
                { props.tokens.map((token: Token): React.ReactElement => (
                  <TokenCard
                    key={token.tokenId}
                    isZoomedIn={zoomLevel > 7}
                    token={token}
                    onClicked={onTokenClicked}
                  />
                ))}
              </React.Fragment>
            ))} */}
            <canvas ref={canvasRef} style={{width: `${canvasWidth}px`, height: `${canvasHeight}px`}} />
          </FlexWrapContainer>
        </TransformComponent>
      </TransformWrapper>
    </Box>
  );
};
