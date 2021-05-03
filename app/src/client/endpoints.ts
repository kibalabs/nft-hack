import { RequestData, ResponseData } from '@kibalabs/core';

import * as Resources from './resources';

export class ListGridItemsRequest extends RequestData {
  public toObject = (): Record<string, unknown> => {
    return {
    };
  }
}

export class ListGridItemsResponse extends ResponseData {
  readonly gridItems: Resources.GridItem[];

  public constructor(gridItems: Resources.GridItem[]) {
    super();
    this.gridItems = gridItems;
  }

  public static fromObject = (obj: Record<string, unknown>): ListGridItemsResponse => {
    return new ListGridItemsResponse(
      (obj.gridItems as Record<string, unknown>[]).map((entry: Record<string, unknown>): Resources.GridItem => Resources.GridItem.fromObject(entry)),
    );
  }
}

export class RetrieveGridItemRequest extends RequestData {
  readonly tokenId: number;

  public constructor(tokenId: number) {
    super();
    this.tokenId = tokenId;
  }

  public toObject = (): Record<string, unknown> => {
    return {
      tokenId: this.tokenId
    };
  }
}

export class RetrieveGridItemResponse extends ResponseData {
  readonly gridItem: Resources.GridItem;

  public constructor(gridItem: Resources.GridItem) {
    super();
    this.gridItem = gridItem;
  }

  public static fromObject = (obj: Record<string, unknown>): RetrieveGridItemResponse => {
    return new RetrieveGridItemResponse(
      Resources.GridItem.fromObject(obj.gridItem as Record<string, unknown>),
    );
  }
}

export class GenerateImageUploadForSiteVersionRequest extends RequestData {
  public toObject = (): Record<string, unknown> => {
    return {
    };
  }
}

export class GenerateImageUploadForSiteVersionResponse extends ResponseData {
  readonly presignedUpload: Resources.PresignedUpload;

  public constructor(presignedUpload: Resources.PresignedUpload) {
    super();
    this.presignedUpload = presignedUpload;
  }

  public static fromObject = (obj: Record<string, unknown>): GenerateImageUploadForSiteVersionResponse => {
    return new GenerateImageUploadForSiteVersionResponse(
      Resources.PresignedUpload.fromObject(obj.presignedUpload as Record<string, unknown>),
    );
  }
}
