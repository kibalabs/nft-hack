import { Requester, RestMethod, ServiceClient } from '@kibalabs/core';

import * as Endpoints from './endpoints';
import * as Resources from './resources';

export class MdtpClient extends ServiceClient {
  public constructor(requester: Requester, baseUrl?: string) {
    super(requester, baseUrl || 'https://d2a7i2107hou45.cloudfront.net');
  }

  public getTokenDefaultContent = async (tokenId: number): Promise<Resources.TokenMetadata> => {
    const method = RestMethod.GET;
    const path = `token-default-contents/${tokenId}`;
    const request = undefined;
    const response = await this.makeRequest(method, path, request, Resources.TokenMetadata);
    return response;
  }

  public getLatestBaseImage = async (network: string): Promise<Resources.BaseImage> => {
    const method = RestMethod.GET;
    const path = `v1/networks/${network}/latest-base-image`;
    const request = new Endpoints.GetLatestBaseImageRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.GetLatestBaseImageResponse);
    return response.baseImage;
  }

  public listGridItems = async (network: string, shouldCompact = false, updatedSinceDate?: Date, groupId?: string): Promise<Resources.GridItem[]> => {
    const method = RestMethod.GET;
    const path = `v1/networks/${network}/grid-items`;
    const request = new Endpoints.ListGridItemsRequest(shouldCompact, updatedSinceDate, groupId);
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

  public getNetworkSummary = async (network: string): Promise<Resources.NetworkSummary> => {
    const method = RestMethod.GET;
    const path = `v1/networks/${network}/summary`;
    const request = new Endpoints.GetNetworkSummaryRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.GetNetworkSummaryResponse);
    return response.networkSummary;
  }

  public getNetworkStatus = async (network: string): Promise<Resources.NetworkStatus> => {
    const method = RestMethod.GET;
    const path = `v1/networks/${network}/status`;
    const request = new Endpoints.GetNetworkStatusRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.GetNetworkStatusResponse);
    return response.networkStatus;
  }

  public generateImageUploadForToken = async (network: string, tokenId: number): Promise<Resources.PresignedUpload> => {
    const method = RestMethod.POST;
    const path = `v1/networks/${network}/tokens/${tokenId}/generate-image-upload`;
    const request = new Endpoints.GenerateImageUploadForTokenRequest();
    const response = await this.makeRequest(method, path, request, Endpoints.GenerateImageUploadForTokenResponse);
    return response.presignedUpload;
  }

  public createMetadataForToken = async (network: string, tokenId: number, shouldUseIpfs: boolean, name: string, description: string | null, imageUrl: string, url: string | null): Promise<string> => {
    const method = RestMethod.POST;
    const path = `v1/networks/${network}/tokens/${tokenId}/create-metadata`;
    const request = new Endpoints.UploadMetadataForTokenRequest(shouldUseIpfs, name, description, imageUrl, url);
    const response = await this.makeRequest(method, path, request, Endpoints.UploadMetadataForTokenResponse);
    return response.tokenMetadataUrl;
  }

  public createMetadataForTokenGroup = async (network: string, tokenId: number, shouldUseIpfs: boolean, width: number, height: number, name: string, description: string | null, imageUrl: string, url: string | null): Promise<string[]> => {
    const method = RestMethod.POST;
    const path = `v1/networks/${network}/tokens/${tokenId}/create-group-metadata`;
    const request = new Endpoints.UploadMetadataForTokenGroupRequest(shouldUseIpfs, width, height, name, description, imageUrl, url);
    const response = await this.makeRequest(method, path, request, Endpoints.UploadMetadataForTokenGroupResponse);
    return response.tokenMetadataUrls;
  }

  public updateTokenDeferred = async (network: string, tokenId: number): Promise<void> => {
    const method = RestMethod.POST;
    const path = `v1/networks/${network}/tokens/${tokenId}/update-token-deferred`;
    const request = new Endpoints.UpdateTokenDeferredRequest();
    await this.makeRequest(method, path, request, Endpoints.UpdateTokenDeferredResponse);
  }
}
