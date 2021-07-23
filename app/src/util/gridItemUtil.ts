import { GridItem, TokenMetadata } from '../client';
import { Point } from './pointUtil';

export const gridItemToTokenMetadata = (gridItem: GridItem): TokenMetadata => {
  return new TokenMetadata(String(gridItem.tokenId), gridItem.tokenId - 1, gridItem.title, gridItem.description, gridItem.resizableImageUrl || gridItem.imageUrl, gridItem.url, gridItem.blockId);
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
