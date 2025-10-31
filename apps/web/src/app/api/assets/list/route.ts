/**
 * Asset List API
 * Lists all assets in a user's workspace from Storj bucket
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWormClient, getPublicUrl, listObjects } from '@dial/worm';

export interface Asset {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  type: 'image' | 'audio' | 'video' | 'file';
  mimeType?: string;
  uploadedAt: string;
}

/**
 * GET /api/assets/list?address=<wallet_address>&workspace=<workspace_id>
 * List all assets in a workspace
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const workspace = searchParams.get('workspace') || 'default';

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // List all files in the user's workspace assets folder
    const prefix = `users/${address}/assets/${workspace}/`;
    
    // List objects using the worm client helper
    const files = await listObjects(prefix);

    // Transform file list into asset objects
    const assets: Asset[] = files.map((file) => {
      const filename = file.key || '';
      const parts = filename.split('/');
      const filenameWithTimestamp = parts[parts.length - 1] || '';
      
      // Extract original name (remove timestamp prefix)
      const originalName = filenameWithTimestamp.includes('-') 
        ? filenameWithTimestamp.substring(filenameWithTimestamp.indexOf('-') + 1)
        : filenameWithTimestamp;

      // Determine type from extension or metadata
      let type: 'image' | 'audio' | 'video' | 'file' = 'file';
      const ext = originalName.split('.').pop()?.toLowerCase();
      
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
        type = 'image';
      } else if (['mp3', 'wav', 'ogg', 'webm', 'm4a'].includes(ext || '')) {
        type = 'audio';
      } else if (['mp4', 'webm', 'ogv'].includes(ext || '')) {
        type = 'video';
      }

      // Determine mime type from extension
      let mimeType = file.contentType;
      if (!mimeType) {
        if (type === 'image') {
          mimeType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        } else if (type === 'audio') {
          mimeType = `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
        } else if (type === 'video') {
          mimeType = `video/${ext}`;
        }
      }

      return {
        url: getPublicUrl(filename),
        filename,
        originalName,
        size: file.size || 0,
        type,
        mimeType,
        uploadedAt: file.lastModified || new Date().toISOString(),
      };
    });

    // Sort by upload date (newest first)
    assets.sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({
      assets,
      count: assets.length,
      workspace,
    });
  } catch (error: any) {
    console.error('Error listing assets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list assets' },
      { status: 500 }
    );
  }
}

