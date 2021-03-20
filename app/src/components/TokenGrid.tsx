import React from 'react';

import { Box } from '@kibalabs/ui-react';

import { Token } from '../model';
import { TokenCard } from './TokenCard';

interface TokenGridProps {
  tokens: Token[];
  onTokenClicked: (token: Token) => void;
}

export const TokenGrid = (props: TokenGridProps): React.ReactElement => {
  return (
    <Box isFullHeight={true} isFullWidth={true}>
      {props.tokens.map((token: Token): React.ReactElement => (
        <TokenCard key={token.tokenId} token={token} onClicked={props.onTokenClicked} />
      ))}
    </Box>
  );
};
