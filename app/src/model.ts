
export class Token {
  readonly tokenId: number;
  readonly metadataUrl: string;
  readonly metadata: TokenMetadata;

  public constructor(tokenId: number, metadataUrl: string, metadata: TokenMetadata) {
    this.tokenId = tokenId;
    this.metadataUrl = metadataUrl;
    this.metadata = metadata;
  }
}

export class TokenMetadata {
  readonly name: string;
  readonly description: string;
  readonly imageUrl: string;

  public constructor(name: string, description: string, imageUrl: string) {
    this.name = name;
    this.description = description;
    this.imageUrl = imageUrl;
  }
}
