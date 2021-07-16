import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { Route, Router, useInitialization } from '@kibalabs/core-react';
import { EveryviewTracker } from '@kibalabs/everyview-tracker';
import { Alignment, KibaApp, LayerContainer } from '@kibalabs/ui-react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';
import ReactGA from 'react-ga';
// eslint-disable-next-line import/no-extraneous-dependencies
import { hot } from 'react-hot-loader/root';

import { AccountControlProvider } from './accountsContext';
import { MdtpClient } from './client/client';
import { MetaMaskConnection } from './components/MetaMaskConnection';
import MDTPContract from './contract.json';
import { Globals, GlobalsProvider } from './globalsContext';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { TokenPage } from './pages/TokenPage';
import { buildMDTPTheme } from './theme';
import { ChainId, getNetwork } from './util/chainUtil';

declare global {
  export interface Window {
    KRT_CONTRACT_ADDRESS: string;
    KRT_API_URL?: string;
  }
}

const requester = new Requester();
const localStorageClient = new LocalStorageClient(window.localStorage);
const apiClient = new MdtpClient(requester, window.KRT_API_URL);

ReactGA.initialize('UA-31771231-11');
ReactGA.pageview(window.location.pathname + window.location.search);
const tracker = new EveryviewTracker('ee4224993fcf4c2fb2240ecc749c98a8');
tracker.trackApplicationOpen();

const theme = buildMDTPTheme();
const globals: Globals = {
  requester,
  localStorageClient,
  contract: null,
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
  const [contract, setContract] = React.useState<ethers.Contract | null>(null);
  const [web3, setWeb3] = React.useState<ethers.providers.Web3Provider | null>(null);

  const onLinkAccountsClicked = async (): Promise<void> => {
    if (web3) {
      web3.provider.enable().then(async (): Promise<void> => {
        await loadWeb3();
      });
    }
  };

  const onChainChanged = (): void => {
    window.location.reload();
  };

  const onAccountsChanged = React.useCallback(async (accountAddresses: string[]): Promise<void> => {
    // NOTE(krishan711): metamask only deals with one account at the moment but returns an array for future compatibility
    const linkedAccounts = accountAddresses.map((accountAddress: string): ethers.Signer => web3.getSigner(accountAddress));
    setAccounts(linkedAccounts);
    Promise.all(linkedAccounts.map((account: ethers.Signer): Promise<string> => account.getAddress())).then((retrievedAccountIds: string[]): void => {
      setAccountIds(retrievedAccountIds);
    });
  }, [web3]);

  const loadWeb3 = async (): Promise<void> => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      setAccounts(null);
      setAccountIds(null);
      setContract(null);
      setChainId(ChainId.Rinkeby);
      return;
    }

    const web3Connection = new ethers.providers.Web3Provider(provider);
    setWeb3(web3Connection);
  };

  const loadAccounts = React.useCallback(async (): Promise<void> => {
    if (!web3) {
      return;
    }
    const connectedContract = new ethers.Contract(window.KRT_CONTRACT_ADDRESS, MDTPContract.abi, web3);
    setContract(connectedContract);
    setChainId(await web3.provider.request({ method: 'eth_chainId' }));
    web3.provider.on('chainChanged', onChainChanged);
    onAccountsChanged(await web3.provider.request({ method: 'eth_accounts' }));
    web3.provider.on('accountsChanged', onAccountsChanged);
  }, [web3, onAccountsChanged]);

  useInitialization((): void => {
    loadWeb3();
  });

  React.useEffect((): void => {
    loadAccounts();
  }, [loadAccounts]);

  React.useEffect((): void => {
    setNetwork(chainId ? getNetwork(chainId) : null);
  }, [chainId]);

  return (
    <KibaApp theme={theme}>
      <GlobalsProvider globals={{ ...globals, network, contract }}>
        <AccountControlProvider accounts={accounts} accountIds={accountIds} onLinkAccountsClicked={onLinkAccountsClicked}>
          <LayerContainer>
            <Router>
              <Route default={true} page={HomePage}>
                <Route path='/tokens/:tokenId' page={TokenPage} />
                <Route path='/about' page={AboutPage} />
              </Route>
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
