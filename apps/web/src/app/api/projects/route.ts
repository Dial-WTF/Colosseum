/**
 * Projects API Routes
 * Handles CRUD operations for user projects
 */

import { NextRequest, NextResponse } from "next/server";
import { getWormClient } from "@dial/worm";
import { ProjectRepository } from "@dial/worm";
import type { CreateProjectInput, UpdateProjectInput } from "@dial/types";

/**
 * GET /api/projects?address=<wallet_address>
 * Get all projects for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const id = searchParams.get("id");
    const format = searchParams.get("format"); // 'grid' for grid view

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

    // Get single project by ID
    if (id) {
      const project = await projectRepo.getProject(address, id);
      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(project);
    }

    // Get projects for grid view
    if (format === "grid") {
      const projects = await projectRepo.getProjectsForGrid(address);
      return NextResponse.json({ projects });
    }

    // Get all projects
    const projects = await projectRepo.getAllProjects(address);
    return NextResponse.json({ projects });
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects
 * Create a new project
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, ...projectInput } = body as CreateProjectInput & {
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
    const project = await projectRepo.createProject(address, projectInput);

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create project" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/projects
 * Update a project
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, id, ...updateInput } = body as UpdateProjectInput & {
      address: string;
      id: string;
    };

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
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
    const project = await projectRepo.updateProject(address, id, updateInput);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects?address=<wallet_address>&id=<project_id>
 * Delete a project
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const id = searchParams.get("id");

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!id) {
      return NextResponse.json(
        { error: "Project ID is required" },
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
    const success = await projectRepo.deleteProject(address, id);

    if (!success) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
