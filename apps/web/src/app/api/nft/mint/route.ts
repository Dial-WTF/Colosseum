/**
 * NFT Minting API
 * Handles minting NFTs on Solana blockchain
 */

import { NextRequest, NextResponse } from 'next/server';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { uploadNFTMetadata, buildNFTMetadata } from '@/lib/metadata-service';
import { mintNFT, estimateMintFee } from '@/lib/solana-mint-service';
import type { BondingCurveConfig } from '@dial/bonding-curve';

interface MintNFTRequest {
  // Metadata
  name: string;
  symbol: string;
  description: string;
  imageUrl: string; // Already uploaded cover image URL
  audioUrl?: string; // Already uploaded audio URL
  
  // Wallet
  walletAddress: string;
  
  // NFT Configuration
  nftType: 'master-edition' | 'sft' | 'cnft';
  royaltyPercentage: number;
  
  // Bonding Curve
  bondingCurve: BondingCurveConfig;
  
  // Attributes
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  
  // Tags (optional, not stored on-chain but useful for indexing)
  tags?: string[];
}

/**
 * POST /api/nft/mint
 * Mint a new NFT on Solana
 */
export async function POST(request: NextRequest) {
  try {
    const body: MintNFTRequest = await request.json();

    // Validate required fields
    if (!body.name || !body.symbol || !body.description) {
      return NextResponse.json(
        { error: 'Missing required fields: name, symbol, description' },
        { status: 400 }
      );
    }

    if (!body.walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!body.imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!body.bondingCurve) {
      return NextResponse.json(
        { error: 'Bonding curve configuration is required' },
        { status: 400 }
      );
    }

    // Get payer keypair from environment
    // NOTE: In production, you should use a secure key management system
    const payerPrivateKey = process.env.SOLANA_PAYER_PRIVATE_KEY;
    if (!payerPrivateKey) {
      return NextResponse.json(
        { error: 'Server configuration error: SOLANA_PAYER_PRIVATE_KEY not set' },
        { status: 500 }
      );
    }

    const payerKeypair = Keypair.fromSecretKey(bs58.decode(payerPrivateKey));

    // Step 1: Build NFT metadata
    console.log('📝 Building NFT metadata...');
    const metadata = buildNFTMetadata({
      name: body.name,
      symbol: body.symbol,
      description: body.description,
      imageUrl: body.imageUrl,
      audioUrl: body.audioUrl,
      attributes: body.attributes,
      creators: [
        {
          address: body.walletAddress,
          share: 100,
        },
      ],
    });

    // Step 2: Upload metadata JSON to storage
    console.log('☁️ Uploading metadata to storage...');
    const uploadedMetadata = await uploadNFTMetadata(metadata, body.walletAddress);

    // Step 3: Mint NFT on Solana
    console.log('⚡ Minting NFT on Solana...');
    const royaltyBasisPoints = body.royaltyPercentage * 100; // Convert % to basis points
    
    const mintResult = await mintNFT(
      {
        name: body.name,
        symbol: body.symbol,
        metadataUri: uploadedMetadata.uri,
        walletAddress: body.walletAddress,
        nftType: body.nftType,
        royaltyBasisPoints,
        bondingCurve: body.bondingCurve,
        creators: [
          {
            address: body.walletAddress,
            share: 100,
            verified: false,
          },
        ],
      },
      payerKeypair
    );

    // Step 4: Estimate fees
    const estimatedFee = await estimateMintFee(body.nftType);

    console.log('✅ NFT minted successfully!', {
      mint: mintResult.mint,
      explorerUrl: mintResult.explorerUrl,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      mint: mintResult.mint,
      metadata: mintResult.metadata,
      masterEdition: mintResult.masterEdition,
      tokenAccount: mintResult.tokenAccount,
      signature: mintResult.signature,
      explorerUrl: mintResult.explorerUrl,
      metadataUri: uploadedMetadata.uri,
      estimatedFee,
    });
  } catch (error: any) {
    console.error('❌ Error minting NFT:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to mint NFT',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nft/mint/estimate
 * Estimate minting fees
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nftType = searchParams.get('nftType') as 'master-edition' | 'sft' | 'cnft' || 'master-edition';

    const estimatedFee = await estimateMintFee(nftType);

    return NextResponse.json({
      nftType,
      estimatedFee,
      currency: 'SOL',
    });
  } catch (error: any) {
    console.error('Error estimating mint fee:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to estimate mint fee' },
      { status: 500 }
    );
  }
}

