/**
 * API route for user NFT collection management
 * GET /api/users/[address]/collection - Get user collection
 * POST /api/users/[address]/collection/nft - Add NFT to collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWormClient, UserRepository } from '@dial/worm';

// Validate Solana address format
function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * GET /api/users/[address]/collection
 * Get user's NFT collection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    const userRepo = new UserRepository(worm);
    const collection = await userRepo.getCollection(address);

    if (!collection) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error fetching user collection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[address]/collection
 * Update user's collection (add/remove NFTs)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, nft } = body;

    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    const userRepo = new UserRepository(worm);
    let collection = await userRepo.getCollection(address);

    // Create collection if it doesn't exist
    if (!collection) {
      collection = await userRepo.createCollection(address);
    }

    // Handle different actions
    if (action === 'add' && nft) {
      collection.addNFT(nft);
      await userRepo.saveCollection(collection);
    } else if (action === 'remove' && nft?.mint) {
      collection.removeNFT(nft.mint);
      await userRepo.saveCollection(collection);
    } else if (action === 'toggleFavorite' && nft?.mint) {
      collection.toggleFavorite(nft.mint);
      await userRepo.saveCollection(collection);
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing NFT data' },
        { status: 400 }
      );
    }

    return NextResponse.json(collection);
  } catch (error) {
    console.error('Error updating user collection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

