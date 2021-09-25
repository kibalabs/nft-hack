import React from 'react';

import { useDeepCompareCallback } from '@kibalabs/core-react';

import { useGlobals } from '../globalsContext';

export const useOwnerIds = (tokenIds: number[]): Map<number, string | null> | undefined | null => {
  const { contract } = useGlobals();
  const [chainOwnerIds, setChainOwnerIds] = React.useState<Map<number, string | null> | undefined | null>(undefined);

  const loadOwners = useDeepCompareCallback((): void => {
    setChainOwnerIds(undefined);
    if (contract === null) {
      setChainOwnerIds(null);
      return;
    }
    setChainOwnerIds(undefined);
    if (contract === undefined) {
      return;
    }
    const chainOwnerIdPromises = tokenIds.map(async (internalTokenId: number): Promise<string | null> => {
      try {
        return await contract.ownerOf(internalTokenId);
      } catch (error: unknown) {
        if (!(error as Error).message.includes('nonexistent token')) {
          console.error(error);
        }
        return null;
      }
    });
    Promise.all(chainOwnerIdPromises).then((retrievedChainOwnerIds: (string | null)[]): void => {
      const calculatedChainOwnerIds = tokenIds.reduce((accumulator: Map<number, string | null>, internalTokenId: number, index: number): Map<number, string | null> => {
        accumulator.set(internalTokenId, retrievedChainOwnerIds[index]);
        return accumulator;
      }, new Map<number, string>());
      setChainOwnerIds(calculatedChainOwnerIds);
    });
  }, [contract, tokenIds]);

  React.useEffect((): void => {
    loadOwners();
  }, [loadOwners]);

  return chainOwnerIds;
};
