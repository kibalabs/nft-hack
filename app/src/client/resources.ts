import { dateFromString } from '@kibalabs/core';

export type RawObject = Record<string, unknown>;

export class TokenMetadata {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    readonly tokenId: string,
    readonly tokenIndex: number,
    readonly name: string,
    readonly description: string | null,
    readonly image: string,
    readonly url: string | null,
    readonly groupId: string | null,
    // eslint-disable-next-line no-empty-function
  ) {}

  public static fromObject = (obj: Record<string, unknown>): TokenMetadata => {
    return new TokenMetadata(
      String(obj.tokenId),
      Number(obj.tokenIndex),
      String(obj.name),
      obj.description ? String(obj.description) : null,
      String(obj.image),
      obj.url ? String(obj.url) : null,
      obj.groupId ? String(obj.groupId) : null,
    );
  };
}

export class GridItem {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    readonly gridItemId: number,
    readonly updatedDate: Date,
    readonly tokenId: number,
    readonly network: string,
    readonly contentUrl: string,
    readonly title: string,
    readonly description: string | null,
    readonly imageUrl: string,
    readonly resizableImageUrl: string | null,
    readonly ownerId: string,
    readonly url: string | null,
    readonly groupId: string | null,
    readonly blockNumber: number,
    readonly source: string,
    // eslint-disable-next-line no-empty-function
  ) {}

  public static fromObject = (obj: Record<string, unknown>): GridItem => {
    return new GridItem(
      Number(obj.gridItemId),
      dateFromString(obj.updatedDate as string),
      Number(obj.tokenId),
      String(obj.network),
      String(obj.contentUrl),
      String(obj.title),
      obj.description ? String(obj.description) : null,
      String(obj.imageUrl),
      obj.resizableImageUrl ? String(obj.resizableImageUrl) : null,
      String(obj.ownerId),
      obj.url ? String(obj.url) : null,
      obj.groupId ? String(obj.groupId) : null,
      Number(obj.blockNumber),
      String(obj.source),
    );
  };
}

export class NetworkSummary {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    readonly marketCapitalization: number,
    readonly totalSales: number,
    readonly averagePrice: number,
    // eslint-disable-next-line no-empty-function
  ) {}

  public static fromObject = (obj: Record<string, unknown>): NetworkSummary => {
    return new NetworkSummary(
      Number(obj.marketCapitalization),
      Number(obj.totalSales),
      Number(obj.averagePrice),
    );
  };
}

export class NetworkStatus {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    readonly mintCount: number,
    readonly mintLimit: number,
    readonly randomAvailableTokenId: number | null,
    // eslint-disable-next-line no-empty-function
  ) {}

  public static fromObject = (obj: Record<string, unknown>): NetworkStatus => {
    return new NetworkStatus(
      Number(obj.mintCount),
      Number(obj.mintLimit),
      obj.randomAvailableTokenId ? Number(obj.randomAvailableTokenId) : null,
    );
  };
}

export class PresignedUpload {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    readonly url: string,
    readonly params: Record<string, string>,
    // eslint-disable-next-line no-empty-function
  ) {}

  public static fromObject = (obj: Record<string, unknown>): PresignedUpload => {
    return new PresignedUpload(
      String(obj.url),
      obj.params as Record<string, string>,
    );
  };
}

export class BaseImage {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    readonly baseImageId: number,
    readonly network: string,
    readonly url: string,
    readonly generatedDate: Date,
    // eslint-disable-next-line no-empty-function
  ) {}

  public static fromObject = (obj: Record<string, unknown>): BaseImage => {
    return new BaseImage(
      Number(obj.baseImageId),
      String(obj.network),
      String(obj.url),
      dateFromString(obj.generatedDate as string),
    );
  };
}
