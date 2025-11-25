/**
 * Project Versions API Routes
 * Handles CRUD operations for project versions
 */

import { NextRequest, NextResponse } from "next/server";
import { getWormClient } from "@dial/worm";
import { ProjectRepository } from "@dial/worm";
import type { CreateVersionInput, ProjectVersion } from "@dial/types";

/**
 * GET /api/projects/versions?address=<wallet_address>&projectId=<project_id>&versionId=<version_id>
 * Get a specific version
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const projectId = searchParams.get("projectId");
    const versionId = searchParams.get("versionId");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!versionId) {
      return NextResponse.json(
        { error: "Version ID is required" },
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
    const version = await projectRepo.getVersion(address, projectId, versionId);

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error: any) {
    console.error("Error fetching version:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch version" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/versions
 * Create a new version for a project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, ...versionInput } = body as CreateVersionInput & {
      address: string;
    };

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
    const version = await projectRepo.createVersion(address, versionInput);

    return NextResponse.json(version, { status: 201 });
  } catch (error: any) {
    console.error("Error creating version:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create version" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects/versions
 * Update a version
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, projectId, versionId, ...updateData } = body as {
      address: string;
      projectId: string;
      versionId: string;
    } & Partial<Pick<ProjectVersion, "name" | "notes" | "data" | "thumbnail">>;

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!versionId) {
      return NextResponse.json(
        { error: "Version ID is required" },
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
    const version = await projectRepo.updateVersion(
      address,
      projectId,
      versionId,
      updateData
    );

    if (!version) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error: any) {
    console.error("Error updating version:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update version" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/versions?address=<wallet_address>&projectId=<project_id>&versionId=<version_id>
 * Delete a version
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const projectId = searchParams.get("projectId");
    const versionId = searchParams.get("versionId");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    if (!versionId) {
      return NextResponse.json(
        { error: "Version ID is required" },
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
    const success = await projectRepo.deleteVersion(
      address,
      projectId,
      versionId
    );

    if (!success) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Version deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting version:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete version" },
      { status: 500 }
    );
  }
}
