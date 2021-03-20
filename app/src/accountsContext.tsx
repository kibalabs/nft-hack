import React from 'react';

import { IMultiAnyChildProps } from '@kibalabs/core-react';

type AccountsControl = {
  accounts: string[] | null;
  setAccounts: (accounts: string[]) => void;
}

export const AccountsContext = React.createContext<AccountsControl | null>(null);

interface IAccountControlProviderProps extends IMultiAnyChildProps {
  accounts: string[] | null;
  setAccounts: (accounts: string[]) => void;
}

export const AccountControlProvider = (props: IAccountControlProviderProps): React.ReactElement => (
  <AccountsContext.Provider value={{ accounts: props.accounts, setAccounts: props.setAccounts }}>
    {props.children}
  </AccountsContext.Provider>
);

export const useAccounts = (): string[] | null => {
  const accountsControl = React.useContext(AccountsContext);
  if (!accountsControl) {
    throw Error('accountsControl has not been initialized correctly.')
  }
  return accountsControl.accounts;
};

export const useSetAccounts = (): ((accounts: string[]) => void) => {
  const accountsControl = React.useContext(AccountsContext);
  if (!accountsControl) {
    throw Error('accountsControl has not been initialized correctly.')
  }
  return accountsControl.setAccounts;
};
