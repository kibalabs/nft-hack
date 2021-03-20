import React from 'react';

import { RestMethod } from '@kibalabs/core';
import { useInitialization, useNavigator } from '@kibalabs/core-react';
import { Alignment, Button, Direction, LayerContainer, LoadingSpinner, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccounts, useOnLinkAccountsClicked } from '../../accountsContext';
import { TokenGrid } from '../../components/TokenGrid';
import { useGlobals } from '../../globalsContext';
import { Token, TokenMetadata } from '../../model';


export const HomePage = (): React.ReactElement => {
  const { requester, contract } = useGlobals();
  const accounts = useAccounts();
  const onLinkAccountsClicked = useOnLinkAccountsClicked();
  const navigator = useNavigator();
  const [tokenSupply, setTokenSupply] = React.useState<number | null>(null);
  const [tokens, setTokens] = React.useState<Token[] | null>(null);

  useInitialization((): void => {
    loadTokens();
  });

  const loadTokens = async (): Promise<void> => {
    const totalSupply = Number(await contract.methods.totalSupply().call());
    setTokenSupply(totalSupply);
    const retrievedTokens = await Promise.all(new Array(totalSupply).fill(null).map(async (_: unknown, index: number): Promise<Token> => {
      const tokenId = index + 1;
      const tokenMetadataUrl = await contract.methods.tokenURI(tokenId).call();
      const tokenMetadataResponse = await requester.makeRequest(RestMethod.GET, tokenMetadataUrl);
      const tokenMetadataJson = JSON.parse(tokenMetadataResponse.content);
      const tokenMetadata = new TokenMetadata(tokenMetadataJson.name, tokenMetadataJson.description, tokenMetadataJson.image);
      return new Token(tokenId, tokenMetadataUrl, tokenMetadata);
    }));
    setTokens(retrievedTokens);
  };

  const onConnectClicked = async (): Promise<void> => {
    await onLinkAccountsClicked();
  };

  const onTokenClicked = (token: Token) => {
    navigator.navigateTo(`/tokens/${token.tokenId}`);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million NFT Page'}</title>
      </Helmet>
      <LayerContainer>
        { (!tokenSupply || !tokens) ? (
          <LoadingSpinner />
        ) : (
          <TokenGrid tokens={tokens} onTokenClicked={onTokenClicked} />
        )}
        {/* <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
          <Spacing variant={PaddingSize.Wide3} />
          <Text variant='header1'>The Million NFT Page</Text>
          { !accounts ? (
            <LoadingSpinner />
          ) : (accounts.length === 0) ? (
            <Button variant={'primary'} onClicked={onConnectClicked} text='Enable Ethereum' />
          ) : (
            <React.Fragment>
              <Text variant='bold'>{'Connected accounts:'}</Text>
              {accounts.map((account: string): React.ReactElement => (
                <Text key={account}>{`${account}`}</Text>
              ))}
            </React.Fragment>
          )}
          <Spacing variant={PaddingSize.Default} />
        </Stack> */}
      </LayerContainer>
    </React.Fragment>
  );
};
