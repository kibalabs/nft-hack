import React from 'react';

import { Log } from '@ethersproject/abstract-provider';
import { KibaResponse, RestMethod } from '@kibalabs/core';

import { GridItem, TokenMetadata } from '../client';
import { useGlobals } from '../globalsContext';
import { gridItemToTokenMetadata } from './gridItemUtil';

interface TokenData {
  tokenMetadata: TokenMetadata | null | undefined;
  gridItem: GridItem | null | undefined;
  chainGridItem: GridItem | null | undefined;
  isSetForMigration: boolean | null | undefined;
}

export const useTokenData = (tokenId: number): TokenData => {
  const { contract, apiClient, requester, network, web3 } = useGlobals();
  const [gridItem, setGridItem] = React.useState<GridItem | null | undefined>(undefined);
  const [chainGridItem, setChainGridItem] = React.useState<GridItem | null | undefined>(undefined);
  const [isSetForMigration, setIsSetForMigration] = React.useState<boolean | null | undefined>(undefined);

  const loadToken = React.useCallback(async (): Promise<void> => {
    if (network === null) {
      setGridItem(null);
      return;
    }
    setGridItem(undefined);
    if (network === undefined) {
      return;
    }
    apiClient.retrieveGridItem(network, tokenId).then((retrievedGridItem: GridItem): void => {
      setGridItem(retrievedGridItem);
    });
  }, [tokenId, network, apiClient]);

  const loadTokenChainData = React.useCallback(async (): Promise<void> => {
    if (network === null || web3 === null || contract === null) {
      setChainGridItem(null);
      return;
    }
    setChainGridItem(undefined);
    if (network === undefined || web3 === undefined || contract === undefined) {
      return;
    }
    if (contract) {
      contract.tokenContentURI(tokenId).then((tokenMetadataUrl: string): void => {
        const url = tokenMetadataUrl.startsWith('ipfs://') ? tokenMetadataUrl.replace('ipfs://', 'https://ipfs.infura.io/ipfs/') : tokenMetadataUrl;
        requester.makeRequest(RestMethod.GET, url).then((response: KibaResponse): void => {
          const filter = contract.filters.TokenContentURIChanged(tokenId);
          web3.getLogs({ address: filter.address, topics: filter.topics, fromBlock: 0 }).then((logs: Log[]): void => {
            const blockNumber = logs.length > 0 ? logs[logs.length - 1].blockNumber : 0;
            const tokenContentJson = JSON.parse(response.content);
            // NOTE(krishan711): this should validate the content cos if someone hasn't filled it correctly it could cause something bad
            setChainGridItem(new GridItem(-1, new Date(), tokenId, network, tokenMetadataUrl, tokenContentJson.name, tokenContentJson.description, tokenContentJson.image, null, '', tokenContentJson.url, tokenContentJson.groupId, blockNumber, 'onchain'));
          });
        });
      });
      if (contract.isTokenSetForMigration) {
        contract.isTokenSetForMigration(tokenId).then((value: boolean): void => {
          setIsSetForMigration(value);
        });
      } else {
        setIsSetForMigration(false);
      }
    } else {
      setIsSetForMigration(null);
    }
  }, [tokenId, network, contract, requester, web3]);

  React.useEffect((): void => {
    loadToken();
  }, [loadToken]);

  React.useEffect((): void => {
    loadTokenChainData();
  }, [loadTokenChainData]);


  const tokenMetadata = React.useMemo((): TokenMetadata | undefined | null => {
    if (gridItem === undefined || chainGridItem === undefined) {
      return undefined;
    }
    if (gridItem && chainGridItem) {
      if (gridItem.blockNumber >= chainGridItem.blockNumber) {
        return gridItemToTokenMetadata(gridItem);
      }
      return gridItemToTokenMetadata(chainGridItem);
    }
    if (!gridItem && chainGridItem) {
      return gridItemToTokenMetadata(chainGridItem);
    }
    if (!chainGridItem && gridItem) {
      return gridItemToTokenMetadata(gridItem);
    }
    if (gridItem === null) {
      return null;
    }
    return undefined;
  }, [gridItem, chainGridItem]);

  return { tokenMetadata, gridItem, chainGridItem, isSetForMigration };
};
