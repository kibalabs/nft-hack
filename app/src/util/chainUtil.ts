
import { ContractInterface } from 'ethers';

import contract1 from '../contract1.json';
import contract2 from '../contract2.json';
import contract3 from '../contract3.json';
import contract4 from '../contract4.json';
import contract5 from '../contract5.json';
import contract6 from '../contract6.json';
import contract7 from '../contract7.json';

export const NON_OWNER = '0x0000000000000000000000000000000000000000';

declare global {
  export interface Window {
    KRT_NEW_CONTRACT?: string;
  }
}

export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
  Mumbai = 80001,
}

export const DEFAULT_CHAIN_ID = ChainId.Rinkeby;

const validChainIdNetworkMap: Record<number, string | undefined> = {
  // [ChainId.Rinkeby]: window.KRT_NEW_CONTRACT ? 'rinkeby6' : 'rinkeby5',
  [ChainId.Mainnet]: 'mainnet1',
};

const networkContractAddressMap: Record<string, string | null> = {
  rinkeby: '0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3',
  rinkeby2: '0xeDa9C05612579ff3888C5dCd689566406Df54e01',
  rinkeby3: '0x19559Ac1471e2e4887d63c9363C85BF9f85Fdb67',
  rinkeby4: '0x9B84318C9aC64F564eEc4a703f2dbb742a4D1401',
  rinkeby5: '0xaE70a9accF2E0c16b380C0aa3060E9fBa6718daf',
  rinkeby6: '0x8f1F643637046c867675Ca101ce28E2763daC1E2',
  mainnet1: '0x1Cf33F4c6C4E6391F4D2B445aa3a36639b77dd68',
};

const networkContractMap: Record<string, ContractInterface | null> = {
  rinkeby: contract1 as unknown as ContractInterface,
  rinkeby2: contract2 as unknown as ContractInterface,
  rinkeby3: contract3 as unknown as ContractInterface,
  rinkeby4: contract4 as unknown as ContractInterface,
  rinkeby5: contract5 as unknown as ContractInterface,
  rinkeby6: contract6 as unknown as ContractInterface,
  mainnet1: contract7 as unknown as ContractInterface,
};

export const getNetwork = (chainId: ChainId): string | null => {
  return validChainIdNetworkMap[chainId] || null;
};

export const getContractAddress = (network: string): string | null => {
  return networkContractAddressMap[network] || null;
};

export const getContractJson = (network: string): ContractInterface | null => {
  return networkContractMap[network] || null;
};

export const isValidChain = (chainId: ChainId): boolean => {
  return validChainIdNetworkMap[chainId] !== undefined;
};

export const getTokenOpenseaUrl = (network: string, tokenId: string): string | null => {
  const contractAddress = getContractAddress(network);
  if (!contractAddress) {
    return null;
  }
  if (network.startsWith('rinkeby')) {
    return `https://testnets.opensea.io/assets/${contractAddress}/${tokenId}`;
  }
  if (network.startsWith('mainnet')) {
    return `https://opensea.io/assets/${contractAddress}/${tokenId}`;
  }
  return null;
};

export const getTokenEtherscanUrl = (network: string, tokenId: string): string | null => {
  const contractAddress = getContractAddress(network);
  if (!contractAddress) {
    return null;
  }
  if (network.startsWith('rinkeby')) {
    return `https://rinkeby.etherscan.io/token/${contractAddress}?a=${tokenId}`;
  }
  if (network.startsWith('mainnet')) {
    return `https://etherscan.io/token/${contractAddress}?a=${tokenId}`;
  }
  return null;
};

export const getTransactionEtherscanUrl = (network: string, transactionHash: string): string | null => {
  if (network.startsWith('rinkeby')) {
    return `https://rinkeby.etherscan.io/tx/${transactionHash}`;
  }
  if (network.startsWith('mainnet')) {
    return `https://etherscan.io/tx/${transactionHash}`;
  }
  return null;
};

export const getAccountEtherscanUrl = (network: string, account: string): string | null => {
  if (network.startsWith('rinkeby')) {
    return `https://rinkeby.etherscan.io/address/${account}`;
  }
  if (network.startsWith('mainnet')) {
    return `https://etherscan.io/address/${account}`;
  }
  return null;
};

export const getProductOpenseaUrl = (network: string): string | null => {
  if (network === 'rinkeby') {
    return 'https://testnets.opensea.io/collection/mdtp-test-2';
  }
  if (network === 'rinkeby2') {
    return 'https://testnets.opensea.io/collection/milliondollartokenpage-v2';
  }
  if (network === 'rinkeby3') {
    return 'https://testnets.opensea.io/collection/milliondollartokenpage3';
  }
  if (network === 'rinkeby4') {
    return 'https://testnets.opensea.io/collection/milliondollartokenpage4';
  }
  if (network === 'rinkeby5') {
    return 'https://testnets.opensea.io/collection/milliondollartokenpage-tyvw2ocd5n';
  }
  if (network === 'mainnet1') {
    return 'https://opensea.io/collection/milliondollartokenpage';
  }
  return null;
};
