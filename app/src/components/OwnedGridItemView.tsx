import React from 'react';

import { useNavigator } from '@kibalabs/core-react';
import { Alignment, Box, Button, Direction, Stack, Text } from '@kibalabs/ui-react';

import { GridItem } from '../client';
import { isUpdated } from '../util/gridItemUtil';
import { ImageGrid } from './ImageGrid';
import { MdtpImage } from './MdtpImage';

export interface IOwnedGridItemViewProps {
  gridItems: GridItem[];
  startTokenId: number;
  isOwner: boolean;
}

export const OwnedGridItemView = (props: IOwnedGridItemViewProps): React.ReactElement => {
  const navigator = useNavigator();
  const firstGridItem = props.gridItems[0];
  const hasNotUpdated = props.isOwner && !isUpdated(firstGridItem);
  const boxVariantSuffix = hasNotUpdated ? '-error' : '';

  const onUpdateClicked = (): void => {
    navigator.navigateTo(`/tokens/${props.startTokenId}/update`);
  };

  return (
    <Box variant={`card${boxVariantSuffix}`}>
      <Stack direction={Direction.Horizontal} isFullWidth={true} isFullHeight={true} shouldAddGutters={true} childAlignment={Alignment.Center}>
        <Box width='3em' height='3em' shouldClipContent={true}>
          {props.gridItems.length > 0 ? (
            <ImageGrid blockGridItems={props.gridItems} />
          ) : (
            <MdtpImage source={props.gridItems[0].imageUrl} alternativeText={'Token image'} />
          )}
        </Box>
        <Stack.Item growthFactor={1} shrinkFactor={1}>
          <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} contentAlignment={Alignment.Center}>
            <Text variant='note'>{props.gridItems.map((value: GridItem): string => `#${value.tokenId}`).join(', ')}</Text>
            <Text>{props.gridItems[0].title}</Text>
          </Stack>
        </Stack.Item>
        { hasNotUpdated && (
          <Button variant='error-small' text='Update' onClicked={onUpdateClicked} />
        )}
      </Stack>
    </Box>
  );
};
