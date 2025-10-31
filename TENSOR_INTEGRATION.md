# 🎯 Tensor.trade Integration

Complete integration with [Tensor.trade](https://www.tensor.trade/), the leading NFT marketplace on Solana, enabling seamless trading of published ringtone NFTs.

## 📋 Overview

This integration allows users to:
- **Trade NFTs** directly from the feed and marketplace
- **Share Tensor links** to social media
- **View listings** on Tensor.trade with one click
- **Track trading analytics** for recommendations

## 🔧 Implementation

### Core Utilities

**Location**: `apps/web/src/lib/tensor-utils.ts`

```typescript
import { openTensorItem, getTensorItemUrl } from '@/lib/tensor-utils';

// Open NFT on Tensor in new tab
openTensorItem(mintAddress);

// Get Tensor URL for an NFT
const url = getTensorItemUrl(mintAddress);

// Get Tensor collection URL
const collectionUrl = getTensorCollectionUrl('dial-tones-vol-1');
```

### Key Functions

#### `getTensorItemUrl(mintAddress: string): string`
Generate Tensor.trade URL for a specific NFT mint address.

```typescript
const url = getTensorItemUrl('7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs');
// Returns: https://www.tensor.trade/item/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs
```

#### `openTensorItem(mintAddress: string): void`
Open Tensor.trade item page in a new browser tab.

```typescript
// Opens in new tab with proper security attributes
openTensorItem(nft.mint);
```

#### `getTensorShareUrl(mintAddress: string, referralCode?: string): string`
Generate shareable Tensor link with optional referral tracking.

```typescript
const shareUrl = getTensorShareUrl(mintAddress, 'dialwtf');
// Returns: https://www.tensor.trade/item/[mint]?ref=dialwtf
```

#### `collectionNameToSlug(collectionName: string): string`
Convert collection names to Tensor-compatible URL slugs.

```typescript
const slug = collectionNameToSlug('Dial Tones Vol. 1');
// Returns: dial-tones-vol-1
```

## 🎨 UI Components

### Feed Card Integration

**Location**: `apps/web/src/components/feed/feed-card.tsx`

Each feed item now includes:
- ✅ **Trade button** in hover overlay (opens Tensor)
- ✅ **"View on Tensor"** link below card content
- ✅ **Share button** copies Tensor URL to clipboard
- ✅ **Analytics tracking** for trade clicks

```tsx
import { FeedCard } from '~/feed/feed-card';

<FeedCard
  item={feedItem}
  onBuy={(mint) => {
    // Automatically opens Tensor.trade
    // Analytics tracked via callback
  }}
/>
```

### Marketplace Grid

**Location**: `apps/web/src/components/marketplace/marketplace-grid.tsx`

Marketplace listings include:
- ✅ **"Trade on Tensor"** button on each card
- ✅ Direct navigation to Tensor marketplace
- ✅ Hover states and visual feedback

### Mint Success Modal

**Location**: `apps/web/src/components/mint/mint-success-modal.tsx`

Post-mint celebration modal with:
- ✅ **Trade Now** button (prominent CTA)
- ✅ **Copy Link** to share Tensor URL
- ✅ **Twitter Share** with pre-filled text
- ✅ NFT preview with mint details
- ✅ Tensor marketplace explanation

```tsx
import { MintSuccessModal } from '~/mint/mint-success-modal';

<MintSuccessModal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  nftData={{
    mintAddress: 'abc123...',
    name: 'My Ringtone',
    imageUrl: '🎵',
    price: 0.1,
    supply: 100
  }}
/>
```

## 🎯 User Flows

### 1. Browse & Trade Flow

```
User browses feed
  → Hovers over NFT card
    → Clicks "Trade" button
      → Opens Tensor.trade in new tab
        → User can buy/list NFT on Tensor
```

### 2. Mint & List Flow

```
User mints new NFT
  → Success modal appears
    → Clicks "Trade on Tensor"
      → Redirects to Tensor listing page
        → User can set price and list
```

### 3. Share Flow

```
User finds NFT to share
  → Clicks share button
    → Tensor URL copied to clipboard
      → User shares link on social media
        → Recipients can trade on Tensor
```

## 📊 Analytics Integration

All Tensor trading actions are tracked via the feed API:

```typescript
// Track purchase intent
await fetch('/api/feed/track', {
  method: 'POST',
  body: JSON.stringify({
    address: userAddress,
    action: 'purchase',
    itemMint: mintAddress,
  }),
});
```

This data feeds into the recommendation algorithm to:
- Show trending items
- Personalize user feeds
- Track conversion metrics
- Improve discovery

## 🚀 Features

### ✅ Implemented

- [x] Tensor URL generation utilities
- [x] Feed card integration with trade buttons
- [x] Marketplace grid integration
- [x] Mint success modal with Tensor CTA
- [x] Social sharing with Tensor links
- [x] Analytics tracking for trades
- [x] Collection slug conversion
- [x] Referral URL support

### 🔮 Future Enhancements

- [ ] **Tensor API Integration**: Fetch real-time floor prices and listings
- [ ] **Embedded Trading**: Inline Tensor widget for trading without leaving site
- [ ] **Portfolio View**: Show user's listed NFTs on Tensor
- [ ] **Price Alerts**: Notify users of price changes on Tensor
- [ ] **Bulk Listing**: List multiple NFTs to Tensor at once
- [ ] **Tensor Collection Stats**: Show volume, floor price, sales data
- [ ] **Affiliate Program**: Earn fees from Tensor referrals

## 🔗 External Resources

- **Tensor.trade**: https://www.tensor.trade/
- **Tensor Documentation**: https://docs.tensor.trade/
- **Tensor API**: https://api.tensor.trade/
- **Tensor Discord**: Join for support and updates

## 🛠️ Development

### Testing

```bash
# Test in development
pnpm dev

# Navigate to feed page
http://localhost:3000/feed

# Click any "Trade" button
# Verify Tensor opens in new tab
```

### Adding Tensor Integration to New Components

```typescript
import { openTensorItem, getTensorItemUrl } from '@/lib/tensor-utils';

function MyNFTComponent({ mint }: { mint: string }) {
  return (
    <button onClick={() => openTensorItem(mint)}>
      Trade on Tensor
    </button>
  );
}
```

## 📝 Notes

- All Tensor links open in new tabs with `noopener,noreferrer` for security
- Mint addresses must be valid Solana public keys
- Collection slugs are automatically generated from collection names
- Share functionality includes fallback for browsers without Web Share API
- Analytics tracking is non-blocking (failures logged but don't affect UX)

## 🤝 Contributing

When adding new Tensor integration points:

1. Import utilities from `@/lib/tensor-utils`
2. Use consistent button styling (see existing components)
3. Add analytics tracking for user actions
4. Include loading/error states
5. Test with both mock and real mint addresses
6. Update this documentation

---

**Built with ❤️ for the Dial.WTF community**

