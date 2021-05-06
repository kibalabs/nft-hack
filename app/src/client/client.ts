import { Requester, RestMethod, ServiceClient } from '@kibalabs/core';

import * as Endpoints from './endpoints';
import * as Resources from './resources';

export class MdtpClient extends ServiceClient {
  public constructor(requester: Requester, baseUrl?: string) {
    super(requester, baseUrl || 'https://mdtp-api.kibalabs.com');
  }

  public listGridItems = async (network: string): Promise<Resources.GridItem[]> => {
    const method = RestMethod.GET;
    const path = `v1/networks/${network}/grid-items`;
    const request = new Endpoints.ListGridItemsRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.ListGridItemsResponse);
    return response.gridItems;
  }

  public retrieveGridItem = async (network: string, tokenId: number): Promise<Resources.GridItem> => {
    const method = RestMethod.POST;
    const path = `v1/networks/${network}/retrieve-grid-item`;
    const request = new Endpoints.RetrieveGridItemRequest(tokenId);
    const response = await this.makeRequest(method, path, request, Endpoints.RetrieveGridItemResponse);
    return response.gridItem;
  }

  public listStatItems = async (network: string): Promise<Resources.StatItem[]> => {
    const method = RestMethod.GET;
    const path = `v1/networks/${network}/stat-items`;
    const request = new Endpoints.ListStatItemsRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.ListStatItemsResponse);
    return response.statItems;
  }

  public generateImageUploadForToken = async (network: string, tokenId: number): Promise<Resources.PresignedUpload> => {
    const method = RestMethod.POST;
    const path = `v1/networks/${network}/tokens/${tokenId}/generate-image-upload`;
    const request = new Endpoints.GenerateImageUploadForSiteVersionRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.GenerateImageUploadForSiteVersionResponse);
    return response.presignedUpload;
  }
}
