import React from 'react';

import { RestMethod } from '@kibalabs/core';
import { useNavigator } from '@kibalabs/core-react';
import { LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { TokenGrid } from '../../components/TokenGrid';
import { useGlobals } from '../../globalsContext';
import { Token, TokenMetadata } from '../../model';


export const HomePage = (): React.ReactElement => {
  const { requester, contract } = useGlobals();
  const navigator = useNavigator();
  const [showBrowserError, setShowBrowserError] = React.useState<boolean>(false);
  const [tokenSupply, setTokenSupply] = React.useState<number | null>(null);
  const [tokens, setTokens] = React.useState<Token[] | null>(null);

  const loadTokens = React.useCallback(async (): Promise<void> => {
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
  }, [contract, requester]);

  React.useEffect((): void => {
    if (!contract) {
      setShowBrowserError(true);
    } else {
      loadTokens();
      setShowBrowserError(false);
    }
  }, [contract, loadTokens]);

  const onTokenClicked = (token: Token) => {
    navigator.navigateTo(`/tokens/${token.tokenId}`);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million Dollar NFT Page - Own a piece of crypto history!'}</title>
      </Helmet>
      { showBrowserError ? (
        <Text>We only support browsers with MetaMask.</Text>
      ) : (!tokenSupply || !tokens) ? (
        <LoadingSpinner />
      ) : (
        <TokenGrid tokens={tokens} onTokenClicked={onTokenClicked} />
      )}
    </React.Fragment>
  );
};
