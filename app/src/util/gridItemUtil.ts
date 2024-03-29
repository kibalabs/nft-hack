import { Point } from '@kibalabs/core-react';

import { GridItem, TokenMetadata } from '../client';

export const gridItemToTokenMetadata = (gridItem: GridItem): TokenMetadata => {
  return new TokenMetadata(String(gridItem.tokenId), gridItem.tokenId - 1, gridItem.title, gridItem.description, gridItem.resizableImageUrl || gridItem.imageUrl, gridItem.url, gridItem.groupId);
};

export const getPointFromGridItem = (gridItem: GridItem): Point => {
  const tokenIndex = gridItem.tokenId - 1;
  const x = tokenIndex % 100;
  const y = Math.floor(tokenIndex / 100);
  return { x, y };
};

export const getTokenIdFromPoint = (point: Point): number => {
  return point.y * 100 + point.x + 1;
};

export const getTokenIds = (tokenId: number, width: number, height: number): number[] => {
  const tokenIds = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      tokenIds.push(tokenId + (y * 100) + x);
    }
  }
  return tokenIds;
};

export const isUpdated = (gridItem: GridItem): boolean => {
  const isValidName = gridItem.title && !gridItem.title.startsWith('MDTP Token');
  const isValidDescription = gridItem.description && !gridItem.description.startsWith('This NFT gives you full ownership');
  return Boolean(isValidName) || Boolean(isValidDescription);
};
