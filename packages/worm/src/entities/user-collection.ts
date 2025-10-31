/**
 * User NFT collection entity
 * Stored at: users/[address]/collection.json
 */

import { BaseEntity, getUserPath } from './base';

export interface NFTItem {
  /**
   * NFT mint address on Solana
   */
  mint: string;

  /**
   * NFT name
   */
  name: string;

  /**
   * NFT description
   */
  description?: string;

  /**
   * Image URI (IPFS or Arweave)
   */
  image?: string;

  /**
   * Audio file URI (for ringtones)
   */
  audio?: string;

  /**
   * NFT attributes/traits
   */
  attributes?: Record<string, any>;

  /**
   * Token standard (MasterEdition, SFT, cNFT)
   */
  tokenStandard?: string;

  /**
   * Edition number (for Master Editions)
   */
  edition?: number;

  /**
   * Total supply (for limited editions)
   */
  supply?: number;

  /**
   * Purchase timestamp
   */
  acquiredAt: string;

  /**
   * Purchase price (in SOL)
   */
  purchasePrice?: number;
}

export class UserCollection extends BaseEntity {
  /**
   * User's wallet address
   */
  address: string = '';

  /**
   * Array of owned NFTs
   */
  nfts: NFTItem[] = [];

  /**
   * Total number of NFTs in collection
   */
  totalCount: number = 0;

  /**
   * Total value of collection (in SOL)
   */
  totalValue: number = 0;

  /**
   * Favorite NFT mints
   */
  favorites: string[] = [];

  /**
   * Last sync timestamp
   */
  lastSyncedAt?: string;

  static getBasePath(): string {
    return 'users';
  }

  getPath(): string {
    return getUserPath(this.address, 'collection.json');
  }

  /**
   * Create a collection for a specific address
   */
  static forAddress(address: string): UserCollection {
    const collection = new UserCollection();
    collection.address = address;
    return collection;
  }

  /**
   * Add an NFT to the collection
   */
  addNFT(nft: NFTItem): void {
    this.nfts.push(nft);
    this.totalCount = this.nfts.length;
    this.touch();
  }

  /**
   * Remove an NFT from the collection
   */
  removeNFT(mint: string): void {
    this.nfts = this.nfts.filter((nft) => nft.mint !== mint);
    this.totalCount = this.nfts.length;
    this.touch();
  }

  /**
   * Toggle favorite status for an NFT
   */
  toggleFavorite(mint: string): void {
    const index = this.favorites.indexOf(mint);
    if (index >= 0) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(mint);
    }
    this.touch();
  }

  /**
   * Update collection value based on current NFT prices
   */
  updateValue(): void {
    this.totalValue = this.nfts.reduce((sum, nft) => sum + (nft.purchasePrice || 0), 0);
    this.touch();
  }
}

