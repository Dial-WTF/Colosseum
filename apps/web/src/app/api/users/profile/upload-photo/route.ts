/**
 * Profile Photo Upload API
 * Handles uploading profile photos to Storj
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWormClient, getPublicUrl } from '@dial/worm';

/**
 * POST /api/users/profile/upload-photo
 * Upload a profile photo
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const address = formData.get('address') as string;
    const type = formData.get('type') as 'avatar' | 'banner'; // avatar or banner

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!type || !['avatar', 'banner'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid photo type. Must be "avatar" or "banner"' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `users/${address}/${type}-${timestamp}.${extension}`;

    // Upload to Storj
    const worm = getWormClient();
    await worm.putBytes(filename, buffer, file.type);

    // Generate public URL
    const publicUrl = getPublicUrl(filename);

    return NextResponse.json({
      url: publicUrl,
      filename,
      type,
    });
  } catch (error: any) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

