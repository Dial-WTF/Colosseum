# @dial/worm

S3WORM-based data storage for Dial.WTF, using Storj for decentralized storage.

## Overview

This package provides entity definitions and repositories for managing user data in Dial.WTF. User data is organized by wallet address in the format `/users/[address]/`, with separate JSON files for different data types:

- `profile.json` - User profile information
- `collection.json` - NFT collection data
- `activity.json` - User activity log
- `settings.json` - User preferences and settings

## Installation

This is a workspace package and is automatically available to other packages in the monorepo.

```bash
pnpm install
```

## Setup

### Environment Variables

Add the following to your `.env.local` file:

```env
# Storj S3 Configuration
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=your_access_key_id
STORJ_SECRET_KEY=your_secret_access_key

# For client-side usage (Next.js)
NEXT_PUBLIC_STORJ_ENDPOINT=https://gateway.storjshare.io
NEXT_PUBLIC_STORJ_BUCKET=dial-wtf-users
NEXT_PUBLIC_STORJ_ACCESS_KEY=your_access_key_id
NEXT_PUBLIC_STORJ_SECRET_KEY=your_secret_access_key
```

### Getting Storj Credentials

1. Create a Storj account at [storj.io](https://www.storj.io/)
2. Navigate to **Access** → **Create S3 Credentials**
3. Configure permissions (Read, Write, List, Delete)
4. Select your bucket or create a new one
5. Copy the credentials to your `.env.local`

## Usage

### Basic Usage

```typescript
import { getWormClient, UserRepository } from '@dial/worm';

// Get the configured client
const worm = getWormClient();

// Create a repository
const userRepo = new UserRepository(worm);

// Initialize a new user
const userData = await userRepo.initializeUser('0xabc123...', {
  displayName: 'Alice',
  bio: 'NFT collector and creator',
});

console.log(userData.profile); // UserProfile
console.log(userData.collection); // UserCollection
console.log(userData.activity); // UserActivity
console.log(userData.settings); // UserSettings
```

### Working with User Profiles

```typescript
// Get user profile
const profile = await userRepo.getProfile('0xabc123...');

if (profile) {
  // Update profile
  profile.displayName = 'New Name';
  profile.bio = 'Updated bio';
  profile.socialLinks = {
    twitter: '@alice',
    discord: 'alice#1234',
  };

  // Save changes
  await userRepo.saveProfile(profile);
} else {
  // Create new profile
  await userRepo.createProfile('0xabc123...', {
    displayName: 'Alice',
    bio: 'NFT enthusiast',
  });
}
```

### Managing NFT Collections

```typescript
// Get user collection
const collection = await userRepo.getCollection('0xabc123...');

if (collection) {
  // Add an NFT
  collection.addNFT({
    mint: 'NFT_MINT_ADDRESS',
    name: 'Cool Ringtone #42',
    description: 'Limited edition ringtone',
    image: 'ipfs://...',
    audio: 'ipfs://...',
    tokenStandard: 'MasterEdition',
    edition: 42,
    supply: 100,
    acquiredAt: new Date().toISOString(),
    purchasePrice: 0.5,
  });

  // Toggle favorite
  collection.toggleFavorite('NFT_MINT_ADDRESS');

  // Update collection value
  collection.updateValue();

  // Save changes
  await userRepo.saveCollection(collection);
}
```

### Tracking User Activity

```typescript
// Get activity log
const activity = await userRepo.getActivity('0xabc123...');

if (activity) {
  // Add a new activity
  activity.addEvent({
    type: 'purchase',
    mint: 'NFT_MINT_ADDRESS',
    signature: 'TRANSACTION_SIGNATURE',
    amount: 0.5,
    otherParty: '0xdef456...',
    description: 'Purchased Cool Ringtone #42',
  });

  // Get recent activities
  const recent = activity.getRecentActivities(10);

  // Get activities by type
  const purchases = activity.getActivitiesByType('purchase');

  // Save changes
  await userRepo.saveActivity(activity);
}
```

### Managing User Settings

```typescript
// Get user settings
const settings = await userRepo.getSettings('0xabc123...');

if (settings) {
  // Update notification settings
  settings.updateNotifications({
    email: true,
    priceChanges: false,
  });

  // Update privacy settings
  settings.updatePrivacy({
    showCollection: true,
    allowDirectMessages: false,
  });

  // Update display settings
  settings.updateDisplay({
    theme: 'dark',
    currency: 'USD',
  });

  // Save changes
  await userRepo.saveSettings(settings);
}
```

### Next.js API Route Example

```typescript
// app/api/users/[address]/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getWormClient, UserRepository } from '@dial/worm';

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const worm = getWormClient();
    const userRepo = new UserRepository(worm);
    
    const profile = await userRepo.getProfile(params.address);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const worm = getWormClient();
    const userRepo = new UserRepository(worm);
    const body = await request.json();
    
    let profile = await userRepo.getProfile(params.address);
    
    if (!profile) {
      // Create new profile
      profile = await userRepo.createProfile(params.address, body);
    } else {
      // Update existing profile
      Object.assign(profile, body);
      await userRepo.saveProfile(profile);
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Data Structure

All user data is stored in Storj with the following structure:

```
users/
  ├── [address]/
  │   ├── profile.json      # User profile
  │   ├── collection.json   # NFT collection
  │   ├── activity.json     # Activity log
  │   └── settings.json     # User settings
```

## Entities

### UserProfile
- `address` - Wallet address
- `displayName` - Display name
- `bio` - User bio
- `avatarUrl` - Avatar image URL
- `bannerUrl` - Banner image URL
- `socialLinks` - Social media links
- `email` - Email address
- `preferences` - Custom preferences

### UserCollection
- `address` - Wallet address
- `nfts` - Array of NFT items
- `totalCount` - Total NFT count
- `totalValue` - Collection value in SOL
- `favorites` - Favorite NFT mints

### UserActivity
- `address` - Wallet address
- `events` - Activity events array
- `totalCount` - Total event count
- `lastActivityAt` - Last activity timestamp

### UserSettings
- `address` - Wallet address
- `notifications` - Notification preferences
- `privacy` - Privacy settings
- `display` - Display preferences

## License

MIT

