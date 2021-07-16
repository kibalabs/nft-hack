
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
  [ChainId.Mainnet]: 'mainnet',
};

const networkContractAddressMap: Record<string, string | null> = {
  rinkeby: '0x2744fE5e7776BCA0AF1CDEAF3bA3d1F5cae515d3',
  rinkeby2: '0xeDa9C05612579ff3888C5dCd689566406Df54e01',
  mainnet: null,
};

const defaultChainId = ChainId.Rinkeby;

export const getNetwork = (chainId: ChainId): string | null => {
  return validChainIdNetworkMap[chainId] || validChainIdNetworkMap[defaultChainId];
};

export const getContractAddress = (network: string): string | null => {
  return networkContractAddressMap[network];
};

export const isValidChain = (chainId: ChainId): boolean => {
  return validChainIdNetworkMap[chainId] !== undefined;
};

export const getTokenOpenseaUrl = (network: string, tokenId: string): string | null => {
  const contractAddress = getContractAddress(network);
  if (!contractAddress) {
    return null;
  }
  if (network === 'rinkeby') {
    return `https://testnets.opensea.io/assets/${contractAddress}/${tokenId}`;
  }
  if (network === 'mainnet') {
    return `https://opensea.io/assets/${contractAddress}/${tokenId}`;
  }
}

export const getTokenEtherscanUrl = (network: string, tokenId: string): string | null => {
  const contractAddress = getContractAddress(network);
  if (!contractAddress) {
    return null;
  }
  if (network === 'rinkeby') {
    return `https://rinkeby.etherscan.io/token/${contractAddress}?a=${tokenId}`;
  }
  if (network === 'mainnet') {
    return `https://etherscan.io/token/${contractAddress}?a=${tokenId}`;
  }
}
