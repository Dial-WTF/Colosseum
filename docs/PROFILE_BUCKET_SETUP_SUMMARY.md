# 📦 Profile Bucket Entity - Configuration Summary

## ✅ What Has Been Configured

### 🏗️ Infrastructure

**Worm Client Enhancements** (`packages/worm/src/client.ts`):
- ✅ Added `getPublicUrl()` helper function for generating public URLs
- ✅ Exports public URL helper in package index
- ✅ Automatically handles URL formatting and cleanup

**Upload Photo API** (`apps/web/src/app/api/users/profile/upload-photo/route.ts`):
- ✅ Integrated with worm client for Storj uploads
- ✅ Uses `getPublicUrl()` for correct public URL generation
- ✅ Validates file types (JPEG, PNG, GIF, WebP)
- ✅ Enforces 5MB max file size
- ✅ Organizes files by user address: `users/{address}/{type}-{timestamp}.ext`

**Profile Management** (`apps/web/src/app/api/users/profile/route.ts`):
- ✅ Already integrated with worm client
- ✅ Handles profile CRUD operations
- ✅ Graceful fallback if Storj not configured

**User Profile Entity** (`packages/worm/src/entities/user-profile.ts`):
- ✅ Has `avatarUrl` and `bannerUrl` fields
- ✅ Properly integrated with base entity
- ✅ Supports social links and bio

### 📚 Documentation

**Quick Start Guide** (`PROFILE_STORAGE_QUICKSTART.md`):
- ✅ Step-by-step setup instructions
- ✅ Troubleshooting section
- ✅ Example configuration

**Detailed Setup Guide** (`STORJ_PROFILE_SETUP.md`):
- ✅ Comprehensive Storj configuration
- ✅ Security best practices
- ✅ File specifications

**Updated Worm Setup** (`WORM_SETUP.md`):
- ✅ Added link share creation instructions
- ✅ Updated environment variable requirements

## 🔧 What You Need to Do

### Required: Set Up Storj Storage

The profile photo upload system requires Storj configuration. You have **two options**:

#### Option 1: Full Setup (Recommended)
Follow the **Quick Start Guide**: [`PROFILE_STORAGE_QUICKSTART.md`](./PROFILE_STORAGE_QUICKSTART.md)

**Time**: ~10 minutes
**Result**: Fully functional profile photo uploads

#### Option 2: Skip for Now
The app will work without Storj, but:
- ❌ Profile photo uploads will fail
- ✅ All other features work normally
- ⚠️ Error messages will appear on profile page

### Environment Variables Required

Create `apps/web/.env.local` with these values:

```env
# Storj S3 Configuration
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=your_access_key_here
STORJ_SECRET_KEY=your_secret_key_here

# Public URL for uploaded files
STORJ_PUBLIC_URL=https://link.storjshare.io/s/your-share-url/dial-wtf-users
```

**Where to get these values**:
1. Sign up at [storj.io](https://storj.io/)
2. Create bucket named `dial-wtf-users`
3. Generate S3 credentials (Access → Create S3 Credentials)
4. Create link share (Bucket → Share → Create Link Share)
5. Copy all values to `.env.local`

## 🎯 How It Works

### Upload Flow

1. **User Action**: User clicks "Upload" on profile page
2. **File Validation**: API validates file type and size
3. **Upload to Storj**: File uploaded via worm client
4. **Generate URL**: Public URL created from link share
5. **Update Profile**: Avatar/banner URL saved to profile.json
6. **Display**: Image immediately displayed on profile

### Storage Structure

```
Storj Bucket: dial-wtf-users
├── users/
│   └── {wallet-address}/
│       ├── profile.json          (user profile data)
│       ├── avatar-{timestamp}.png (profile picture)
│       ├── banner-{timestamp}.jpg (banner image)
│       └── ...
```

### File Organization

- **Path**: `users/{address}/{type}-{timestamp}.{ext}`
- **Example**: `users/0x90a...10Ac9/avatar-1699123456789.png`
- **Access**: Public via link share URL
- **Max Size**: 5MB
- **Formats**: JPEG, PNG, GIF, WebP

## 🔐 Security Model

### Write Access (S3 Credentials)
- ✅ Full read/write/list/delete permissions
- ✅ Only accessible server-side (not exposed to client)
- ✅ Used by API routes only

### Read Access (Link Share)
- ✅ Public read-only access
- ✅ Allows users to view uploaded photos
- ❌ No write/delete permissions
- ⚠️ Anyone with URL can view files (by design)

## 📊 Current State

### ✅ Completed
- [x] Worm client configured
- [x] Profile entity with avatar/banner support
- [x] Upload API endpoint
- [x] Public URL generation
- [x] Profile management integration
- [x] Documentation complete

### 🔧 Requires User Action
- [ ] Create Storj account
- [ ] Generate S3 credentials
- [ ] Create link share
- [ ] Add environment variables to `.env.local`
- [ ] Restart dev server

### 🎨 Optional Enhancements
- [ ] Set up Replicate API for AI-generated avatars (see `REPLICATE_API_TOKEN`)
- [ ] Configure separate buckets for dev/staging/production
- [ ] Add image optimization/resizing
- [ ] Implement avatar caching

## 🚀 Next Steps

### Immediate (Required for Profile Photos)
1. Follow **Quick Start Guide**: `PROFILE_STORAGE_QUICKSTART.md`
2. Create `.env.local` with Storj credentials
3. Restart dev server
4. Test upload on `/dashboard/profile`

### Future Enhancements
1. **AI Generation**: Add Replicate token for AI avatars
2. **Image Processing**: Add resize/optimize before upload
3. **CDN**: Consider CDN for better performance
4. **Backup**: Set up automated bucket backups

## 🧪 Testing

### Manual Test
```bash
# 1. Start dev server
pnpm run dev

# 2. Navigate to profile
open http://localhost:3000/dashboard/profile

# 3. Try uploading an avatar
# - Click "Upload" button
# - Select an image < 5MB
# - Verify it displays correctly
# - Refresh page - image should persist
```

### Expected Results
- ✅ Upload shows loading state
- ✅ Image displays immediately after upload
- ✅ Public URL is valid and accessible
- ✅ Profile.json updated with new avatarUrl
- ✅ Image persists after page refresh

## 📞 Support Resources

- **Quick Start**: `PROFILE_STORAGE_QUICKSTART.md` - Fast setup
- **Detailed Guide**: `STORJ_PROFILE_SETUP.md` - Comprehensive docs
- **Worm Package**: `WORM_SETUP.md` - Data storage setup
- **Storj Docs**: https://docs.storj.io/ - Official documentation

## 🎯 Summary

The profile bucket entity is **fully configured** in the codebase. All that's needed is:

1. **Storj account setup** (10 minutes)
2. **Environment variables** (in `.env.local`)
3. **Dev server restart**

Then profile photo uploads will work end-to-end.

**Current status**: ⚠️ Waiting for Storj credentials
**Next action**: Follow `PROFILE_STORAGE_QUICKSTART.md`

