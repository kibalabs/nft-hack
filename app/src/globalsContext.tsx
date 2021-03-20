import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { IMultiAnyChildProps } from '@kibalabs/core-react';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';


export interface Globals {
  web3: Web3;
  requester: Requester;
  localStorageClient: LocalStorageClient;
  contract: Contract;
}

export const GlobalsContext = React.createContext<Globals | null>(null);

interface GlobalsProviderProps extends IMultiAnyChildProps {
  globals: Globals;
}

export const GlobalsProvider = (props: GlobalsProviderProps): React.ReactElement => (
  <GlobalsContext.Provider value={props.globals}>
    {props.children}
  </GlobalsContext.Provider>
);

export const useGlobals = (): Globals => {
  const globals = React.useContext(GlobalsContext);
  if (!globals) {
    throw new Error('Cannot use useGlobals since globals has not ben provided above in the hierarchy');
  }
  return globals;
};
