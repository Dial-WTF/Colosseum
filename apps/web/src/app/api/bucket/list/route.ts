/**
 * Bucket List API
 * Lists objects in Storj bucket with a given prefix
 */

import { NextRequest, NextResponse } from "next/server";
import { listObjects } from "@dial/worm";

/**
 * GET /api/bucket/list?prefix=<prefix>
 * List objects in bucket with the given prefix
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix");

    if (!prefix) {
      return NextResponse.json(
        { error: "Prefix is required" },
        { status: 400 }
      );
    }

    // List objects using the worm client helper
    const objects = await listObjects(prefix);

    return NextResponse.json({
      objects,
      count: objects.length,
      prefix,
    });
  } catch (error: any) {
    console.error("Error listing bucket objects:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list bucket objects" },
      { status: 500 }
    );
  }
}
