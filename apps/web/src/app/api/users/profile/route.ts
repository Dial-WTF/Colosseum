/**
 * User Profile API Routes
 * Handles getting and updating user profile data
 */

import { NextRequest, NextResponse } from 'next/server';

// Helper to check if Storj is configured
function isStorjConfigured(): boolean {
  return !!(
    process.env.STORJ_ENDPOINT &&
    process.env.STORJ_BUCKET &&
    process.env.STORJ_ACCESS_KEY &&
    process.env.STORJ_SECRET_KEY
  );
}

/**
 * GET /api/users/profile?address=<wallet_address>
 * Get user profile by wallet address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // If Storj is not configured, return a default profile
    if (!isStorjConfigured()) {
      return NextResponse.json({
        address,
        displayName: '',
        bio: '',
        avatarUrl: '',
        bannerUrl: '',
        socialLinks: {},
        email: '',
      });
    }

    const { getWormClient, UserRepository } = await import('@dial/worm');
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    const userRepo = new UserRepository(worm);

    // Get profile from Storj
    let profile = await userRepo.getProfile(address);

    // If profile doesn't exist, create a default one
    if (!profile) {
      profile = await userRepo.createProfile(address, {
        address,
        displayName: '',
        bio: '',
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/profile
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, displayName, bio, avatarUrl, bannerUrl, socialLinks, email } = body;

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // If Storj is not configured, just return the submitted data
    if (!isStorjConfigured()) {
      return NextResponse.json({
        address,
        displayName: displayName || '',
        bio: bio || '',
        avatarUrl: avatarUrl || '',
        bannerUrl: bannerUrl || '',
        socialLinks: socialLinks || {},
        email: email || '',
      });
    }

    const { getWormClient, UserRepository } = await import('@dial/worm');
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    const userRepo = new UserRepository(worm);

    // Get existing profile or create new one
    let profile = await userRepo.getProfile(address);
    if (!profile) {
      profile = await userRepo.createProfile(address);
    }

    // Update profile fields
    if (displayName !== undefined) profile.displayName = displayName;
    if (bio !== undefined) profile.bio = bio;
    if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) profile.bannerUrl = bannerUrl;
    if (socialLinks !== undefined) profile.socialLinks = socialLinks;
    if (email !== undefined) profile.email = email;

    // Save to Storj
    await userRepo.saveProfile(profile);

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}

