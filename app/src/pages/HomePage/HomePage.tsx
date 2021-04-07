import React from 'react';

import { RestMethod } from '@kibalabs/core';
import { useNavigator } from '@kibalabs/core-react';
import { LoadingSpinner, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';

import { AboutIcon } from '../../components/AboutIcon';
import { TokenGrid } from '../../components/TokenGrid';
import { useGlobals } from '../../globalsContext';
import { Token, TokenMetadata } from '../../model';

enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
}

export const HomePage = (): React.ReactElement => {
  const { web3, requester, contract } = useGlobals();
  const navigator = useNavigator();
  const [browserError, setBrowserError] = React.useState<string | null>(null);
  const [tokenSupply, setTokenSupply] = React.useState<number | null>(null);
  const [tokens, setTokens] = React.useState<Token[] | null>(null);
  const [chainId, setChainId] = React.useState<number | null>(null);

  web3.eth.getChainId().then(setChainId);

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
      setBrowserError('We only support browsers with MetaMask.');
    } else if (chainId !== ChainId.Rinkeby) {
      setBrowserError('We do not support this chain, please switch to Rinkeby');
    } else {
      loadTokens();
      setBrowserError(null);
    }
  }, [chainId, contract, loadTokens]);

  const onTokenClicked = (token: Token) => {
    navigator.navigateTo(`/tokens/${token.tokenId}`);
  };

  return (
    <React.Fragment>
      <Helmet>
        <title>{'The Million Dollar Token Page - Own a piece of crypto history!'}</title>
      </Helmet>
      { browserError !== null ? (
        <Text>{browserError}</Text>
      ) : (!tokenSupply || !tokens) ? (
        <LoadingSpinner />
      ) : (
        <TokenGrid tokens={tokens} onTokenClicked={onTokenClicked} />
      )}
      <AboutIcon />
    </React.Fragment>
  );
};
