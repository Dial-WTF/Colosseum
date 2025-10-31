/**
 * NFT Metadata Upload API
 * Handles uploading NFT metadata JSON to storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadNFTMetadata } from '@/lib/metadata-service';

interface MetadataUploadRequest {
  metadata: {
    name: string;
    symbol: string;
    description: string;
    image: string;
    animation_url?: string;
    external_url?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    properties?: {
      files: Array<{
        uri: string;
        type: string;
      }>;
      category: string;
      creators: Array<{
        address: string;
        share: number;
      }>;
    };
  };
  walletAddress: string;
}

/**
 * POST /api/nft/metadata/upload
 * Upload NFT metadata JSON to storage
 */
export async function POST(request: NextRequest) {
  try {
    const body: MetadataUploadRequest = await request.json();

    // Validate required fields
    if (!body.metadata || !body.walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: metadata, walletAddress' },
        { status: 400 }
      );
    }

    if (!body.metadata.name || !body.metadata.symbol || !body.metadata.description) {
      return NextResponse.json(
        { error: 'Metadata must include name, symbol, and description' },
        { status: 400 }
      );
    }

    // Upload metadata to storage
    console.log('☁️ Uploading metadata to storage...');
    const result = await uploadNFTMetadata(body.metadata, body.walletAddress);

    console.log('✅ Metadata uploaded successfully:', result.uri);

    return NextResponse.json({
      success: true,
      uri: result.uri,
      filename: result.filename,
    });
  } catch (error: any) {
    console.error('❌ Error uploading metadata:', error);
    
    return NextResponse.json(
      {
        error: error.message || 'Failed to upload metadata',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

