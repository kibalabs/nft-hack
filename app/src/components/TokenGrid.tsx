import React from 'react';

import { Box } from '@kibalabs/ui-react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import styled from 'styled-components';

import { GridItem } from '../client';
import { TokenCard } from './TokenCard';

interface TokenGridProps {
  gridItems: GridItem[];
  onGridItemClicked: (gridItem: GridItem) => void;
}

const FlexWrapContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  height: 100vh;
  width: 100vw;
  align-content: flex-start;
`;

export const TokenGrid = (props: TokenGridProps): React.ReactElement => {
  // const [isMoving, setIsMoving] = React.useState<boolean>(false);
  const isMovingRef = React.useRef<boolean>(false);
  const lastMoveStartRef = React.useRef<number | null>(null);
  const lastMoveEndRef = React.useRef<number | null>(null);

  const onMovingStart = (): void => {
    isMovingRef.current = false;
    lastMoveStartRef.current = new Date().getTime();
  };

  const onMovingStop = (): void => {
    isMovingRef.current = false;
    lastMoveEndRef.current = new Date().getTime();
  };

  // const onZoomChange = (zoomInfo: object): void => {
  //   setZoom(zoomInfo.scale);
  // }

  const onGridItemClicked = (gridItem: GridItem): void => {
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
    props.onGridItemClicked(gridItem);
  };

  return (
    <Box isFullHeight={true} isFullWidth={true}>
      <TransformWrapper
        defaultScale={1}
        options={{ minScale: 1, maxScale: 8 }}
        zoomIn={{ step: 100, animationTime: 100 }}
        zoomOut={{ step: 100, animationTime: 100 }}
        wheel={{ step: 100 }}
        // onZoomChange={onZoomChange}
        onWheelStart={onMovingStart}
        onWheelStop={onMovingStop}
        onPanningStart={onMovingStart}
        onPanningStop={onMovingStop}
        onPinchingStart={onMovingStart}
        onPinchingStop={onMovingStop}
      >
        <TransformComponent>
          <FlexWrapContainer>
            { props.gridItems.map((gridItem: GridItem): React.ReactElement => (
              <TokenCard
                key={gridItem.gridItemId}
                // zoom={zoom}
                gridItem={gridItem}
                onClicked={onGridItemClicked}
              />
            ))}
          </FlexWrapContainer>
        </TransformComponent>
      </TransformWrapper>
    </Box>
  );
};
