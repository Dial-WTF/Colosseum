import type { BondingCurveConfig } from '@dial/bonding-curve';

// NFT Types
export type NFTType = 'master-edition' | 'sft' | 'cnft';

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface RingtoneNFT {
  id: string;
  mint: string;
  name: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  supply: number;
  maxSupply: number;
  price: number;
  bondingCurve: BondingCurveConfig;
  creator: string;
  createdAt: number;
}

export interface StickerNFT {
  id: string;
  mint: string;
  name: string;
  description: string;
  imageUrl: string;
  supply: number;
  maxSupply: number;
  price: number;
  bondingCurve: BondingCurveConfig;
  creator: string;
  createdAt: number;
}


