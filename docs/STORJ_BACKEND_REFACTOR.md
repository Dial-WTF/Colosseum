# 🔐 Storj Backend Refactor Summary

## Overview

This refactor moves all Storj credentials and operations to the backend API, ensuring credentials are never exposed to the client-side. All client-side code now communicates with backend API endpoints instead of directly accessing Storj.

## 🔥 Key Changes

### 1. Security Improvements

#### ✅ Removed Client-Side Credential Exposure

- **Before**: Worm client checked for `NEXT_PUBLIC_*` environment variables, potentially exposing credentials to the client
- **After**: Only backend-only environment variables are used (`STORJ_*` without `NEXT_PUBLIC_` prefix)

**Modified**: `packages/worm/src/client.ts`

- Removed all `NEXT_PUBLIC_STORJ_*` environment variable checks
- Added warnings to functions that should only be called from backend
- Functions now only access `process.env.STORJ_*` (backend-only)

### 2. New Backend API Endpoints

All Storj operations are now handled through secure backend API routes:

#### 📦 Project Operations (`/api/projects/*`)

**`/api/projects/route.ts`** - Core CRUD operations

- `GET /api/projects?address={address}` - Get all projects for a user
- `GET /api/projects?address={address}&id={id}` - Get single project
- `GET /api/projects?address={address}&format=grid` - Get projects for grid view
- `POST /api/projects` - Create new project
- `PUT /api/projects` - Update project
- `DELETE /api/projects?address={address}&id={id}` - Delete project

**`/api/projects/versions/route.ts`** - Version management

- `GET /api/projects/versions?address={address}&projectId={id}&versionId={vid}` - Get version
- `POST /api/projects/versions` - Create new version
- `PUT /api/projects/versions` - Update version
- `DELETE /api/projects/versions?address={address}&projectId={id}&versionId={vid}` - Delete version

**`/api/projects/actions/route.ts`** - Special operations

- `POST /api/projects/actions` with action types:
  - `duplicate` - Duplicate project with all versions
  - `export` - Export project as JSON
  - `import` - Import project from JSON
  - `setCurrentVersion` - Set current version for project

**`/api/projects/stats/route.ts`** - Statistics

- `GET /api/projects/stats?address={address}` - Get storage statistics

#### 🏷️ Metadata Operations (`/api/metadata/*`)

**`/api/metadata/upload/route.ts`** - NFT metadata

- `POST /api/metadata/upload` - Upload NFT metadata JSON to Storj
  - Body: `{ metadata: NFTMetadataInput, walletAddress: string }`
  - Returns: `{ uri: string, filename: string, metadata: NFTMetadataInput }`

#### 🗄️ Bucket Operations (`/api/bucket/*`)

**`/api/bucket/signed-url/route.ts`** - Signed URL generation

- `POST /api/bucket/signed-url` - Generate signed URL for secure file access
  - Body: `{ filename: string, expiresIn?: number }`
  - Returns: `{ url: string, filename: string, expiresIn: number, expiresAt: string }`

**`/api/bucket/list/route.ts`** - Object listing

- `GET /api/bucket/list?prefix={prefix}` - List objects with prefix
  - Returns: `{ objects: Array<...>, count: number, prefix: string }`

#### 📸 Existing Endpoints (Already Secure)

- `/api/users/profile/route.ts` - User profile CRUD
- `/api/users/profile/upload-photo/route.ts` - Profile photo uploads
- `/api/assets/upload/route.ts` - Asset uploads
- `/api/assets/list/route.ts` - Asset listing
- `/api/assets/delete/route.ts` - Asset deletion

### 3. Refactored Client Services

#### 🔄 Project Service (`apps/web/src/lib/project-service.ts`)

**Before**:

- Directly imported and used `getWormClient()` from `@dial/worm`
- Accessed Storj directly from client-side code

**After**:

- All functions now make `fetch()` calls to backend API endpoints
- No direct Storj access from client-side
- Clean separation of concerns

**Example transformation**:

