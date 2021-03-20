import React from 'react';

import { RestMethod } from '@kibalabs/core';
import { useInitialization, useNavigator } from '@kibalabs/core-react';
import { Alignment, Button, Direction, LoadingSpinner, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { useAccounts, useOnLinkAccountsClicked } from '../../accountsContext';
import { TokenCard } from '../../components/TokenCard';
import { useGlobals } from '../../globalsContext';
import { Token, TokenMetadata } from '../../model';


export const HomePage = (): React.ReactElement => {
  const { requester, contract } = useGlobals();
  const accounts = useAccounts();
  const onLinkAccountsClicked = useOnLinkAccountsClicked();
  const navigator = useNavigator();
  const [tokenSupply, setTokenSupply] = React.useState<number | null>(null);
  const [tokens, setTokens] = React.useState<Token[] | null>(null);

  useInitialization((): Promise<void> => {
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
      const tokenMetadata = new TokenMetadata(tokenMetadataJson.name, tokenMetadataJson.description, tokenMetadataJson.imageUrl);
      return new Token(tokenId, tokenMetadataUrl, tokenMetadata);
    }));
    setTokens(retrievedTokens);
  }

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
      <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
        <Spacing variant={PaddingSize.Wide3} />
        <Text variant='header1'>The Million NFT Page</Text>
        <Spacing variant={PaddingSize.Wide3} />
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
        <Spacing variant={PaddingSize.Wide3} />
        { (!tokenSupply || !tokens) ? (
          <LoadingSpinner />
        ) : (
          <React.Fragment>
            <Text variant='bold'>{`${tokenSupply} tokens minted 💰`}</Text>
            {tokens.map((token: Token): React.ReactElement => (
              <TokenCard key={token.tokenId} token={token} onClicked={onTokenClicked} />
            ))}
          </React.Fragment>
        )}
        <Spacing variant={PaddingSize.Default} />
      </Stack>
    </React.Fragment>
  );
};
