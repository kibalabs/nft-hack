import React from 'react';

import { LocalStorageClient, Requester } from '@kibalabs/core';
import { IMultiAnyChildProps } from '@kibalabs/core-react';
import { ethers } from 'ethers';
// @ts-ignore
import { Web3Storage } from 'web3.storage/dist/bundle.esm.min.js';

import { MdtpClient } from './client';
import { ChainId } from './util/chainUtil';


export interface Globals {
  requester: Requester;
  localStorageClient: LocalStorageClient;
  apiClient: MdtpClient;
  web3StorageClient: Web3Storage;
  network: string | null | undefined;
  contract: ethers.Contract | null | undefined;
  web3: ethers.providers.Web3Provider | null | undefined;
  chainId: ChainId | null | undefined;
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
