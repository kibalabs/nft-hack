import React from 'react';

import { Alignment, Button, Direction, LoadingSpinner, PaddingSize, Spacing, Stack, Text, TextAlignment } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
import { useInitialization } from '@kibalabs/core-react';

import { Token, TokenMetadata } from '../../model';
import { useGlobals } from '../../globalsContext';
import myNFTContract from '../../contracts/MyNFT.json';
import { RestMethod } from '@kibalabs/core';
import { TokenCard } from '../../components/TokenCard';


export const HomePage = (): React.ReactElement => {
  const { web3, requester } = useGlobals();
  const [tokenSupply, setTokenSupply] = React.useState<number | null>(null);
  const [tokens, setTokens] = React.useState<Token[] | null>(null);
  const [accounts, setAccounts] = React.useState<string[] | null>(null);

  useInitialization(async (): Promise<void> => {
    // console.log('networkVersion', web3.eth.networkVersion);
    // console.log('selectedAddress', web3.eth.selectedAddress);
    const contract = new web3.eth.Contract(myNFTContract.abi, '0xCc6A9B2f25844f6da0Ab22a5f7dCbCf7D4C5B400');
    const totalSupply = Number(await contract.methods.totalSupply().call());
    setTokenSupply(totalSupply);
    // console.log('totalSupply', totalSupply);
    // console.log('Array(totalSupply).fill(null)', new Array(totalSupply + 1).fill(null));
    const retrievedTokens = await Promise.all(new Array(totalSupply).fill(null).map(async (_: unknown, index: number): Promise<Token> => {
      const tokenId = index + 1;
      const tokenMetadataUrl = await contract.methods.tokenURI(tokenId).call();
      console.log('tokenMetadataUrl', tokenMetadataUrl);
      const tokenMetadataResponse = await requester.makeRequest(RestMethod.GET, tokenMetadataUrl);
      const tokenMetadataJson = JSON.parse(tokenMetadataResponse.content);
      console.log('tokenMetadataJson', tokenMetadataJson);
      const tokenMetadata = new TokenMetadata(tokenMetadataJson.name, tokenMetadataJson.description, tokenMetadataJson.imageUrl);
      return new Token(tokenId, tokenMetadataUrl, tokenMetadata);
    }));
    setTokens(retrievedTokens);
    setAccounts(await web3.eth.getAccounts());
  });

  const onConnectClicked = async (): Promise<void> => {
    setAccounts(await web3.eth.requestAccounts());
  };

  return (
    <React.Fragment>
      <Helmet>
        <title></title>
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
              <TokenCard key={token.tokenId} token={token} />
            ))}
          </React.Fragment>
        )}
        <Spacing variant={PaddingSize.Default} />
      </Stack>
    </React.Fragment>
  );
};
