/**
 * Signed URL Generation API
 * Generates signed URLs for accessing Storj bucket files
 */

import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@dial/worm";

/**
 * POST /api/bucket/signed-url
 * Generate a signed URL for a file in Storj
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, expiresIn = 3600 } = body as {
      filename: string;
      expiresIn?: number;
    };

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Generate signed URL
    const signedUrl = await getSignedUrl(filename, expiresIn);

    if (!signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: signedUrl,
      filename,
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error("Error generating signed URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
