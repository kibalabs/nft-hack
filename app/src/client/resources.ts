import { dateFromString } from '@kibalabs/core';

export class GridItem {
  // eslint-disable-next-line no-useless-constructor
  public constructor(
    readonly gridItemId: number,
    readonly updatedDate: Date,
    readonly tokenId: number,
    readonly network: string,
    readonly title: string,
    readonly description: string | null,
    readonly imageUrl: string,
    readonly resizableImageUrl: string | null,
    readonly ownerId: string,
    // eslint-disable-next-line no-empty-function
  ) {}

  public static fromObject = (obj: Record<string, unknown>): GridItem => {
    return new GridItem(
      Number(obj.gridItemId),
      dateFromString(obj.updatedDate as string),
      Number(obj.tokenId),
      String(obj.network),
      String(obj.title),
      obj.description ? String(obj.description) : null,
      String(obj.imageUrl),
      obj.resizableImageUrl ? String(obj.resizableImageUrl) : null,
      String(obj.ownerId),
    );
  }
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
  }
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
  }
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
  }
}
