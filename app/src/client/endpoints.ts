import { dateToString, RequestData, ResponseData } from '@kibalabs/core';

import * as Resources from './resources';

export class GetLatestBaseImageRequest extends RequestData {
  public toObject = (): Resources.RawObject => {
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

  public static fromObject = (obj: Resources.RawObject): GetLatestBaseImageResponse => {
    return new GetLatestBaseImageResponse(
      Resources.BaseImage.fromObject(obj.baseImage as Resources.RawObject),
    );
  }
}

export class ListGridItemsRequest extends RequestData {
  public constructor(
    readonly shouldCompact: boolean,
    readonly ownerId?: string,
    readonly updatedSinceDate?: Date,
    readonly groupId?: string,
  ) {
    super();
  }

  public toObject = (): Resources.RawObject => {
    return {
      shouldCompact: this.shouldCompact,
      ownerId: this.ownerId,
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

  public static fromObject = (obj: Resources.RawObject): ListGridItemsResponse => {
    return new ListGridItemsResponse(
      (obj.gridItems as Resources.RawObject[]).map((entry: Resources.RawObject): Resources.GridItem => Resources.GridItem.fromObject(entry)),
    );
  }
}

export class RetrieveGridItemRequest extends RequestData {
  public constructor(
    readonly tokenId: number,
  ) {
    super();
  }

  public toObject = (): Resources.RawObject => {
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

  public static fromObject = (obj: Resources.RawObject): RetrieveGridItemResponse => {
    return new RetrieveGridItemResponse(
      Resources.GridItem.fromObject(obj.gridItem as Resources.RawObject),
    );
  }
}

export class GetNetworkSummaryRequest extends RequestData {
  public toObject = (): Resources.RawObject => {
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

  public static fromObject = (obj: Resources.RawObject): GetNetworkSummaryResponse => {
    return new GetNetworkSummaryResponse(
      Resources.NetworkSummary.fromObject(obj.networkSummary as Resources.RawObject),
    );
  }
}

export class GetNetworkStatusRequest extends RequestData {
  public toObject = (): Resources.RawObject => {
    return {
    };
  }
}

export class GetNetworkStatusResponse extends ResponseData {
  public constructor(
    readonly networkStatus: Resources.NetworkStatus,
  ) {
    super();
  }

  public static fromObject = (obj: Resources.RawObject): GetNetworkStatusResponse => {
    return new GetNetworkStatusResponse(
      Resources.NetworkStatus.fromObject(obj.networkStatus as Resources.RawObject),
    );
  }
}

export class GenerateImageUploadForTokenRequest extends RequestData {
  public toObject = (): Resources.RawObject => {
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

  public static fromObject = (obj: Resources.RawObject): GenerateImageUploadForTokenResponse => {
    return new GenerateImageUploadForTokenResponse(
      Resources.PresignedUpload.fromObject(obj.presignedUpload as Resources.RawObject),
    );
  }
}

export class UploadMetadataForTokenRequest extends RequestData {
  public constructor(
    readonly shouldUseIpfs: boolean,
    readonly name: string,
    readonly description: string | null,
    readonly imageUrl: string,
    readonly url: string | null,
  ) {
    super();
  }

  public toObject = (): Resources.RawObject => {
    return {
      shouldUseIpfs: this.shouldUseIpfs,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      url: this.url,
    };
  }
}

export class UploadMetadataForTokenResponse extends ResponseData {
  public constructor(
    readonly tokenMetadataUrl: string,
  ) {
    super();
  }

  public static fromObject = (obj: Resources.RawObject): UploadMetadataForTokenResponse => {
    return new UploadMetadataForTokenResponse(
      String(obj.tokenMetadataUrl),
    );
  }
}

export class UploadMetadataForTokenGroupRequest extends RequestData {
  public constructor(
    readonly shouldUseIpfs: boolean,
    readonly width: number,
    readonly height: number,
    readonly name: string,
    readonly description: string | null,
    readonly imageUrl: string,
    readonly url: string | null,
  ) {
    super();
  }

  public toObject = (): Resources.RawObject => {
    return {
      shouldUseIpfs: this.shouldUseIpfs,
      width: this.width,
      height: this.height,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      url: this.url,
    };
  }
}

export class UploadMetadataForTokenGroupResponse extends ResponseData {
  public constructor(
    readonly tokenMetadataUrls: string[],
  ) {
    super();
  }

  public static fromObject = (obj: Resources.RawObject): UploadMetadataForTokenGroupResponse => {
    return new UploadMetadataForTokenGroupResponse(
      (obj.tokenMetadataUrls as Resources.RawObject[]).map((entry: Resources.RawObject): string => String(entry)),
    );
  }
}
export class UpdateOffchainContentsForTokenGroupRequest extends RequestData {
  public constructor(
    readonly width: number,
    readonly height: number,
    readonly blockNumber: number,
    readonly contentUrls: string[],
    readonly signature: string,
    readonly shouldAllowPendingChange: boolean,
  ) {
    super();
  }

  public toObject = (): Resources.RawObject => {
    return {
      width: this.width,
      height: this.height,
      blockNumber: this.blockNumber,
      contentUrls: this.contentUrls,
      signature: this.signature,
      shouldAllowPendingChange: this.shouldAllowPendingChange,
    };
  }
}

export class UpdateOffchainContentsForTokenGroupResponse extends ResponseData {
  public static fromObject = (): UpdateOffchainContentsForTokenGroupResponse => {
    return new UpdateOffchainContentsForTokenGroupResponse();
  }
}

export class UpdateTokenDeferredRequest extends RequestData {
  public toObject = (): Resources.RawObject => {
    return {
    };
  }
}

export class UpdateTokenDeferredResponse extends ResponseData {
  public static fromObject = (): UpdateTokenDeferredResponse => {
    return new UpdateTokenDeferredResponse();
  }
}
