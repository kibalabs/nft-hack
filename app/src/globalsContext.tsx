import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { IMultiAnyChildProps } from '@kibalabs/core-react';
import { ethers } from 'ethers';

import { MdtpClient } from './client';
import { ChainId } from './util/chainUtil';


export interface Globals {
  requester: Requester;
  localStorageClient: LocalStorageClient;
  contract: ethers.Contract | null;
  apiClient: MdtpClient;
  network: string;
  chainId: ChainId;
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
