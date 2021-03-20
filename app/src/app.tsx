import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { Route, Router } from '@kibalabs/core-react';
import { KibaApp } from '@kibalabs/ui-react';
import { Helmet } from 'react-helmet';
// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';
import Web3 from 'web3';

import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { GlobalsProvider } from './globalsContext';
import { buildNftHackTheme } from './theme';

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
// const tracker = new EveryviewTracker('');
// tracker.trackApplicationOpen();

const globals = {
  web3,
  requester,
  localStorageClient,
};

const theme = buildNftHackTheme();

export const App = hot((): React.ReactElement => {
  return (
    <KibaApp theme={theme}>
      <GlobalsProvider globals={globals}>
        <Helmet>
          <title>{'The Million NFT Page'}</title>
        </Helmet>
        <Router>
          <Route path='/' page={HomePage} />
          <Route default={true} page={NotFoundPage} />
        </Router>
      </GlobalsProvider>
    </KibaApp>
  );
});