```typescript
// Before
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const repo = getProjectRepository();
  const address = requireUserAddress();
  return repo.createProject(address, input);
}

// After
export async function createProject(
  input: CreateProjectInput
): Promise<Project> {
  const address = requireUserAddress();
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, ...input }),
  });
  return handleResponse<Project>(response);
}
```

All project operations refactored:

- ✅ `createProject()`
- ✅ `getProject()`
- ✅ `getAllProjects()`
- ✅ `getProjectsForGrid()`
- ✅ `updateProject()`
- ✅ `deleteProject()`
- ✅ `createVersion()`
- ✅ `getVersion()`
- ✅ `updateVersion()`
- ✅ `deleteVersion()`
- ✅ `setCurrentVersion()`
- ✅ `duplicateProject()`
- ✅ `exportProject()`
- ✅ `importProject()`
- ✅ `getStorageStats()`

#### 🏷️ Metadata Service (`apps/web/src/lib/metadata-service.ts`)

**Before**:

- Directly imported `getWormClient()` and `getPublicUrl()` from `@dial/worm`
- Created buffers and uploaded directly to Storj from client

**After**:

- Uses `/api/metadata/upload` endpoint
- All Storj operations handled server-side
- Cleaner client code with proper error handling

## 🔒 Environment Variables

### Backend Only (Secure)

These should be in `apps/web/.env.local` and are NEVER exposed to the client:

```env
# Storj S3 Configuration (Backend Only)
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=your_access_key_here
STORJ_SECRET_KEY=your_secret_key_here

# Public URL for accessing files
STORJ_PUBLIC_URL=https://link.storjshare.io/s/your-share-url/dial-wtf-users
```

### ❌ Removed (Previously Insecure)

These are NO LONGER used or needed:

- ~~`NEXT_PUBLIC_STORJ_ENDPOINT`~~
- ~~`NEXT_PUBLIC_STORJ_BUCKET`~~
- ~~`NEXT_PUBLIC_STORJ_ACCESS_KEY`~~
- ~~`NEXT_PUBLIC_STORJ_SECRET_KEY`~~
- ~~`NEXT_PUBLIC_STORJ_PUBLIC_URL`~~

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client-Side Code                         │
│  (Browser - No Credentials)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐            │
│  │  project-service │      │ metadata-service │            │
│  │     (refactored) │      │    (refactored)  │            │
│  └────────┬─────────┘      └────────┬─────────┘            │
│           │                          │                       │
│           │ fetch()                  │ fetch()              │
│           ▼                          ▼                       │
└───────────┼──────────────────────────┼───────────────────────┘
            │                          │
            │                          │
┌───────────┼──────────────────────────┼───────────────────────┐
│           │   Backend API Routes     │                       │
│           │   (Secure)               │                       │
├───────────┼──────────────────────────┼───────────────────────┤
│           │                          │                       │
│           ▼                          ▼                       │
│  ┌────────────────┐      ┌─────────────────┐               │
│  │  /api/projects │      │ /api/metadata   │               │
│  │  /api/bucket   │      │ /api/assets     │               │
│  └───────┬────────┘      └────────┬────────┘               │
│          │                        │                         │
│          │ getWormClient()        │ getWormClient()        │
│          ▼                        ▼                         │
│  ┌───────────────────────────────────────┐                 │
│  │      @dial/worm Client                │                 │
│  │  (Backend Only - Has Credentials)     │                 │
│  └──────────────┬────────────────────────┘                 │
│                 │                                           │
└─────────────────┼───────────────────────────────────────────┘
                  │
                  │ S3 API
                  ▼
         ┌─────────────────┐
         │  Storj Storage  │
         │   (Cloud)       │
         └─────────────────┘
