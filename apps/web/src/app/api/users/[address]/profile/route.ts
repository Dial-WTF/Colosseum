/**
 * API route for user profile management
 * GET /api/users/[address]/profile - Get user profile
 * PUT /api/users/[address]/profile - Update user profile
 * POST /api/users/[address]/profile - Create user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWormClient, UserRepository } from '@dial/worm';

// Validate Solana address format
function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * GET /api/users/[address]/profile
 * Retrieve user profile data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate address format
    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Get user profile from Storj
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    const userRepo = new UserRepository(worm);
    const profile = await userRepo.getProfile(address);

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[address]/profile
 * Update existing user profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate address format
    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Get or create profile
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    const userRepo = new UserRepository(worm);
    let profile = await userRepo.getProfile(address);

    if (!profile) {
      // Create new profile if it doesn't exist
      profile = await userRepo.createProfile(address, body);
    } else {
      // Update existing profile
      Object.assign(profile, body);
      await userRepo.saveProfile(profile);
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[address]/profile
 * Create new user profile (initialization)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    // Validate address format
    if (!isValidSolanaAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    // Check if profile already exists
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    const userRepo = new UserRepository(worm);
    const exists = await userRepo.userExists(address);

    if (exists) {
      return NextResponse.json(
        { error: 'Profile already exists' },
        { status: 409 }
      );
    }

    // Parse request body for initial profile data
    const body = await request.json();

    // Initialize user with all data structures
    const userData = await userRepo.initializeUser(address, body);

    return NextResponse.json(userData, { status: 201 });
  } catch (error) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

