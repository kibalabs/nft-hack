import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { Route, Router, useInitialization } from '@kibalabs/core-react';
import { Alignment, KibaApp, LayerContainer } from '@kibalabs/ui-react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';
import Web3 from 'web3';
import { provider as Web3Provider } from 'web3-core';

import { AccountControlProvider } from './accountsContext';
import { MdtpClient } from './client/client';
import { MetaMaskConnection } from './components/MetaMaskConnection';
import MDTContract from './contracts/MillionDollarNFT.json';
import { Globals, GlobalsProvider } from './globalsContext';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TokenPage } from './pages/TokenPage';
import { buildMDTPTheme } from './theme';
import { ChainId, getNetwork } from './util/chainUtil';

declare global {
  export interface Window {
    KRT_CONTRACT_ADDRESS: string;
    KRT_API_URL?: string;
    ethereum?: Web3Provider;
  }
}

const getWeb3Connection = (): Web3 => {
  if (typeof window.ethereum === 'undefined') {
    // TOOD(krishan711): do something here!
    return null;
  }
  return new Web3(window.ethereum);
};


const requester = new Requester();
const web3 = getWeb3Connection();
const localStorageClient = new LocalStorageClient(window.localStorage);
const contract = web3 ? new web3.eth.Contract(MDTContract.abi, window.KRT_CONTRACT_ADDRESS) : null;
const apiClient = new MdtpClient(requester, window.KRT_API_URL);
// const tracker = new EveryviewTracker('');
// tracker.trackApplicationOpen();


const theme = buildMDTPTheme();
const globals: Globals = {
  web3,
  requester,
  localStorageClient,
  contract,
  contractAddress: window.KRT_CONTRACT_ADDRESS,
  apiClient,
  network: 'rinkeby',
  chainId: ChainId.Rinkeby,
};

export const App = hot((): React.ReactElement => {
  const [accounts, setAccounts] = React.useState<string[] | null>(null);
  const [chainId, setChainId] = React.useState<number | null>(null);
  const [network, setNetwork] = React.useState<string | null>(null);

  const onLinkAccountsClicked = async (): Promise<void> => {
    if (!web3) {
      return;
    }

    setAccounts(await web3.eth.requestAccounts());
  };

  const getAccounts = async (): Promise<void> => {
    if (!web3) {
      return;
    }

    setAccounts(await web3.eth.getAccounts());
  };

  useInitialization((): void => {
    getAccounts();
    web3.eth.getChainId().then((retrievedChainId: number): void => {
      setChainId(retrievedChainId);
    });
  });

  React.useEffect((): void => {
    setNetwork(chainId ? getNetwork(chainId) : null);
  }, [chainId]);

  return (
    <KibaApp theme={theme}>
      <GlobalsProvider globals={{ ...globals, network }}>
        <AccountControlProvider accounts={accounts} onLinkAccountsClicked={onLinkAccountsClicked}>
          <LayerContainer>
            <Router>
              <Route path='/' page={HomePage} />
              <Route default={true} page={NotFoundPage} />
              <Route path='/tokens/:tokenId' page={TokenPage} />
              <Route path='/about' page={AboutPage} />
            </Router>
            <LayerContainer.Layer
              isFullHeight={false}
              isFullWidth={false}
              alignmentVertical={Alignment.End}
              alignmentHorizontal={Alignment.Start}
            >
              <MetaMaskConnection />
            </LayerContainer.Layer>
          </LayerContainer>
        </AccountControlProvider>
      </GlobalsProvider>
    </KibaApp>
  );
});
