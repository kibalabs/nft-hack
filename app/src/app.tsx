import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { Route, Router, useInitialization } from '@kibalabs/core-react';
import { EveryviewTracker } from '@kibalabs/everyview-tracker';
import { Alignment, KibaApp, LayerContainer } from '@kibalabs/ui-react';
import { ethers } from 'ethers';
import ReactGA from 'react-ga';
// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';

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
    ethereum?: ethers.providers.ExternalProvider;
  }
}

const getWeb3Connection = (): ethers.providers.Web3Provider => {
  if (typeof window.ethereum === 'undefined') {
    // TOOD(krishan711): do something here!
    return null;
  }
  return new ethers.providers.Web3Provider(window.ethereum);
};


const requester = new Requester();
const web3 = getWeb3Connection();
const localStorageClient = new LocalStorageClient(window.localStorage);
const contract = web3 ? new ethers.Contract(window.KRT_CONTRACT_ADDRESS, MDTContract.abi, web3) : null;
const apiClient = new MdtpClient(requester, window.KRT_API_URL);
const tracker = new EveryviewTracker('ee4224993fcf4c2fb2240ecc749c98a8');
tracker.trackApplicationOpen();

ReactGA.initialize('UA-31771231-11');
ReactGA.pageview(window.location.pathname + window.location.search);

const theme = buildMDTPTheme();
const globals: Globals = {
  requester,
  localStorageClient,
  contract,
  contractAddress: window.KRT_CONTRACT_ADDRESS,
  apiClient,
  network: null,
  chainId: ChainId.Rinkeby,
};

export const App = hot((): React.ReactElement => {
  const [accounts, setAccounts] = React.useState<ethers.Signer[] | undefined | null>(undefined);
  const [accountIds, setAccountIds] = React.useState<string[] | undefined | null>(undefined);
  const [chainId, setChainId] = React.useState<number | null>(null);
  const [network, setNetwork] = React.useState<string | null>(null);

  const onLinkAccountsClicked = async (): Promise<void> => {
    await getAccounts();
  };

  const getAccounts = async (): Promise<void> => {
    if (!web3) {
      setAccounts(null);
      return;
    }
    // window.ethereum.enable();
    const signer = await web3.getSigner();
    setAccounts([signer]);
  };

  const getChainId = async (): Promise<void> => {
    if (web3) {
      web3.getNetwork().then((retrievedNetwork: ethers.providers.Network): void => {
        setChainId(retrievedNetwork.chainId);
      });
    } else {
      setChainId(ChainId.Rinkeby);
    }
  };

  useInitialization((): void => {
    getAccounts();
    getChainId();
  });

  React.useEffect((): void => {
    setNetwork(chainId ? getNetwork(chainId) : null);
  }, [chainId]);

  React.useEffect((): void => {
    if (accounts === null) {
      setAccountIds(null);
      return;
    }
    if (accounts === undefined) {
      setAccountIds(undefined);
      return;
    }
    Promise.all(accounts.map((account: ethers.Signer): Promise<string> => account.getAddress())).then((retrievedAccountIds: string[]): void => {
      setAccountIds(retrievedAccountIds);
    });
  }, [accounts]);

  return (
    <KibaApp theme={theme}>
      <GlobalsProvider globals={{ ...globals, network }}>
        <AccountControlProvider accounts={accounts} accountIds={accountIds} onLinkAccountsClicked={onLinkAccountsClicked}>
          <LayerContainer>
            <Router>
              <Route path='/' page={HomePage}>
                <Route path='/tokens/:tokenId' page={TokenPage} />
                <Route path='/about' page={AboutPage} />
              </Route>
              <Route default={true} page={NotFoundPage} />
            </Router>
            <LayerContainer.Layer isFullHeight={false} isFullWidth={false} alignmentVertical={Alignment.End} alignmentHorizontal={Alignment.Start}>
              <MetaMaskConnection />
            </LayerContainer.Layer>
          </LayerContainer>
        </AccountControlProvider>
      </GlobalsProvider>
    </KibaApp>
  );
});
