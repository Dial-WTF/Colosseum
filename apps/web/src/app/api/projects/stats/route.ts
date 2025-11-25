/**
 * Project Stats API Routes
 * Get storage statistics for user projects
 */

import { NextRequest, NextResponse } from "next/server";
import { getWormClient } from "@dial/worm";
import { ProjectRepository } from "@dial/worm";

/**
 * GET /api/projects/stats?address=<wallet_address>
 * Get storage statistics for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const worm = getWormClient();
    if (!worm) {
      return NextResponse.json(
        { error: "Storage client not available" },
        { status: 500 }
      );
    }

    const projectRepo = new ProjectRepository(worm);
    const stats = await projectRepo.getStorageStats(address);

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error("Error fetching storage stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch storage stats" },
      { status: 500 }
    );
  }
}
