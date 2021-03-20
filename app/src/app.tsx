import React from 'react';

import { useInitialization } from '@kibalabs/core-react';
import { Alignment, buildTheme, Button, ContainingView, Direction, KibaApp, LoadingSpinner, PaddingSize, Spacing, Stack, Text } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';
import Web3 from 'web3';

// import  contractAbi from './contracts/MyNFT.sol/MyNFT.json';
// console.log('contractAbi', contractAbi);

// const requester = new Requester();
// const notdClient = new NotdClient(requester);
// const localStorageClient = new LocalStorageClient(window.localStorage);
// const tracker = new EveryviewTracker('017285d5fef9449783000125f2d5d330');
// tracker.trackApplicationOpen();

const ABI = [
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenURI',
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
  },
];

const theme = buildTheme();

const getEthereumConnection = (): unknown => {
  if (typeof window.ethereum === 'undefined') {
    // TOOD(krishan711): do something here!
    return null;
  }
  return window.ethereum;
};

class Token {
  readonly tokenId: number;
  readonly url: string;

  public constructor(tokenId: number, url: string) {
    this.tokenId = tokenId;
    this.url = url;
  }
}

export const App = hot((): React.ReactElement => {
  const [tokenSupply, setTokenSupply] = React.useState<number | null>(null);
  const [tokens, setTokens] = React.useState<Token[] | null>(null);

  useInitialization(async (): Promise<void> => {
    const ethereum = getEthereumConnection();
    // console.log('networkVersion', ethereum.networkVersion);
    // console.log('selectedAddress', ethereum.selectedAddress);
    const web3 = new Web3(ethereum);
    const contract = new web3.eth.Contract(ABI, '0x7aad38ac82B2FAf01317dd5428Dd3B9845A24e0C');
    const totalSupply = Number(await contract.methods.totalSupply().call());
    setTokenSupply(totalSupply);
    // console.log('totalSupply', totalSupply);
    // console.log('Array(totalSupply).fill(null)', new Array(totalSupply + 1).fill(null));
    const retrievedTokens = await Promise.all(new Array(totalSupply).fill(null).map(async (_: unknown, index: number): Promise<Token> => {
      const tokenId = index + 1;
      // console.log('here', tokenId);
      const tokenUrl = await contract.methods.tokenURI(tokenId).call();
      // console.log(tokenUrl);
      return new Token(tokenId, tokenUrl);
    }));
    setTokens(retrievedTokens);
  });

  const onConnectClicked = async (): Promise<void> => {
    const ethereum = getEthereumConnection();
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    // eslint-disable-next-line no-console
    console.log('accounts', accounts);
  };

  return (
    <KibaApp theme={theme}>
      <Helmet>
        <title>{'The Million NFT Page'}</title>
      </Helmet>
      <ContainingView>
        <Stack direction={Direction.Vertical} isFullWidth={true} isFullHeight={true} childAlignment={Alignment.Center} contentAlignment={Alignment.Start} isScrollableVertically={true}>
          <Spacing variant={PaddingSize.Wide3} />
          <Text variant='header1'>The Million NFT Page</Text>
          <Spacing variant={PaddingSize.Wide3} />
          <Button variant={'primary'} onClicked={onConnectClicked} text='Enable Ethereum' />
          <Spacing variant={PaddingSize.Wide3} />
          { (!tokenSupply || !tokens) ? (
            <LoadingSpinner />
          ) : (
            <React.Fragment>
              <Text variant='bold'>{`${tokenSupply} tokens minted 💰`}</Text>
              {tokens.map((token: Token): React.ReactElement => (
                <Text key={token.tokenId}>{`${token.tokenId}: ${token.url}`}</Text>
              ))}
            </React.Fragment>
          )}
          <Spacing variant={PaddingSize.Default} />
        </Stack>
      </ContainingView>
    </KibaApp>
  );
});