```

## 🛡️ Security Benefits

1. **Credentials Never Exposed**: Storj access keys and secret keys never leave the server
2. **Controlled Access**: All storage operations go through authenticated API endpoints
3. **Request Validation**: Backend validates all requests before accessing Storj
4. **Rate Limiting**: Can easily add rate limiting to API endpoints
5. **Audit Trail**: All storage operations can be logged server-side
6. **User Authorization**: Backend can verify user permissions before operations

## 🧪 Testing Checklist

To verify the refactor works correctly, test these scenarios:

### ✅ Project Operations

- [ ] Create new project
- [ ] Get all projects
- [ ] Get single project by ID
- [ ] Update project metadata
- [ ] Delete project
- [ ] Create project version
- [ ] Update project version
- [ ] Delete project version
- [ ] Set current version
- [ ] Duplicate project
- [ ] Export project as JSON
- [ ] Import project from JSON
- [ ] Get storage statistics

### ✅ Metadata Operations

- [ ] Upload NFT metadata JSON
- [ ] Verify metadata accessible via returned URI

### ✅ Asset Operations (Already Working)

- [ ] Upload profile photo (avatar/banner)
- [ ] Upload workspace asset
- [ ] List assets
- [ ] Delete asset

### ✅ User Profile Operations (Already Working)

- [ ] Get user profile
- [ ] Update user profile
- [ ] Upload profile photos

## 🚀 Migration Guide

If you have existing code using the old pattern, here's how to migrate:

### Before (Client-Side Direct Access)

```typescript
import { getWormClient, ProjectRepository } from "@dial/worm";

const worm = getWormClient();
const repo = new ProjectRepository(worm);
const projects = await repo.getAllProjects(address);
```

### After (API Endpoints)

```typescript
import { getAllProjects } from "@/lib/project-service";

const projects = await getAllProjects();
// Note: address is managed by setCurrentUserAddress()
```

### For New Storage Features

When implementing new storage features, follow this pattern:

1. **Create Backend API Endpoint** (`apps/web/src/app/api/your-feature/route.ts`)

   - Import `getWormClient()` from `@dial/worm`
   - Validate request parameters
   - Perform Storj operations server-side
   - Return results to client

2. **Create/Update Client Service** (`apps/web/src/lib/your-service.ts`)
   - Make `fetch()` calls to your API endpoint
   - Handle responses and errors
   - Never import or use worm client directly

## 📝 Files Modified

### Modified Files

- `packages/worm/src/client.ts` - Removed NEXT_PUBLIC env var checks
- `apps/web/src/lib/project-service.ts` - Refactored to use API endpoints
- `apps/web/src/lib/metadata-service.ts` - Refactored to use API endpoints

### New Files Created

- `apps/web/src/app/api/projects/route.ts` - Project CRUD operations
- `apps/web/src/app/api/projects/versions/route.ts` - Version management
- `apps/web/src/app/api/projects/actions/route.ts` - Special operations
- `apps/web/src/app/api/projects/stats/route.ts` - Storage statistics
- `apps/web/src/app/api/metadata/upload/route.ts` - Metadata upload
- `apps/web/src/app/api/bucket/signed-url/route.ts` - Signed URL generation
- `apps/web/src/app/api/bucket/list/route.ts` - Object listing

### Existing Files (Already Secure)

- `apps/web/src/app/api/users/profile/route.ts`
- `apps/web/src/app/api/users/profile/upload-photo/route.ts`
- `apps/web/src/app/api/assets/upload/route.ts`
- `apps/web/src/app/api/assets/list/route.ts`
- `apps/web/src/app/api/assets/delete/route.ts`

## ⚡ Performance Considerations

- **Caching**: Consider adding caching for frequently accessed projects
- **Batch Operations**: For multiple operations, consider creating batch endpoints
- **Signed URLs**: Use signed URLs with appropriate expiration times
- **CDN**: Consider adding CDN for static assets if needed

## 🔄 Next Steps

1. **Remove Old Environment Variables**: Clean up any `NEXT_PUBLIC_STORJ_*` variables from `.env.local`
2. **Test All Operations**: Run through the testing checklist above
3. **Monitor Logs**: Check server logs for any Storj-related errors
4. **Update Documentation**: Update any user-facing docs that reference storage

## 📚 Additional Resources

- [Storj Documentation](https://docs.storj.io/)
- [S3Worm Package](https://www.npmjs.com/package/@decoperations/s3worm)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**Status**: ✅ Complete - All Storj operations now secured on backend
**Date**: November 25, 2025
**Author**: Cursor AI Agent
