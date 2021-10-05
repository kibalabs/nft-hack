import React from 'react';

import { Alignment, Direction, Stack } from '@kibalabs/ui-react';
import styled from 'styled-components';

import { GridItem } from '../client';
import { MdtpImage } from '../components/MdtpImage';
import { getPointFromGridItem, getTokenIdFromPoint } from '../util/gridItemUtil';
import { arePointsEqual, Point, sumPoints } from '../util/pointUtil';

interface ImageGridProps {
  gridItem?: GridItem;
  blockGridItems: GridItem[];
}

interface IImageGridItemProps {
  isMainItem: boolean;
}

const ImageGridItem = styled.div<IImageGridItemProps>`
  background-color: #000000;
  outline-style: solid;
  outline-width: 1px;
  outline-color: ${(props: IImageGridItemProps): string => (props.isMainItem ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0)')};
  opacity: ${(props: IImageGridItemProps): string => (props.isMainItem ? '1' : '0.75')};
  height: 100%;
`;

export const ImageGrid = (props: ImageGridProps): React.ReactElement => {
  const mainPoint = props.gridItem ? getPointFromGridItem(props.gridItem) : null;
  const blockPoints = props.blockGridItems.map((gridItem: GridItem): Point => getPointFromGridItem(gridItem));
  const minX = Math.min(...blockPoints.map((value: Point): number => value.x));
  const maxX = Math.max(...blockPoints.map((value: Point): number => value.x));
  const minY = Math.min(...blockPoints.map((value: Point): number => value.y));
  const maxY = Math.max(...blockPoints.map((value: Point): number => value.y));
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;

  const tokenIdToGridItemMap = props.blockGridItems.reduce((output: Map<number, GridItem>, value: GridItem): Map<number, GridItem> => {
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
        <Stack.Item key={y} baseSize={`calc(100% / ${height})`} growthFactor={1} shrinkFactor={1} shouldShrinkBelowContentSize={true}>
          <Stack direction={Direction.Horizontal} isFullWidth={true} contentAlignment={Alignment.Center}>
            {Array.from(Array(width)).map((__, x: number): React.ReactElement => (
              <Stack.Item key={x} shrinkFactor={1} shouldShrinkBelowContentSize={true}>
                <ImageGridItem isMainItem={mainPoint === null || arePointsEqual(adjustGridPoint({ x, y }), mainPoint)}>
                  <MdtpImage
                    variant='tokenPageHeaderGrid'
                    fitType={'contain'}
                    source={getGridItemForGridPoint({ x, y })?.imageUrl || '/assets/spacer.svg'}
                    alternativeText={''}
                    isFullHeight={true}
                    isFullWidth={true}
                  />
                </ImageGridItem>
              </Stack.Item>
            ))}
          </Stack>
        </Stack.Item>
      ))}
    </Stack>
  );
};
