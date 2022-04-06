
import { ContractInterface } from 'ethers';
import { getAddress } from 'ethers/lib/utils';

import contract7 from '../contract7.json';
import contract8 from '../contract8.json';

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

export const DEFAULT_CHAIN_ID = ChainId.Mainnet;

export const isBeta = (): boolean => {
  return typeof window !== 'undefined' && !!window.KRT_NEW_CONTRACT;
};

const validChainIdNetworkMap: Record<number, string | undefined> = {
  [ChainId.Rinkeby]: isBeta() ? 'rinkeby9' : undefined,
  [ChainId.Mainnet]: 'mainnet2',
};

const networkContractAddressMap: Record<string, string | null> = {
  rinkeby6: '0x8f1F643637046c867675Ca101ce28E2763daC1E2',
  mainnet1: '0x1Cf33F4c6C4E6391F4D2B445aa3a36639b77dd68',
  rinkeby9: '0x2B45a10bc643aA057da80a2EF5FF63F0C20F5ac0',
  mainnet2: '0x8e720f90014fa4de02627f4a4e217b7e3942d5e8',
};

const networkContractMap: Record<string, ContractInterface | null> = {
  rinkeby6: contract7 as unknown as ContractInterface,
  mainnet1: contract7 as unknown as ContractInterface,
  rinkeby9: contract8 as unknown as ContractInterface,
  mainnet2: contract8 as unknown as ContractInterface,
};

export const getMigrationNetwork = (network: string): string | null => {
  if (network === 'rinkeby7') {
    return 'rinkeby6';
  }
  if (network === 'rinkeby9') {
    return 'rinkeby6';
  }
  if (network === 'mainnet2') {
    return 'mainnet1';
  }
  return null;
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

export const getTokenOpenseaUrl = (network: string, tokenId: number, isSetForMigration: boolean): string | null => {
  const contractAddress = getContractAddress(isSetForMigration ? getMigrationNetwork(network) as string : network);
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

export const getTokenEtherscanUrl = (network: string, tokenId: number, isSetForMigration: boolean): string | null => {
  const contractAddress = getContractAddress(isSetForMigration ? getMigrationNetwork(network) as string : network);
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
  if (network === 'rinkeby6') {
    return 'https://testnets.opensea.io/collection/milliondollartokenpage-sgxa7mknyi';
  }
  if (network === 'mainnet1') {
    return 'https://opensea.io/collection/milliondollartokenpage';
  }
  return null;
};

export const normalizeAddress = (address: string): string | null => {
  try {
    return getAddress(address);
  } catch {
    return null;
  }
};
