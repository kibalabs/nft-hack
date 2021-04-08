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
