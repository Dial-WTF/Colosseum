# 🚀 Profile Storage Quick Start Guide

## Overview

This guide will help you quickly set up Storj storage for profile photos (avatars and banners) in Dial.WTF.

## ⚡ Quick Steps

### 1️⃣ Create Storj Account & Bucket (5 minutes)

1. Go to [storj.io](https://storj.io/) and sign up
2. Create a new bucket named `dial-wtf-users`

### 2️⃣ Generate S3 Credentials (2 minutes)

1. In Storj console, go to **Access** → **Create S3 Credentials**
2. Settings:
   - Name: `dial-wtf-dev`
   - Permissions: ✅ Read, ✅ Write, ✅ List, ✅ Delete
   - Bucket: Select `dial-wtf-users`
   - Expiration: No expiration
3. Click **Create Access**
4. **Save these values** (shown only once):
   ```
   Access Key ID: jxxxxxxxxxxxxxxxxxxxxxxx
   Secret Access Key: jxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   Endpoint: https://gateway.storjshare.io
   ```

### 3️⃣ Create Public Link Share (2 minutes)

For users to view uploaded photos:

1. Go to your `dial-wtf-users` bucket
2. Click **Share** → **Create Link Share**
3. Settings:
   - Name: `public-photos`
   - Permissions: ✅ Read only (UNCHECK Write!)
   - Path: (leave empty for full bucket access)
   - Expiration: No expiration
4. Click **Create Link Share**
5. **Copy the URL** (looks like):
   ```
   https://link.storjshare.io/s/jxxxxxxxxxxxxxxxxxx/dial-wtf-users
   ```

### 4️⃣ Configure Environment Variables (1 minute)

Create `apps/web/.env.local` with your values:

```env
# Storj S3 Configuration
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=paste_your_access_key_here
STORJ_SECRET_KEY=paste_your_secret_key_here

# Public URL from link share (step 3)
STORJ_PUBLIC_URL=paste_your_link_share_url_here
```

### 5️⃣ Restart Dev Server (30 seconds)

```bash
# Stop current server (Ctrl+C)
# Start again
pnpm run dev
```

## ✅ Test Your Setup

1. Navigate to: `http://localhost:3000/dashboard/profile`
2. Click **Upload** on your avatar
3. Select an image
4. If successful:
   - ✅ No error messages
   - ✅ Avatar displays immediately
   - ✅ Image persists after page refresh

## 🚨 Troubleshooting

### "Missing Storj configuration" Error

**Problem**: Environment variables not found

**Fix**:
```bash
# Verify .env.local exists and has all 5 required variables
cat apps/web/.env.local

# Must have:
# - STORJ_ENDPOINT
# - STORJ_BUCKET
# - STORJ_ACCESS_KEY
# - STORJ_SECRET_KEY
# - STORJ_PUBLIC_URL
```

Then restart your dev server.

### Upload Works But Image Doesn't Display

**Problem**: `STORJ_PUBLIC_URL` is incorrect or link share not configured

**Fix**:
1. Go to Storj console → Your bucket → Share
2. Verify link share exists with **Read** permission
3. Copy the exact URL (including the `/dial-wtf-users` at the end)
4. Update `STORJ_PUBLIC_URL` in `.env.local`
5. Restart dev server

### "Access Denied" or 403 Errors

**Problem**: S3 credentials don't have required permissions

**Fix**:
1. Go to Storj console → Access
2. Delete old access grant
3. Create new one with **all permissions** (Read, Write, List, Delete)
4. Update credentials in `.env.local`
5. Restart dev server

## 📋 Example .env.local

Here's a complete example (with fake values):

```env
# Storj Configuration
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=jxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STORJ_SECRET_KEY=jxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STORJ_PUBLIC_URL=https://link.storjshare.io/s/jxxxxxxxxxxxxxxxxxx/dial-wtf-users
```

## 🎯 What Happens Next?

Once configured:

- ✅ Users can upload profile photos (avatars & banners)
- ✅ Photos are stored in decentralized Storj storage
- ✅ Photos are publicly accessible via the link share URL
- ✅ File structure: `users/{wallet-address}/avatar-{timestamp}.png`
- ✅ Max file size: 5MB
- ✅ Supported formats: JPEG, PNG, GIF, WebP

## 📁 Storage Structure

Your Storj bucket will look like:

```
dial-wtf-users/
  └── users/
      ├── 0x90aEbE5d30064f4E1e308cf...10Ac9/
      │   ├── avatar-1699123456789.png
      │   ├── banner-1699123456790.png
      │   └── profile.json
      ├── 0x123...abc/
      │   └── avatar-1699123456791.jpg
      └── ...
```

## 🔐 Security Notes

- ✅ `.env.local` is gitignored by default - never commit it
- ✅ Link share is read-only - users can't delete/overwrite files
- ✅ Write access only via authenticated API routes
- ✅ Each user's files are organized by their wallet address
- ⚠️ Anyone with the link share URL can view uploaded photos (by design)

## 🎨 Optional: AI Photo Generation

To enable AI-generated profile photos, you'll also need:

1. Replicate API account at [replicate.com](https://replicate.com/)
2. Add to `.env.local`:
   ```env
   REPLICATE_API_TOKEN=your_replicate_token_here
   ```

Without this, users can still upload photos manually.

## 📚 More Information

- [Full Storj Setup Guide](./STORJ_PROFILE_SETUP.md) - Detailed documentation
- [Worm Package Setup](./WORM_SETUP.md) - Complete data storage setup
- [Storj Documentation](https://docs.storj.io/) - Official Storj docs

## 🆘 Still Having Issues?

Common issues:

1. **Typos in environment variables** - Variable names are case-sensitive
2. **Missing bucket at end of URL** - `STORJ_PUBLIC_URL` should end with `/dial-wtf-users`
3. **Wrong permissions** - S3 credentials need all 4 permissions (RWLD)
4. **Expired access** - Check if access grant has expired
5. **Wrong bucket name** - Must match exactly: `dial-wtf-users`

Double-check your setup against this guide. If still stuck, verify each step carefully.

---

**Setup time**: ~10 minutes total
**Cost**: Free tier available (150GB storage, 150GB bandwidth/month)

