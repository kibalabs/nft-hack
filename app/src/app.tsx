import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { Route, Router, useInitialization } from '@kibalabs/core-react';
import { Alignment, KibaApp, LayerContainer } from '@kibalabs/ui-react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';
import Web3 from 'web3';

import { AccountControlProvider } from './accountsContext';
import { MetaMaskConnection } from './components/MetaMaskConnection';
import MDNFTContract from './contracts/MillionDollarNFT.json';
import { GlobalsProvider } from './globalsContext';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TokenPage } from './pages/TokenPage';
import { buildNftHackTheme } from './theme';

declare global {
  export interface Window {
    KRT_CONTRACT_ADDRESS: string;
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
const contract = web3 ? new web3.eth.Contract(MDNFTContract.abi, window.KRT_CONTRACT_ADDRESS) : null;
// const tracker = new EveryviewTracker('');
// tracker.trackApplicationOpen();

const globals = {
  web3,
  requester,
  localStorageClient,
  contract,
};

const theme = buildNftHackTheme();

export const App = hot((): React.ReactElement => {
  const [accounts, setAccounts] = React.useState<string[] | null>(null);

  const onLinkAccountsClicked = async (): Promise<void> => {
    setAccounts(await web3.eth.requestAccounts());
  };

  const getAccounts = async (): Promise<void> => {
    setAccounts(await web3.eth.getAccounts());
  };

  useInitialization((): void => {
    getAccounts();
  });

  return (
    <KibaApp theme={theme}>
      <GlobalsProvider globals={globals}>
        <AccountControlProvider accounts={accounts} onLinkAccountsClicked={onLinkAccountsClicked}>
          <LayerContainer>
            <Router>
              <Route path='/' page={HomePage} />
              <Route default={true} page={NotFoundPage} />
              <Route path='/tokens/:tokenId' page={TokenPage} />
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
