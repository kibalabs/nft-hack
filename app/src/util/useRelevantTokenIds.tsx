import React from "react";

export const useRelevantTokenIds = (tokenId: number, width: number, height: number): number[] => {
  return React.useMemo((): number[] => {
    const tokenIds = [];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        tokenIds.push(tokenId + (y * 100) + x);
      }
    }
    return tokenIds;
  }, [tokenId, height, width]);
}
