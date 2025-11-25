/**
 * NFT Metadata Upload API
 * Handles uploading NFT metadata JSON to Storj storage
 */

import { NextRequest, NextResponse } from "next/server";
import { getWormClient, getPublicUrl } from "@dial/worm";

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

/**
 * POST /api/metadata/upload
 * Upload NFT metadata JSON to Storj
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metadata, walletAddress } = body as {
      metadata: NFTMetadataInput;
      walletAddress: string;
    };

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!metadata) {
      return NextResponse.json(
        { error: "Metadata is required" },
        { status: 400 }
      );
    }

    if (
      !metadata.name ||
      !metadata.symbol ||
      !metadata.description ||
      !metadata.image
    ) {
      return NextResponse.json(
        { error: "Metadata must include name, symbol, description, and image" },
        { status: 400 }
      );
    }

    // Generate filename with timestamp
    const timestamp = Date.now();
    const sanitizedName = metadata.name.replace(/[^a-zA-Z0-9-]/g, "_");
    const filename = `users/${walletAddress}/nft-metadata/${timestamp}-${sanitizedName}.json`;

    // Convert metadata to JSON buffer
    const jsonString = JSON.stringify(metadata, null, 2);
    const buffer = new TextEncoder().encode(jsonString);

    // Upload to Storj
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: "Storage client not available" },
        { status: 500 }
      );
    }

    await worm.putBytes(filename, buffer, "application/json");

    // Generate public URL
    const uri = getPublicUrl(filename);

    return NextResponse.json(
      {
        uri,
        filename,
        metadata,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error uploading NFT metadata:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload NFT metadata" },
      { status: 500 }
    );
  }
}
