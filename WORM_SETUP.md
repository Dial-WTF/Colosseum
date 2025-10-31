# @dial/worm Setup Guide

## Overview

The `@dial/worm` package provides S3WORM-based data storage for Dial.WTF, using Storj for decentralized, S3-compatible storage. User data is organized by wallet address in the format `/users/[address]/`.

## Installation

The package is already installed as a workspace dependency. No additional installation required.

## Storj Configuration

### 1. Create Storj Account

1. Visit [storj.io](https://storj.io/) and create an account
2. Complete the registration process

### 2. Create S3 Credentials

1. Log in to the Storj console
2. Navigate to **Access** → **Create S3 Credentials**
3. Configure the access grant:
   - **Name**: `dial-wtf-production` (or your preferred name)
   - **Permissions**: Select all (Read, Write, List, Delete)
   - **Buckets**: Select "All buckets" or create a specific bucket named `dial-wtf-users`
   - **Expiration**: Set to "No expiration" or your preferred timeframe

4. Click **Create Access** to generate credentials

5. Copy the following values:
   - **Access Key ID**
   - **Secret Access Key**
   - **Endpoint** (usually `https://gateway.storjshare.io`)

### 3. Create Public Link Share (for profile photos)

To allow public access to uploaded profile photos:

1. Navigate to your bucket in the Storj console
2. Click **Share** → **Create Link Share**
3. Configure the link share:
   - **Name**: `public-profile-photos`
   - **Permissions**: Select "Read only"
   - **Path**: Leave empty (or specify `users/` to limit access)
   - **Expiration**: Set to "No expiration"
4. Click **Create Link Share**
5. Copy the **Link Sharing URL** (looks like: `https://link.storjshare.io/s/jxxx.../dial-wtf-users`)

### 4. Configure Environment Variables

Add the following to `apps/web/.env.local`:

```env
# Storj S3 Configuration (for user data storage)
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_BUCKET=dial-wtf-users
STORJ_ACCESS_KEY=your_access_key_id_here
STORJ_SECRET_KEY=your_secret_access_key_here

# Public URL for accessing uploaded files (get this from Storj link share)
STORJ_PUBLIC_URL=https://link.storjshare.io/s/your-share-url/dial-wtf-users

# For client-side Storj usage (if needed)
NEXT_PUBLIC_STORJ_ENDPOINT=https://gateway.storjshare.io
NEXT_PUBLIC_STORJ_BUCKET=dial-wtf-users
NEXT_PUBLIC_STORJ_ACCESS_KEY=your_access_key_id_here
NEXT_PUBLIC_STORJ_SECRET_KEY=your_secret_access_key_here
```

## Usage Examples

### Server-Side API Routes

#### Initialize a New User

```typescript
import { getWormClient, UserRepository } from '@dial/worm';

const worm = getWormClient();
const userRepo = new UserRepository(worm);

// Initialize user with all data structures
const userData = await userRepo.initializeUser('wallet_address_here', {
  displayName: 'Alice',
  bio: 'NFT collector and creator',
});

console.log(userData.profile);
console.log(userData.collection);
console.log(userData.activity);
console.log(userData.settings);
```

#### Get User Profile

```typescript
const profile = await userRepo.getProfile('wallet_address_here');

if (profile) {
  console.log(profile.displayName);
  console.log(profile.bio);
} else {
  console.log('Profile not found');
}
```

#### Update User Profile

```typescript
const profile = await userRepo.getProfile('wallet_address_here');

if (profile) {
  profile.displayName = 'New Name';
  profile.bio = 'Updated bio';
  profile.socialLinks = {
    twitter: '@alice',
    discord: 'alice#1234',
  };

  await userRepo.saveProfile(profile);
}
```

#### Manage NFT Collection

```typescript
const collection = await userRepo.getCollection('wallet_address_here');

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

  // Save changes
  await userRepo.saveCollection(collection);
}
```

#### Track User Activity

```typescript
const activity = await userRepo.getActivity('wallet_address_here');

if (activity) {
  // Add activity event
  activity.addEvent({
    type: 'purchase',
    mint: 'NFT_MINT_ADDRESS',
    signature: 'TRANSACTION_SIGNATURE',
    amount: 0.5,
    otherParty: 'seller_wallet_address',
    description: 'Purchased Cool Ringtone #42',
  });

  await userRepo.saveActivity(activity);

  // Get recent activities
  const recent = activity.getRecentActivities(10);
  console.log(recent);
}
```

### API Route Example

See `apps/web/src/app/api/users/[address]/profile/route.ts` for a complete example.

## Data Structure

### User Profile (`profile.json`)
```typescript
{
  address: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  socialLinks?: {
    twitter?: string;
    discord?: string;
    telegram?: string;
    website?: string;
  };
  email?: string;
  emailVerified: boolean;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

### User Collection (`collection.json`)
```typescript
{
  address: string;
  nfts: Array<{
    mint: string;
    name: string;
    description?: string;
    image?: string;
    audio?: string;
    attributes?: Record<string, any>;
    tokenStandard?: string;
    edition?: number;
    supply?: number;
    acquiredAt: string;
    purchasePrice?: number;
  }>;
  totalCount: number;
  totalValue: number;
  favorites: string[];
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

### User Activity (`activity.json`)
```typescript
{
  address: string;
  events: Array<{
    id: string;
    type: 'mint' | 'purchase' | 'sale' | 'transfer' | 'list' | 'delist' | 'bid' | 'offer' | 'profile_update' | 'collection_update';
    timestamp: string;
    mint?: string;
    signature?: string;
    amount?: number;
    otherParty?: string;
    metadata?: Record<string, any>;
    description?: string;
  }>;
  totalCount: number;
  lastActivityAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

### User Settings (`settings.json`)
```typescript
{
  address: string;
  notifications: {
    email: boolean;
    push: boolean;
    newListings: boolean;
    priceChanges: boolean;
    outbid: boolean;
    salesActivity: boolean;
    newsletter: boolean;
  };
  privacy: {
    showCollection: boolean;
    showActivity: boolean;
    showProfile: boolean;
    allowDirectMessages: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    currency: 'SOL' | 'USD';
    gridSize: 'small' | 'medium' | 'large';
    showPrices: boolean;
  };
  advanced: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  version: number;
}
```

## API Routes

The following API routes are available:

### Profile Management
- `GET /api/users/[address]/profile` - Get user profile
- `PUT /api/users/[address]/profile` - Update user profile
- `POST /api/users/[address]/profile` - Initialize new user

### Collection Management
- `GET /api/users/[address]/collection` - Get user's NFT collection
- `POST /api/users/[address]/collection` - Update collection (add/remove NFTs)

## Security Considerations

1. **Client-Side vs Server-Side**: Use server-side environment variables (`STORJ_*`) for sensitive operations. Only expose public credentials (`NEXT_PUBLIC_STORJ_*`) if absolutely necessary.

2. **Address Validation**: Always validate Solana wallet addresses before performing operations.

3. **Rate Limiting**: Consider implementing rate limiting on API routes to prevent abuse.

4. **Access Control**: Implement proper authentication to ensure users can only access/modify their own data.

## Troubleshooting

### Environment Variables Not Found

**Error**: `Missing Storj configuration. Please set STORJ_ENDPOINT, STORJ_BUCKET, STORJ_ACCESS_KEY, and STORJ_SECRET_KEY in your environment.`

**Solution**: Ensure all required environment variables are set in `apps/web/.env.local`

### Connection Errors

**Error**: Connection timeout or network errors

**Solution**: 
- Verify Storj endpoint URL is correct
- Check that access credentials have not expired
- Ensure the bucket exists and is accessible

### Permission Errors

**Error**: Access denied or permission errors

**Solution**:
- Verify S3 credentials have proper permissions (Read, Write, List, Delete)
- Check that the bucket name is correct
- Ensure credentials have access to the specified bucket

## Development Tips

1. **Local Testing**: Use a separate Storj bucket for development/testing
2. **Error Handling**: Always wrap repository calls in try-catch blocks
3. **Data Validation**: Validate data before saving to prevent corrupted JSON
4. **Performance**: Consider implementing caching for frequently accessed data

## Additional Resources

- [Storj Documentation](https://docs.storj.io/)
- [S3 API Reference](https://docs.aws.amazon.com/AmazonS3/latest/API/Welcome.html)
- [@decoperations/s3worm Package](https://github.com/DecOperations/BucketDrive.WTF/tree/main/packages/s3worm)

