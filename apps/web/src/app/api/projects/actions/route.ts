/**
 * Project Actions API Routes
 * Handles special project operations like duplicate, export, import, set current version
 */

import { NextRequest, NextResponse } from "next/server";
import { getWormClient } from "@dial/worm";
import { ProjectRepository } from "@dial/worm";

/**
 * POST /api/projects/actions
 * Perform various project actions
 * Body: { action: 'duplicate' | 'export' | 'import' | 'setCurrentVersion', address, projectId?, data? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, address, projectId, versionId, data } = body;

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
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

    switch (action) {
      case "duplicate": {
        if (!projectId) {
          return NextResponse.json(
            { error: "Project ID is required for duplicate action" },
            { status: 400 }
          );
        }
        const duplicatedProject = await projectRepo.duplicateProject(
          address,
          projectId
        );
        if (!duplicatedProject) {
          return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ project: duplicatedProject });
      }

      case "export": {
        if (!projectId) {
          return NextResponse.json(
            { error: "Project ID is required for export action" },
            { status: 400 }
          );
        }
        const exportedJson = await projectRepo.exportProject(
          address,
          projectId
        );
        if (!exportedJson) {
          return NextResponse.json(
            { error: "Project not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ json: exportedJson });
      }

      case "import": {
        if (!data || typeof data !== "string") {
          return NextResponse.json(
            { error: "JSON data is required for import action" },
            { status: 400 }
          );
        }
        const importedProject = await projectRepo.importProject(address, data);
        return NextResponse.json({ project: importedProject }, { status: 201 });
      }

      case "setCurrentVersion": {
        if (!projectId) {
          return NextResponse.json(
            { error: "Project ID is required for setCurrentVersion action" },
            { status: 400 }
          );
        }
        if (!versionId) {
          return NextResponse.json(
            { error: "Version ID is required for setCurrentVersion action" },
            { status: 400 }
          );
        }
        const updatedProject = await projectRepo.setCurrentVersion(
          address,
          projectId,
          versionId
        );
        if (!updatedProject) {
          return NextResponse.json(
            { error: "Project or version not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ project: updatedProject });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Error performing project action:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform project action" },
      { status: 500 }
    );
  }
}
