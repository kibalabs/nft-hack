import { useDeepCompareEffect } from "@kibalabs/core-react";
import React from "react";

import { useGlobals } from "../globalsContext";

export const useOwnerIds = (tokenIds: number[]): Map<number, string> | undefined | null => {
  const { contract } = useGlobals();
  const [chainOwnerIds, setChainOwnerIds] = React.useState<Map<number, string> | null | undefined>(undefined);

  useDeepCompareEffect((): void => {
    console.log('useOwnerIds changed', contract, tokenIds);
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
    Promise.all(chainOwnerIdPromises).then((retrievedChainOwnerIds: string[]): void => {
      const calculatedChainOwnerIds = tokenIds.reduce((accumulator: Map<number, string>, internalTokenId: number, index: number): Map<number, string> => {
        accumulator.set(internalTokenId, retrievedChainOwnerIds[index] as string);
        return accumulator;
      }, new Map<number, string>());
      setChainOwnerIds(calculatedChainOwnerIds);
    });
  }, [contract, tokenIds]);

  return chainOwnerIds;
}
