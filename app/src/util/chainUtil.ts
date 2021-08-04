
import { ContractInterface } from 'ethers';

import contract1 from '../contract1.json';
import contract2 from '../contract2.json';
import contract3 from '../contract3.json';

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

const defaultChainId = ChainId.Rinkeby;

const validChainIdNetworkMap: Record<number, string> = {
  [ChainId.Rinkeby]: window.KRT_NEW_CONTRACT ? 'rinkeby3' : 'rinkeby2',
  [ChainId.Mainnet]: 'mainnet',
};

const networkContractAddressMap: Record<string, string | null> = {
  rinkeby: '0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3',
  rinkeby2: '0xeDa9C05612579ff3888C5dCd689566406Df54e01',
  rinkeby3: '0x19559Ac1471e2e4887d63c9363C85BF9f85Fdb67',
  mainnet: null,
};

const networkContractMap: Record<string, ContractInterface | null> = {
  rinkeby: contract1 as unknown as ContractInterface,
  rinkeby2: contract2 as unknown as ContractInterface,
  rinkeby3: contract3 as unknown as ContractInterface,
  mainnet: null,
};

export const getNetwork = (chainId: ChainId): string | null => {
  return validChainIdNetworkMap[chainId] || validChainIdNetworkMap[defaultChainId];
};

export const getContractAddress = (network: string): string | null => {
  return networkContractAddressMap[network];
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
  if (network === 'mainnet') {
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
  if (network === 'mainnet') {
    return `https://etherscan.io/token/${contractAddress}?a=${tokenId}`;
  }
  return null;
};

export const getTransactionEtherscanUrl = (network: string, transactionHash: string): string | null => {
  if (network.startsWith('rinkeby')) {
    return `https://rinkeby.etherscan.io/tx/${transactionHash}`;
  }
  if (network === 'mainnet') {
    return `https://etherscan.io/tx/${transactionHash}`;
  }
  return null;
};

export const getAccountEtherscanUrl = (network: string, account: string): string | null => {
  if (network.startsWith('rinkeby')) {
    return `https://rinkeby.etherscan.io/address/${account}`;
  }
  if (network === 'mainnet') {
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
  // if (network === 'mainnet') {
  //   return `https://etherscan.io/address/${account}`;
  // }
  return null;
};
