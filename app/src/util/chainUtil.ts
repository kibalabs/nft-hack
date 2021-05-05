
export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
  Mumbai = 80001,
}

const chainIdNetworkMap: Record<ChainId, string> = {
  [ChainId.Rinkeby]: 'rinkeby',
  [ChainId.Mumbai]: 'mumbai',
};

export const getNetwork = (chainId: ChainId): string | null => {
  return chainIdNetworkMap[chainId] || 'rinkeby';
};

export const isValidChain = (chainId: ChainId): boolean => {
  return chainIdNetworkMap[chainId] !== undefined;
};
