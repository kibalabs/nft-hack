import React from 'react';

import { LayerContainer, Text, Image, Box, BackgroundView, Alignment } from '@kibalabs/ui-react';
import { Token } from '../model';

interface TokenCardProps {
  token: Token;
}

export const TokenCard = (props: TokenCardProps): React.ReactElement => {
  return (
    <Box width={'600px'} height={'400px'}>
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
              <Text variant='light'>{`${props.token.tokenId}: ${props.token.metadata.name}`}</Text>
            </Box>
          </BackgroundView>
        </LayerContainer.Layer>
      </LayerContainer>
    </Box>
  );
}
