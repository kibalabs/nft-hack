import React from 'react';

import { Direction, Image, Stack } from '@kibalabs/ui-react';
import styled from 'styled-components';

import { GridItem } from '../client';
import { getPointFromGridItem, getTokenIdFromPoint } from '../util/gridItemUtil';
import { arePointsEqual, Point, sumPoints } from '../util/pointUtil';

interface ImageGridProps {
  gridItem: GridItem;
  blockGridItems: GridItem[] | null;
}

interface IImageGridItemProps {
  isMainItem: boolean;
}

const ImageGridItem = styled.div<IImageGridItemProps>`
  background-color: #000000;
  outline-style: solid;
  outline-width: 1px;
  outline-color: ${(props: IImageGridItemProps): string => (props.isMainItem ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0)')};
  opacity: ${(props: IImageGridItemProps): string => (props.isMainItem ? '1' : '0.5')};
  max-height: 200px;
`;

export const ImageGrid = (props: ImageGridProps): React.ReactElement => {
  const mainPoint = getPointFromGridItem(props.gridItem);
  const blockPoints = props.blockGridItems ? props.blockGridItems.map((gridItem: GridItem): Point => getPointFromGridItem(gridItem)) : [];

  // NOTE(krishan711): this assumes the mainPoint is included in blockPoints
  const minX = blockPoints.reduce((current: number, value: Point): number => Math.min(value.x, current), mainPoint.x);
  const maxX = blockPoints.reduce((current: number, value: Point): number => Math.max(value.x, current), mainPoint.x);
  const minY = blockPoints.reduce((current: number, value: Point): number => Math.min(value.y, current), mainPoint.y);
  const maxY = blockPoints.reduce((current: number, value: Point): number => Math.max(value.y, current), mainPoint.y);
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const allGridItems = [props.gridItem, ...(props.blockGridItems || [])];
  const tokenIdToGridItemMap = allGridItems.reduce((output: Map<number, GridItem>, value: GridItem): Map<number, GridItem> => {
    output.set(value.tokenId, value);
    return output;
  }, new Map<number, GridItem>());

  const adjustGridPoint = (point: Point): Point => {
    return sumPoints({ x: minX, y: minY }, point);
  };

  const getGridItemForGridPoint = (point: Point): GridItem | null => {
    const tokenId = getTokenIdFromPoint(adjustGridPoint(point));
    return tokenIdToGridItemMap.get(tokenId) || null;
  };

  return (
    <Stack direction={Direction.Vertical} isFullHeight={true} isFullWidth={true}>
      {Array.from(Array(height)).map((_, y: number): React.ReactElement => (
        <Stack.Item key={y} shrinkFactor={1} shouldShrinkBelowContentSize={true}>
          <Stack direction={Direction.Horizontal} isFullHeight={true}>
            <Stack.Item growthFactor={1} shrinkFactor={1} />
            {Array.from(Array(width)).map((__, x: number): React.ReactElement => (
              <Stack.Item key={x} shrinkFactor={1} shouldShrinkBelowContentSize={true}>
                <ImageGridItem isMainItem={arePointsEqual(adjustGridPoint({ x, y }), mainPoint)}>
                  {getGridItemForGridPoint({ x, y }) && (
                    <Image variant='tokenPageHeaderGrid' fitType={'cover'} source={getGridItemForGridPoint({ x, y })?.imageUrl || ''} alternativeText={'token image'} />
                  )}
                </ImageGridItem>
              </Stack.Item>
            ))}
            <Stack.Item growthFactor={1} shrinkFactor={1} />
          </Stack>
        </Stack.Item>
      ))}
    </Stack>
  );
};
