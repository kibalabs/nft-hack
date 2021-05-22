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
      tokenId: this.tokenId,
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

export class ListStatItemsRequest extends RequestData {
  public toObject = (): Record<string, unknown> => {
    return {
    };
  }
}

export class ListStatItemsResponse extends ResponseData {
  readonly statItems: Resources.StatItem[];

  public constructor(statItems: Resources.StatItem[]) {
    super();
    this.statItems = statItems;
  }

  public static fromObject = (obj: Record<string, unknown>): ListStatItemsResponse => {
    return new ListStatItemsResponse(
      (obj.statItems as Record<string, unknown>[]).map((entry: Record<string, unknown>): Resources.StatItem => Resources.StatItem.fromObject(entry)),
    );
  }
}

export class GenerateImageUploadForTokenRequest extends RequestData {
  public toObject = (): Record<string, unknown> => {
    return {
    };
  }
}

export class GenerateImageUploadForTokenResponse extends ResponseData {
  readonly presignedUpload: Resources.PresignedUpload;

  public constructor(presignedUpload: Resources.PresignedUpload) {
    super();
    this.presignedUpload = presignedUpload;
  }

  public static fromObject = (obj: Record<string, unknown>): GenerateImageUploadForTokenResponse => {
    return new GenerateImageUploadForTokenResponse(
      Resources.PresignedUpload.fromObject(obj.presignedUpload as Record<string, unknown>),
    );
  }
}

export class UploadMetadataForTokenRequest extends RequestData {
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;

  public constructor(name: string, description: string, imageUrl: string) {
    super();
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
  }

  public toObject = (): Record<string, unknown> => {
    return {
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
    };
  }
}

export class UploadMetadataForTokenResponse extends ResponseData {
  readonly url: string;

  public constructor(url: string) {
    super();
    this.url = url;
  }

  public static fromObject = (obj: Record<string, unknown>): UploadMetadataForTokenResponse => {
    return new UploadMetadataForTokenResponse(
      String(obj.url),
    );
  }
}

export class UpdateTokenDeferredRequest extends RequestData {
  public toObject = (): Record<string, unknown> => {
    return {
    };
  }
}

export class UpdateTokenDeferredResponse extends ResponseData {
  public static fromObject = (): UpdateTokenDeferredResponse => {
    return new UpdateTokenDeferredResponse(
    );
  }
}
