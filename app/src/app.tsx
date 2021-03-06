import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { Route, Router, useInitialization } from '@kibalabs/core-react';
import { EveryviewTracker } from '@kibalabs/everyview-tracker';
import { KibaApp } from '@kibalabs/ui-react';
import detectEthereumProvider from '@metamask/detect-provider';
import { BigNumber, ethers } from 'ethers';
import ReactGA from 'react-ga';
import { Helmet } from 'react-helmet';
import { toast, ToastContainer } from 'react-toastify';
import { Web3Storage } from 'web3.storage/dist/bundle.esm.min.js';
import 'react-toastify/dist/ReactToastify.min.css';

import { AccountControlProvider } from './accountsContext';
import { MdtpClient } from './client/client';
import { Globals, GlobalsProvider } from './globalsContext';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SharePage } from './pages/SharePage';
import { TokenMintPage } from './pages/TokenMintPage';
import { TokenPage } from './pages/TokenPage';
import { TokenUpdatePage } from './pages/TokenUpdatePage';
import { buildMDTPTheme } from './theme';
import { DEFAULT_CHAIN_ID, getContractAddress, getContractJson, getNetwork } from './util/chainUtil';

declare global {
  export interface Window {
    KRT_API_URL?: string;
    KRT_WEB3STORAGE_API_KEY?: string;
  }
}

const requester = new Requester(undefined, undefined, false);
const localStorageClient = new LocalStorageClient(window.localStorage);
const apiClient = new MdtpClient(requester, window.KRT_API_URL);
const web3StorageClient = new Web3Storage({ token: window.KRT_WEB3STORAGE_API_KEY });

ReactGA.initialize('UA-31771231-11');
ReactGA.pageview(window.location.pathname + window.location.search);
const tracker = new EveryviewTracker('ee4224993fcf4c2fb2240ecc749c98a8');
tracker.trackApplicationOpen();

const theme = buildMDTPTheme();
const globals: Globals = {
  requester,
  localStorageClient,
  apiClient,
  web3StorageClient,
  contract: undefined,
  web3: undefined,
  network: undefined,
  chainId: undefined,
};

export const App = (): React.ReactElement => {
  const [accounts, setAccounts] = React.useState<ethers.Signer[] | undefined | null>(undefined);
  const [accountIds, setAccountIds] = React.useState<string[] | undefined | null>(undefined);
  const [chainId, setChainId] = React.useState<number | null | undefined>(undefined);
  const [network, setNetwork] = React.useState<string | null | undefined>(undefined);
  const [contract, setContract] = React.useState<ethers.Contract | null | undefined>(undefined);
  const [web3, setWeb3] = React.useState<ethers.providers.Web3Provider | null | undefined>(undefined);

  const loadWeb3 = async (): Promise<void> => {
    const provider = await detectEthereumProvider();
    if (!provider) {
      setAccounts(null);
      setAccountIds(null);
      setContract(null);
      setChainId(DEFAULT_CHAIN_ID);
      return;
    }

    const web3Connection = new ethers.providers.Web3Provider(provider);
    setWeb3(web3Connection);
  };

  const onAccountsChanged = React.useCallback(async (accountAddresses: string[]): Promise<void> => {
    // NOTE(krishan711): metamask only deals with one account at the moment but returns an array for future compatibility
    const linkedAccounts = accountAddresses.map((accountAddress: string): ethers.Signer => web3.getSigner(accountAddress));
    setAccounts(linkedAccounts);
    Promise.all(linkedAccounts.map((account: ethers.Signer): Promise<string> => account.getAddress())).then((retrievedAccountIds: string[]): void => {
      setAccountIds(retrievedAccountIds);
    });
  }, [web3]);

  const onChainChanged = React.useCallback((): void => {
    window.location.reload();
  }, []);

  const loadAccounts = React.useCallback(async (): Promise<void> => {
    if (!web3) {
      return;
    }
    const newChainId = await web3.provider.request({ method: 'eth_chainId' });
    setChainId(BigNumber.from(newChainId).toNumber());
    web3.provider.on('chainChanged', onChainChanged);
    onAccountsChanged(await web3.provider.request({ method: 'eth_accounts' }));
    web3.provider.on('accountsChanged', onAccountsChanged);
  }, [web3, onChainChanged, onAccountsChanged]);

  const onLinkAccountsClicked = async (): Promise<void> => {
    if (web3) {
      web3.provider.request({ method: 'eth_requestAccounts', params: [] }).then(async (): Promise<void> => {
        await loadWeb3();
      }).catch((error: unknown): void => {
        if (error.message?.includes('wallet_requestPermissions')) {
          toast.error('You already have a MetaMask request window open, please find it!');
        } else {
          toast.error('Something went wrong connecting to MetaMask. Please try refresh the page / your browser and try again');
        }
      });
    }
  };

  useInitialization((): void => {
    loadWeb3();
  });

  React.useEffect((): void => {
    loadAccounts();
  }, [loadAccounts]);

  React.useEffect((): void => {
    const newNetwork = chainId === undefined ? undefined : chainId === null ? null : getNetwork(chainId);
    setNetwork(newNetwork);
    if (newNetwork === undefined) {
      setContract(undefined);
    } else if (newNetwork === null) {
      setContract(null);
    } else {
      const contractAddress = getContractAddress(newNetwork);
      const contractJson = getContractJson(newNetwork);
      if (web3 && contractAddress) {
        setContract(new ethers.Contract(contractAddress, contractJson.abi, web3));
      } else {
        setContract(null);
      }
    }
  }, [chainId, web3]);

  return (
    <KibaApp theme={theme} isFullPageApp={true}>
      <Helmet>
        <link href='https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@300;400;500;600;700;800;900&display=swap' rel='stylesheet' />
      </Helmet>
      <GlobalsProvider globals={{ ...globals, network, contract, web3, chainId }}>
        <AccountControlProvider accounts={accounts} accountIds={accountIds} onLinkAccountsClicked={onLinkAccountsClicked}>
          <Router>
            <Route default={true} page={HomePage}>
              <Route path='/tokens/:tokenId' page={TokenPage} />
              <Route path='/tokens/:tokenId/update' page={TokenUpdatePage} />
              <Route path='/tokens/:tokenId/mint' page={TokenMintPage} />
              <Route path='/about' page={AboutPage} />
              <Route path='/roadmap' page={RoadmapPage} />
              <Route path='/share' page={SharePage} />
            </Route>
          </Router>
        </AccountControlProvider>
      </GlobalsProvider>
      <ToastContainer />
    </KibaApp>
  );
};
