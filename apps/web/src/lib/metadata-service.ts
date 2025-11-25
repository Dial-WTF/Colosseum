/**
 * NFT Metadata Service
 * Handles uploading NFT metadata JSON to Storj storage
 */

import { getWormClient, getPublicUrl } from '@dial/worm';
import type { BondingCurveConfig } from '@dial/bonding-curve';

export interface NFTMetadataInput {
  name: string;
  symbol: string;
  description: string;
  image: string; // URL to cover image
  animation_url?: string; // URL to audio/video file
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties?: {
    files?: Array<{
      uri: string;
      type: string;
    }>;
    category?: string;
    creators?: Array<{
      address: string;
      share: number;
    }>;
  };
}

export interface UploadedMetadata {
  uri: string; // Public URL to the metadata JSON
  filename: string;
  metadata: NFTMetadataInput;
}

/**
 * Upload NFT metadata JSON to Storj
 */
export async function uploadNFTMetadata(
  metadata: NFTMetadataInput,
  walletAddress: string
): Promise<UploadedMetadata> {
  try {
    // Generate filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = metadata.name.replace(/[^a-zA-Z0-9-]/g, '_');
    const filename = `users/${walletAddress}/nft-metadata/${timestamp}-${sanitizedName}.json`;

    // Convert metadata to JSON buffer
    const jsonString = JSON.stringify(metadata, null, 2);
    const buffer = new TextEncoder().encode(jsonString);

    // Upload to Storj
    const worm = getWormClient();
    
    if (!worm) {
      throw new Error('Worm client not available. Please check your Storj configuration.');
    }
    
    await worm.putBytes(filename, buffer, 'application/json');

    // Generate public URL
    const uri = getPublicUrl(filename);

    return {
      uri,
      filename,
      metadata,
    };
  } catch (error) {
    console.error('Error uploading NFT metadata:', error);
    throw new Error(`Failed to upload NFT metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build complete NFT metadata object
 */
export function buildNFTMetadata(input: {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  externalUrl?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  creators?: Array<{
    address: string;
    share: number;
  }>;
}): NFTMetadataInput {
  const metadata: NFTMetadataInput = {
    name: input.name,
    symbol: input.symbol,
    description: input.description,
    image: input.imageUrl,
    attributes: input.attributes || [],
  };

  // Add animation URL if audio/video is provided
  if (input.audioUrl) {
    metadata.animation_url = input.audioUrl;
  }

  // Add external URL if provided
  if (input.externalUrl) {
    metadata.external_url = input.externalUrl;
  }

  // Build properties object
  const files: Array<{ uri: string; type: string }> = [
    { uri: input.imageUrl, type: 'image/png' },
  ];

  if (input.audioUrl) {
    files.push({ uri: input.audioUrl, type: 'audio/mpeg' });
  }

  metadata.properties = {
    files,
    category: input.audioUrl ? 'audio' : 'image',
    creators: input.creators || [],
  };

  return metadata;
}

