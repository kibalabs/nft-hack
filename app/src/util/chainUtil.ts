
export enum ChainId {
  Mainnet = 1,
  Ropsten = 3,
  Rinkeby = 4,
  Goerli = 5,
  Kovan = 42,
  Mumbai = 80001,
}

const validChainIdNetworkMap: Record<number, string> = {
  [ChainId.Rinkeby]: 'rinkeby',
  // [ChainId.Rinkeby]: 'rinkeby2',
  // [ChainId.Mumbai]: 'mumbai',
};

export const getNetwork = (chainId: ChainId): string | null => {
  return validChainIdNetworkMap[chainId] || validChainIdNetworkMap[ChainId.Rinkeby];
};

export const isValidChain = (chainId: ChainId): boolean => {
  return validChainIdNetworkMap[chainId] !== undefined;
};
