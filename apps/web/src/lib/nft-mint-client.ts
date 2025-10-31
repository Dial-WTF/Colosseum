/**
 * NFT Minting Client
 * Client-side helper for minting NFTs
 */

import type { BondingCurveConfig } from '@dial/bonding-curve';

export interface MintNFTRequest {
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  walletAddress: string;
  nftType: 'master-edition' | 'sft' | 'cnft';
  royaltyPercentage: number;
  bondingCurve: BondingCurveConfig;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  tags?: string[];
}

export interface MintNFTResponse {
  success: boolean;
  mint: string;
  metadata: string;
  masterEdition?: string;
  tokenAccount: string;
  signature: string;
  explorerUrl: string;
  metadataUri: string;
  estimatedFee: number;
}

export interface MintProgress {
  step: 'uploading' | 'creating' | 'confirming' | 'complete' | 'error';
  message: string;
  percentage: number;
}

/**
 * Mint an NFT on Solana
 */
export async function mintNFT(
  request: MintNFTRequest,
  onProgress?: (progress: MintProgress) => void
): Promise<MintNFTResponse> {
  try {
    // Step 1: Uploading metadata
    onProgress?.({
      step: 'uploading',
      message: 'Uploading metadata to storage...',
      percentage: 10,
    });

    // Step 2: Creating NFT
    onProgress?.({
      step: 'creating',
      message: 'Creating NFT on Solana...',
      percentage: 40,
    });

    // Make API request
    const response = await fetch('/api/nft/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mint NFT');
    }

    const result: MintNFTResponse = await response.json();

    // Step 3: Confirming transaction
    onProgress?.({
      step: 'confirming',
      message: 'Confirming transaction on blockchain...',
      percentage: 80,
    });

    // Small delay to simulate confirmation time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 4: Complete
    onProgress?.({
      step: 'complete',
      message: 'NFT minted successfully!',
      percentage: 100,
    });

    return result;
  } catch (error) {
    onProgress?.({
      step: 'error',
      message: error instanceof Error ? error.message : 'Failed to mint NFT',
      percentage: 0,
    });
    throw error;
  }
}

/**
 * Estimate minting fee
 */
export async function estimateMintFee(
  nftType: 'master-edition' | 'sft' | 'cnft'
): Promise<number> {
  try {
    const response = await fetch(`/api/nft/mint/estimate?nftType=${nftType}`);
    
    if (!response.ok) {
      throw new Error('Failed to estimate mint fee');
    }

    const result = await response.json();
    return result.estimatedFee;
  } catch (error) {
    console.error('Error estimating mint fee:', error);
    // Return default estimates
    switch (nftType) {
      case 'master-edition':
        return 0.02;
      case 'sft':
        return 0.015;
      case 'cnft':
        return 0.001;
      default:
        return 0.02;
    }
  }
}

/**
 * Upload asset to storage
 */
export async function uploadAsset(
  file: File,
  walletAddress: string,
  workspace: string = 'default'
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('address', walletAddress);
  formData.append('workspace', workspace);

  const response = await fetch('/api/assets/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload asset');
  }

  return await response.json();
}

