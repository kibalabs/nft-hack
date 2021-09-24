import { useOwnerIds } from "./useOwnerIds";


export const useOwnerId = (tokenId: number): string | undefined | null => {
  const ownerIds = useOwnerIds([tokenId]);
  if (ownerIds === undefined) {
    return undefined;
  }
  if (ownerIds === null) {
    return null;
  }
  return ownerIds.get(tokenId);
}
