import React from 'react';

import { RestMethod } from '@kibalabs/core';
import { useInitialization } from '@kibalabs/core-react';
import { Alignment, Box, Direction, Image, LoadingSpinner, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useGlobals } from '../../globalsContext';
import { Token, TokenMetadata } from '../../model';


export type TokenPageProps = {
  tokenId: string;
}

export const TokenPage = (props: TokenPageProps): React.ReactElement => {
  const { contract, requester } = useGlobals();
  const [token, setToken] = React.useState<Token | null>(null);

  // @ts-ignore
  useInitialization(async (): Promise<void> => {
    const tokenMetadataUrl = await contract.methods.tokenURI(Number(props.tokenId)).call();
    const tokenMetadataResponse = await requester.makeRequest(RestMethod.GET, tokenMetadataUrl);
    const tokenMetadataJson = JSON.parse(tokenMetadataResponse.content);
    const tokenMetadata = new TokenMetadata(tokenMetadataJson.name, tokenMetadataJson.description, tokenMetadataJson.imageUrl);
    const retrievedToken = new Token(Number(props.tokenId), tokenMetadataUrl, tokenMetadata);
    setToken(retrievedToken);
  });

  return (
    <React.Fragment>
      <Helmet>
        <title>{'Token | The Million NFT Page'}</title>
      </Helmet>
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        { !token ? (
          <React.Fragment>
            <Spacing variant={PaddingSize.Wide3} />
            <LoadingSpinner />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <Box
              maxHeight='350px'
            >
              <Image
                isFullWidth={true}
                fitType={'cover'}
                source={token.metadata.imageUrl}
                alternativeText={`${token.metadata.name} image`}
              />
            </Box>
            <Spacing variant={PaddingSize.Wide3} />
            <Text variant='header1'>{token.metadata.name}</Text>
            <Spacing variant={PaddingSize.Wide1} />
            <Text>{token.metadata.description}</Text>
            <Spacing variant={PaddingSize.Wide3} />
          </React.Fragment>
        )}
        <Spacing variant={PaddingSize.Default} />
      </Stack>
    </React.Fragment>
  );
};
