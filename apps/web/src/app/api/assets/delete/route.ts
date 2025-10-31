/**
 * Asset Delete API
 * Deletes an asset from Storj bucket
 */

import { NextRequest, NextResponse } from 'next/server';
import { getWormClient } from '@dial/worm';

/**
 * DELETE /api/assets/delete
 * Delete an asset from workspace
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const address = searchParams.get('address');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      );
    }

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Verify the file belongs to the user
    if (!filename.startsWith(`users/${address}/assets/`)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this asset' },
        { status: 403 }
      );
    }

    // Delete from Storj
    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: 'Storage client not available' },
        { status: 500 }
      );
    }
    // Use the underlying S3 client to delete the object
    await (worm as any).delete?.(filename);

    return NextResponse.json({
      success: true,
      message: 'Asset deleted successfully',
      filename,
    });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

