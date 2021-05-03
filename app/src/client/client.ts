import { Requester, RestMethod, ServiceClient } from '@kibalabs/core';

import * as Endpoints from './endpoints';
import * as Resources from './resources';

export class MdtpClient extends ServiceClient {
  public constructor(requester: Requester, baseUrl?: string) {
    super(requester, baseUrl || 'https://mdtp-api.kibalabs.com');
  }

  public listGridItems = async (): Promise<Resources.GridItem[]> => {
    const method = RestMethod.GET;
    const path = 'v1/grid-items';
    const request = new Endpoints.ListGridItemsRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.ListGridItemsResponse);
    return response.gridItems;
  }

  public retrieveGridItem = async (tokenId: number): Promise<Resources.GridItem> => {
    const method = RestMethod.POST;
    const path = 'v1/retrieve-grid-item';
    const request = new Endpoints.RetrieveGridItemRequest(tokenId);
    const response = await this.makeRequest(method, path, request, Endpoints.RetrieveGridItemResponse);
    return response.gridItem;
  }

  public generateImageUploadForToken = async (tokenId: number): Promise<Resources.PresignedUpload> => {
    const method = RestMethod.POST;
    const path = `v1/tokens/${tokenId}/generate-image-upload`;
    const request = new Endpoints.GenerateImageUploadForSiteVersionRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.GenerateImageUploadForSiteVersionResponse);
    return response.presignedUpload;
  }
}
