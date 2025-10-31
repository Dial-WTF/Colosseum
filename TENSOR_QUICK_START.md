# 🚀 Tensor Integration - Quick Start

## 🎯 What You Got

**Tensor.trade is now fully integrated!** Users can trade their NFTs on Solana's leading marketplace with one click.

---

## 📍 Where to Find It

### 1. Feed Page (`/feed`)
Every NFT card has:
- **"Trade" button** (in hover overlay) → Opens Tensor
- **"View on Tensor" link** (below card) → Opens Tensor
- **Share button** → Copies Tensor URL

### 2. Marketplace Page (`/marketplace`)
Every listing has:
- **"Trade on Tensor" button** → Opens Tensor marketplace

### 3. After Minting (Studio)
Success modal appears with:
- **"Trade on Tensor"** (big gradient button)
- Copy link & Twitter share
- NFT preview

---

## 🔧 How It Works

```typescript
// 1. Import utilities
import { openTensorItem, getTensorItemUrl } from '@/lib/tensor-utils';

// 2. Open Tensor for an NFT
openTensorItem('mint-address-here');

// 3. Get Tensor URL
const url = getTensorItemUrl('mint-address-here');
// → https://www.tensor.trade/item/mint-address-here
```

---

## 🎨 Try It Now

1. **Start dev server** (if not running):
   ```bash
   pnpm dev
   ```

2. **Open feed page**:
   ```
   http://localhost:3000/feed
   ```

3. **Hover over any NFT card** → See "Trade" button

4. **Click "Trade" or "View on Tensor"** → Opens in new tab

---

## 📦 Files Modified

```
✅ apps/web/src/lib/tensor-utils.ts (NEW)
✅ apps/web/src/components/feed/feed-card.tsx (UPDATED)
✅ apps/web/src/components/feed/infinite-feed.tsx (UPDATED)
✅ apps/web/src/components/marketplace/marketplace-grid.tsx (UPDATED)
✅ apps/web/src/components/mint/mint-success-modal.tsx (NEW)
```

---

## 🎯 Key Features

| Feature | Status | Location |
|---------|--------|----------|
| Trade from Feed | ✅ | feed-card.tsx |
| Trade from Marketplace | ✅ | marketplace-grid.tsx |
| Post-Mint Success | ✅ | mint-success-modal.tsx |
| Social Sharing | ✅ | All components |
| Analytics Tracking | ✅ | infinite-feed.tsx |

---

## 💡 Usage in Your Code

**Basic:**
```typescript
import { openTensorItem } from '@/lib/tensor-utils';

<button onClick={() => openTensorItem(nft.mint)}>
  Trade on Tensor
</button>
```

**With custom handling:**
```typescript
import { getTensorItemUrl } from '@/lib/tensor-utils';

const handleTrade = () => {
  const url = getTensorItemUrl(nft.mint);
  console.log('Trading at:', url);
  window.open(url, '_blank');
};
```

**Collection URLs:**
```typescript
import { getTensorCollectionUrl, collectionNameToSlug } from '@/lib/tensor-utils';

const slug = collectionNameToSlug('Dial Tones Vol. 1');
const url = getTensorCollectionUrl(slug);
// → https://www.tensor.trade/trade/dial-tones-vol-1
```

---

## 📊 What Gets Tracked

Every interaction is tracked for analytics:

- 👁️  **Views**: When user sees an NFT
- ❤️  **Likes**: When user favorites
- 💰 **Purchases**: When user clicks trade

This powers the recommendation algorithm!

---

## 🐛 Troubleshooting

**Q: Trade button doesn't work?**
A: Check browser console for errors. Ensure mint address is valid.

**Q: Tensor opens wrong page?**
A: Verify mint address format. Should be valid Solana public key.

**Q: Share copies wrong URL?**
A: Check `getTensorItemUrl()` is being used, not `window.location.href`.

---

## 📚 Full Documentation

- **Technical Docs**: `TENSOR_INTEGRATION.md`
- **Implementation Summary**: `TENSOR_INTEGRATION_SUMMARY.md`
- **This Guide**: `TENSOR_QUICK_START.md`

---

## 🎉 That's It!

Your NFTs can now be traded on Tensor.trade! 🚀

**Questions?** Check the docs or search the code for `tensor-utils`.


