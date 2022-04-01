import React from 'react';

import { IMultiAnyChildProps, useInitialization } from '@kibalabs/core-react';
import detectEthereumProvider from '@metamask/detect-provider';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

type Account = {
  address: string;
  signer: ethers.Signer;
}

type AccountsControl = {
  web3: ethers.providers.Web3Provider | undefined | null;
  accounts: Account[] | undefined | null;
  onLinkAccountsClicked: () => void;
}

export const AccountsContext = React.createContext<AccountsControl | undefined | null>(undefined);

interface IAccountControlProviderProps extends IMultiAnyChildProps {
}

export const AccountControlProvider = (props: IAccountControlProviderProps): React.ReactElement => {
  const [web3, setWeb3] = React.useState<ethers.providers.Web3Provider | null | undefined>(undefined);
  const [accounts, setAccounts] = React.useState<Account[] | undefined | null>(undefined);

  const loadWeb3 = async (): Promise<void> => {
    const provider = await detectEthereumProvider() as ethers.providers.ExternalProvider;
    if (!provider) {
      setAccounts(null);
      return;
    }
    const web3Connection = new ethers.providers.Web3Provider(provider);
    setWeb3(web3Connection);
  };

  const onAccountsChanged = React.useCallback(async (accountAddresses: string[]): Promise<void> => {
    if (!web3) {
      return;
    }
    // NOTE(krishan711): metamask only deals with one account at the moment but returns an array for future compatibility
    const linkedAccounts = accountAddresses.map((accountAddress: string): ethers.Signer => web3.getSigner(accountAddress));
    Promise.all(linkedAccounts.map((account: ethers.Signer): Promise<string> => account.getAddress())).then((retrievedAccountIds: string[]): void => {
      setAccounts(retrievedAccountIds.map((retrievedAccountId: string, index: number): Account => {
        return { address: retrievedAccountId, signer: linkedAccounts[index] };
      }));
    });
  }, [web3]);

  const loadAccounts = React.useCallback(async (): Promise<void> => {
    if (!web3) {
      return;
    }
    // @ts-expect-error
    onAccountsChanged(await web3.provider.request({ method: 'eth_accounts' }));
    // @ts-expect-error
    web3.provider.on('accountsChanged', onAccountsChanged);
  }, [web3, onAccountsChanged]);

  React.useEffect((): void => {
    loadAccounts();
  }, [loadAccounts]);

  const onLinkAccountsClicked = async (): Promise<void> => {
    if (!web3) {
      return;
    }
    // @ts-expect-error
    web3.provider.request({ method: 'eth_requestAccounts', params: [] }).then(async (): Promise<void> => {
      await loadWeb3();
    }).catch((error: unknown): void => {
      if ((error as Error).message?.includes('wallet_requestPermissions')) {
        toast.error('You already have a MetaMask request window open, please find it!');
      } else {
        toast.error('Something went wrong connecting to MetaMask. Please try refresh the page / your browser and try again');
      }
    });
  };

  useInitialization((): void => {
    loadWeb3();
  });

  return (
    <AccountsContext.Provider value={{ accounts, onLinkAccountsClicked, web3 }}>
      {props.children}
    </AccountsContext.Provider>
  );
};

export const useWeb3 = (): ethers.providers.Web3Provider | undefined | null => {
  const accountsControl = React.useContext(AccountsContext);
  if (!accountsControl) {
    throw Error('accountsControl has not been initialized correctly.');
  }
  return accountsControl.web3;
};

export const useAccounts = (): Account[] | undefined | null => {
  const accountsControl = React.useContext(AccountsContext);
  if (!accountsControl) {
    throw Error('accountsControl has not been initialized correctly.');
  }
  return accountsControl.accounts;
};

export const useAccount = (): Account | undefined | null => {
  const accounts = useAccounts();
  if (accounts === undefined) {
    return undefined;
  }
  if (accounts === null) {
    return null;
  }
  if (accounts.length === 0) {
    return null;
  }
  return accounts[0];
};

export const useOnLinkAccountsClicked = (): (() => void) => {
  const accountsControl = React.useContext(AccountsContext);
  if (!accountsControl) {
    throw Error('accountsControl has not been initialized correctly.');
  }
  return accountsControl.onLinkAccountsClicked;
};
