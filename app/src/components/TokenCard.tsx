import React from 'react';

import { Alignment, BackgroundView, Box, Direction, Image, LayerContainer, Stack, Text, TextAlignment } from '@kibalabs/ui-react';

import { Token } from '../model';

interface TokenCardProps {
  token: Token;
}

export const TokenCard = (props: TokenCardProps): React.ReactElement => {
  return (
    <Box width={'300px'} height={'200px'}>
      <LayerContainer>
        <Image
          isFullHeight={true}
          isFullWidth={true}
          fitType={'cover'}
          source={props.token.metadata.imageUrl}
          alternativeText={`${props.token.metadata.name} image`}
        />
        <LayerContainer.Layer
          isFullHeight={false}
          alignmentVertical={Alignment.End}
        >
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
                <Text variant='light' alignment={TextAlignment.Center}>{`#${props.token.tokenId} ${props.token.metadata.name}`}</Text>
              </Stack>
            </Box>
          </BackgroundView>
        </LayerContainer.Layer>
      </LayerContainer>
    </Box>
  );
};
