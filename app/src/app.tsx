import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { IRoute, MockStorage, Router, useInitialization } from '@kibalabs/core-react';
import { EveryviewTracker } from '@kibalabs/everyview-tracker';
import { Head, IHeadRootProviderProps, KibaApp } from '@kibalabs/ui-react';
import detectEthereumProvider from '@metamask/detect-provider';
import { BigNumber, ethers } from 'ethers';
import { toast, ToastContainer } from 'react-toastify';
import { Web3Storage } from 'web3.storage';
import 'react-toastify/dist/ReactToastify.min.css';

import { AccountControlProvider } from './accountsContext';
import { MdtpClient } from './client/client';
import { Globals, GlobalsProvider } from './globalsContext';
import { AboutPage } from './pages/AboutPage';
import { HomePage } from './pages/HomePage';
import { OwnerPage } from './pages/OwnerPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { SharePage } from './pages/SharePage';
import { TokenMintPage } from './pages/TokenMintPage';
import { TokenPage } from './pages/TokenPage';
import { TokenUpdatePage } from './pages/TokenUpdatePage';
import { buildMDTPTheme } from './theme';
import { DEFAULT_CHAIN_ID, getContractAddress, getContractJson, getMigrationNetwork, getNetwork } from './util/chainUtil';

declare global {
  export interface Window {
    KRT_API_URL?: string;
    KRT_WEB3STORAGE_API_KEY?: string;
  }
}

const requester = new Requester(undefined, undefined, false);
const localStorageClient = new LocalStorageClient(typeof window !== 'undefined' ? window.localStorage : new MockStorage());
const apiClient = new MdtpClient(requester, typeof window !== 'undefined' ? window.KRT_API_URL : undefined);
const web3StorageClient = new Web3Storage({ token: typeof window !== 'undefined' ? window.KRT_WEB3STORAGE_API_KEY : '' });

const tracker = new EveryviewTracker('ee4224993fcf4c2fb2240ecc749c98a8');

const theme = buildMDTPTheme();
const globals: Globals = {
  requester,
  localStorageClient,
  apiClient,
  web3StorageClient,
  web3: undefined,
  network: undefined,
  migrationNetwork: undefined,
  contract: undefined,
  migrationContract: undefined,
  chainId: undefined,
};

export interface IAppProps extends IHeadRootProviderProps {
  staticPath?: string;
}

export const App = (props: IAppProps): React.ReactElement => {
  const [accounts, setAccounts] = React.useState<ethers.Signer[] | undefined | null>(undefined);
  const [accountIds, setAccountIds] = React.useState<string[] | undefined | null>(undefined);
  const [chainId, setChainId] = React.useState<number | null | undefined>(undefined);
  const [network, setNetwork] = React.useState<string | null | undefined>(undefined);
  const [migrationNetwork, setMigrationNetwork] = React.useState<string | null | undefined>(undefined);
  const [contract, setContract] = React.useState<ethers.Contract | null | undefined>(undefined);
  const [migrationContract, setMigrationContract] = React.useState<ethers.Contract | null | undefined>(undefined);
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

  React.useEffect((): void => {
    loadAccounts();
  }, [loadAccounts]);

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
    tracker.initialize().then((): void => {
      tracker.trackApplicationOpen();
    });
    const analyticsScript = document.createElement('script');
    analyticsScript.text = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'UA-31771231-11');
    `;
    document.body.appendChild(analyticsScript);
  });

  React.useEffect((): void => {
    const newNetwork = chainId === undefined ? undefined : chainId === null ? null : getNetwork(chainId);
    setNetwork(newNetwork);
    if (newNetwork === undefined) {
      setContract(undefined);
      setMigrationNetwork(undefined);
    } else if (newNetwork === null) {
      setContract(null);
      setMigrationNetwork(null);
    } else {
      const contractAddress = getContractAddress(newNetwork);
      const contractJson = getContractJson(newNetwork);
      if (web3 && contractAddress) {
        setContract(new ethers.Contract(contractAddress, contractJson.abi, web3));
      } else {
        setContract(null);
      }
      const newMigrationNetwork = getMigrationNetwork(newNetwork);
      setMigrationNetwork(newMigrationNetwork);
      if (newMigrationNetwork) {
        const migrationContractAddress = getContractAddress(newMigrationNetwork);
        const migrationContractJson = getContractJson(newMigrationNetwork);
        if (web3 && migrationContractAddress) {
          setMigrationContract(new ethers.Contract(migrationContractAddress, migrationContractJson.abi, web3));
        } else {
          setMigrationContract(null);
        }
      }
    }
  }, [chainId, web3]);

  const routes: IRoute[] = [
    { path: '/',
      page: HomePage,
      subRoutes: [{ path: '/tokens/:tokenId', page: TokenPage },
        { path: '/tokens/:tokenId/update', page: TokenUpdatePage },
        { path: '/tokens/:tokenId/mint', page: TokenMintPage },
        { path: '/owners/:ownerId', page: OwnerPage },
        { path: '/about', page: AboutPage },
        { path: '/roadmap', page: RoadmapPage },
        { path: '/share', page: SharePage },
      ] },
  ];

  return (
    <KibaApp theme={theme} isFullPageApp={true} setHead={props.setHead}>
      <Head headId='app'>
        <script async src='https://www.googletagmanager.com/gtag/js?id=UA-31771231-11' />
      </Head>
      <GlobalsProvider globals={{ ...globals, network, migrationNetwork, contract, migrationContract, web3, chainId }}>
        <AccountControlProvider accounts={accounts} accountIds={accountIds} onLinkAccountsClicked={onLinkAccountsClicked}>
          <Router staticPath={props.staticPath} routes={routes} />
        </AccountControlProvider>
      </GlobalsProvider>
      <ToastContainer />
    </KibaApp>
  );
};
