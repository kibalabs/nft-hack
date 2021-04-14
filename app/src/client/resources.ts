
export class GridItem {
  readonly gridItemId: number;
  readonly tokenId: number;
  readonly network: string;
  readonly title: string;
  readonly description: string | null;
  readonly imageUrl: string;
  readonly resizableImageUrl: string | null;
  readonly ownerId: string;

  public constructor(gridItemId: number, tokenId: number, network: string, title: string, description: string | null, imageUrl: string, resizableImageUrl: string | null, ownerId: string) {
    this.gridItemId = gridItemId;
    this.tokenId = tokenId;
    this.network = network;
    this.title = title;
    this.description = description;
    this.imageUrl = imageUrl;
    this.resizableImageUrl = resizableImageUrl;
    this.ownerId = ownerId;
  }

  public static fromObject = (obj: Record<string, unknown>): GridItem => {
    return new GridItem(
      Number(obj.gridItemId),
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

export class PresignedUpload {
  readonly url: string;
  readonly params: Record<string, string>;

  public constructor(url: string, params: Record<string, string>) {
    this.url = url;
    this.params = params;
  }

  public static fromObject = (obj: Record<string, unknown>): PresignedUpload => {
    return new PresignedUpload(
      String(obj.url),
      obj.params as Record<string, string>,
    );
  }
}
