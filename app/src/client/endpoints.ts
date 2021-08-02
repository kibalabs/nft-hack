import { dateToString, RequestData, ResponseData } from '@kibalabs/core';

import * as Resources from './resources';

export class GetLatestBaseImageRequest extends RequestData {
  public toObject = (): Record<string, unknown> => {
    return {
    };
  }
}

export class GetLatestBaseImageResponse extends ResponseData {
  public constructor(
    readonly baseImage: Resources.BaseImage,
  ) {
    super();
  }

  public static fromObject = (obj: Record<string, unknown>): GetLatestBaseImageResponse => {
    return new GetLatestBaseImageResponse(
      Resources.BaseImage.fromObject(obj.baseImage as Record<string, unknown>),
    );
  }
}

export class ListGridItemsRequest extends RequestData {
  public constructor(
    readonly shouldCompact: boolean,
    readonly updatedSinceDate?: Date,
    readonly groupId?: string,
  ) {
    super();
  }

  public toObject = (): Record<string, unknown> => {
    return {
      shouldCompact: this.shouldCompact,
      updatedSinceDate: this.updatedSinceDate ? dateToString(this.updatedSinceDate) : undefined,
      groupId: this.groupId,
    };
  }
}

export class ListGridItemsResponse extends ResponseData {
  public constructor(
    readonly gridItems: Resources.GridItem[],
  ) {
    super();
  }

  public static fromObject = (obj: Record<string, unknown>): ListGridItemsResponse => {
    return new ListGridItemsResponse(
      (obj.gridItems as Record<string, unknown>[]).map((entry: Record<string, unknown>): Resources.GridItem => Resources.GridItem.fromObject(entry)),
    );
  }
}

export class RetrieveGridItemRequest extends RequestData {
  public constructor(
    readonly tokenId: number,
  ) {
    super();
  }

  public toObject = (): Record<string, unknown> => {
    return {
      tokenId: this.tokenId,
    };
  }
}

export class RetrieveGridItemResponse extends ResponseData {
  public constructor(
    readonly gridItem: Resources.GridItem,
  ) {
    super();
  }

  public static fromObject = (obj: Record<string, unknown>): RetrieveGridItemResponse => {
    return new RetrieveGridItemResponse(
      Resources.GridItem.fromObject(obj.gridItem as Record<string, unknown>),
    );
  }
}

export class GetNetworkSummaryRequest extends RequestData {
  public toObject = (): Record<string, unknown> => {
    return {
    };
  }
}

export class GetNetworkSummaryResponse extends ResponseData {
  public constructor(
    readonly networkSummary: Resources.NetworkSummary,
  ) {
    super();
  }

  public static fromObject = (obj: Record<string, unknown>): GetNetworkSummaryResponse => {
    return new GetNetworkSummaryResponse(
      Resources.NetworkSummary.fromObject(obj.networkSummary as Record<string, unknown>),
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
  public constructor(
    readonly presignedUpload: Resources.PresignedUpload,
  ) {
    super();
  }

  public static fromObject = (obj: Record<string, unknown>): GenerateImageUploadForTokenResponse => {
    return new GenerateImageUploadForTokenResponse(
      Resources.PresignedUpload.fromObject(obj.presignedUpload as Record<string, unknown>),
    );
  }
}

export class UploadMetadataForTokenRequest extends RequestData {
  public constructor(
    readonly name: string,
    readonly description: string | null,
    readonly imageUrl: string,
    readonly url: string | null,
    readonly groupId: string | null,
  ) {
    super();
  }

  public toObject = (): Record<string, unknown> => {
    return {
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      url: this.url,
      groupId: this.groupId,
    };
  }
}

export class UploadMetadataForTokenResponse extends ResponseData {
  public constructor(
    readonly url: string,
  ) {
    super();
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
