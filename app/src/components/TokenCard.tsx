import React from 'react';

import { Alignment, BackgroundView, Box, Direction, HidingView, Image, LayerContainer, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

import { GridItem } from '../client';
import { TokenBox } from './TokenBox';

interface TokenCardProps {
  isZoomedIn: boolean;
  gridItem: GridItem;
  onClicked: (gridItem: GridItem) => void;
}

export const TokenCard = (props: TokenCardProps): React.ReactElement => {
  const onClicked = (): void => {
    props.onClicked(props.gridItem);
  };

  const imageUrl = props.gridItem.resizableImageUrl || props.gridItem.imageUrl;
  const sizedImageUrl = `${imageUrl}?w=50&h=50`;

  return (
    <TokenBox
      onClicked={onClicked}
    >
      <LayerContainer>
        <Image
          isFullHeight={true}
          isFullWidth={true}
          fitType={'cover'}
          source={sizedImageUrl}
          alternativeText={`${props.gridItem.title} image`}
        />
        <LayerContainer.Layer
          isFullHeight={false}
          alignmentVertical={Alignment.End}
        >
          <HidingView isHidden={!props.isZoomedIn}>
            <BackgroundView color='rgba(0, 0, 0, 0.5)'>
              <Box
                variant='padded'
                isFullWidth={true}
              >
                <Stack
                  direction={Direction.Vertical}
                  childAlignment={Alignment.Center}
                  contentAlignment={Alignment.Center}
                >
                  <Text variant='light' alignment={TextAlignment.Center}>{`#${props.gridItem.gridItemId} ${props.gridItem.title}`}</Text>
                </Stack>
              </Box>
            </BackgroundView>
          </HidingView>
        </LayerContainer.Layer>
      </LayerContainer>
    </TokenBox>
  );
};
