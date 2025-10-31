/**
 * Asset Upload API
 * Handles uploading workspace assets to Storj bucket
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWormClient, getSignedUrl } from '@dial/worm';

/**
 * POST /api/assets/upload
 * Upload an asset (image, audio, etc.) to workspace
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const address = formData.get('address') as string;
    const workspace = formData.get('workspace') as string || 'default'; // workspace identifier

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

    // Validate file type - support images, audio, and video
    const allowedTypes = [
      // Images
      'image/jpeg', 
      'image/jpg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'image/svg+xml',
      // Audio
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
      // Video
      'video/mp4',
      'video/webm',
      'video/ogg',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images, audio, and video are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB for assets)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique filename with original name preserved
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `users/${address}/assets/${workspace}/${timestamp}-${sanitizedName}`;

    // Upload to Storj
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    await worm.putBytes(filename, buffer, file.type);

    // Generate signed URL (expires in 24 hours)
    const signedUrl = await getSignedUrl(filename, 86400);

    // Determine asset type
    const assetType = file.type.startsWith('image/') 
      ? 'image' 
      : file.type.startsWith('audio/') 
      ? 'audio' 
      : file.type.startsWith('video/')
      ? 'video'
      : 'file';

    return NextResponse.json({
      url: signedUrl,
      filename,
      originalName: file.name,
      size: file.size,
      type: assetType,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload asset' },
      { status: 500 }
    );
  }
}

