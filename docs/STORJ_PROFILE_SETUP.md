# 📸 Profile Photo Storage Setup with Storj

## Overview

This guide helps you configure Storj storage for profile photos (avatars and banners) in Dial.WTF.

## 🔧 Environment Variables Setup

You need to add the following variables to `apps/web/.env.local`:

```env
# Storj S3 Configuration
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=your_access_key_id_here
STORJ_SECRET_KEY=your_secret_access_key_here

# Public URL for accessing uploaded files
STORJ_PUBLIC_URL=https://link.storjshare.io/s/your-share-url
```

## 📋 Step-by-Step Setup

### 1. Create Storj Account

1. Visit [storj.io](https://storj.io/) and create an account
2. Complete email verification

### 2. Create a Bucket

1. Log in to the Storj console
2. Navigate to **Buckets** → **New Bucket**
3. Name it `dial-wtf-users` (or your preferred name)
4. Click **Create Bucket**

### 3. Create S3 Credentials

1. Navigate to **Access** → **Create S3 Credentials**
2. Configure the access grant:
   - **Name**: `dial-wtf-profile-photos`
   - **Permissions**: Select Read, Write, List, Delete
   - **Buckets**: Select your `dial-wtf-users` bucket
   - **Expiration**: Set to "No expiration"
3. Click **Create Access**
4. **IMPORTANT**: Copy these values immediately (they won't be shown again):
   - **Access Key ID** → `STORJ_ACCESS_KEY`
   - **Secret Access Key** → `STORJ_SECRET_KEY`
   - **Endpoint** → `STORJ_ENDPOINT` (usually `https://gateway.storjshare.io`)

### 4. Create Public Link Share

For users to view uploaded profile photos, you need to create a public link share:

1. Navigate to your bucket in the Storj console
2. Click **Share** → **Create Link Share**
3. Configure the link share:
   - **Name**: `public-profile-photos`
   - **Permissions**: Select "Read only"
   - **Path**: Leave empty (or specify `users/` if you want to limit it)
   - **Expiration**: Set to "No expiration"
4. Click **Create Link Share**
5. Copy the **Link Sharing URL** → `STORJ_PUBLIC_URL`

The URL will look like: `https://link.storjshare.io/s/jxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/dial-wtf-users`

### 5. Update Environment Variables

Create or update `apps/web/.env.local`:

```env
# Storj S3 Configuration
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=jxxxxxxxxxxxxxxxxxxxxxxxxx
STORJ_SECRET_KEY=jxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Public URL for accessing uploaded files
STORJ_PUBLIC_URL=https://link.storjshare.io/s/jxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx/dial-wtf-users
```

### 6. Restart Development Server

After adding the environment variables, restart your dev server:

```bash
# Stop the current server (Ctrl+C)
# Start again
pnpm run dev
```

## ✅ Verification

To verify your setup:

1. Navigate to `/dashboard/profile`
2. Click the "Upload" button on your avatar
3. Select an image file
4. If configured correctly, the upload should succeed and display your new avatar

## 🚨 Troubleshooting

### Error: "Missing Storj configuration"

- Verify all environment variables are set in `.env.local`
- Ensure there are no typos in variable names
- Restart your dev server after adding variables

### Error: "Access Denied" or 403

- Verify your S3 credentials have Read, Write, List, and Delete permissions
- Check that the bucket name matches your configuration
- Ensure the access grant hasn't expired

### Images Upload But Don't Display

- Verify your `STORJ_PUBLIC_URL` is correct
- Make sure the link share has "Read only" permission enabled
- Check that the link share hasn't expired
- Test the public URL directly in your browser: `{STORJ_PUBLIC_URL}/users/{address}/avatar-{timestamp}.png`

## 📁 File Storage Structure

Profile photos are stored in the following structure:

```
dial-wtf-users/
  └── users/
      └── [wallet-address]/
          ├── avatar-[timestamp].png
          ├── banner-[timestamp].png
          └── profile.json
```

## 🔐 Security Notes

- **Never commit `.env.local`** to git (it's already in `.gitignore`)
- Store your Storj credentials securely
- Rotate credentials periodically for security
- Use separate buckets for development and production
- Consider using different access grants with minimal permissions for different operations

## 🎨 Profile Photo Specifications

### Avatar Photos
- **Recommended size**: 512x512px
- **Max file size**: 5MB
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Display**: Circular crop in UI

### Banner Photos
- **Recommended size**: 1920x480px
- **Max file size**: 5MB
- **Supported formats**: JPEG, PNG, GIF, WebP
- **Display**: Full width, aspect ratio 4:1

## 🔄 Next Steps

After completing this setup, your profile photo system should be fully functional. You can:

1. Upload custom profile photos
2. Generate AI avatars (requires additional AI API setup)
3. Store and retrieve profile photos from decentralized storage
4. View profile photos across the platform

For AI generation setup, see the main setup documentation.

