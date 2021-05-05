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
