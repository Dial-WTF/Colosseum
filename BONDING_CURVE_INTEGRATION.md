# 🎯 Bonding Curve + Metaplex Integration Guide

**Last Updated:** October 31, 2025  
**Mainnet Contract:** `8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G`

---

## 📋 Overview

The Dial.WTF bonding curve system is now **LIVE on Solana Mainnet**! This integration combines:

✅ **On-Chain Bonding Curve** - Automated linear pricing  
✅ **Metaplex Metadata** - Full NFT standard compliance  
✅ **Seamless Frontend** - Easy deployment & minting  

---

## 🚀 What's Available

### Currently Deployed (Mainnet)
- ✅ **Linear Bonding Curve** - `price = base + (supply × increment)`
- ✅ **Initialize Collection** - Set base price, increment, max supply
- ✅ **Mint with Payment** - Automatic pricing & payment transfer
- ✅ **Query Price** - Get current/next price
- ✅ **SPL Token Minting** - Creates tokens in buyer's wallet

### Coming Soon
- 🔜 **Exponential Curve** - Accelerating price growth
- 🔜 **Logarithmic Curve** - Diminishing increases
- 🔜 **Bezier Curve** - Custom curves with control points

---

## 🏗️ Architecture

```
User Creates Collection
      ↓
[Frontend] Deploy Collection
      ├─→ Upload to Arweave/IPFS
      ├─→ Create Metaplex Collection
      └─→ Initialize Bonding Curve (on-chain)
      
User Mints NFT
      ↓
[Frontend] Mint Edition
      ├─→ Query Current Price
      ├─→ Create Edition Mint
      ├─→ Upload Edition Metadata
      ├─→ Mint Through Curve (payment handled)
      └─→ Add Metaplex Metadata to Token
```

---

## 📁 Updated Files

### Program Files
- ✅ `programs/bonding-curve/src/lib.rs` - Mainnet program ID updated
- ✅ `Anchor.toml` - Mainnet config set
- ✅ `packages/bonding-curve-program/src/index.ts` - SDK updated

### Frontend Integration
- ✅ `apps/web/src/lib/bonding-curve-deploy.ts` - **NEW** Full deployment flow
- ✅ `apps/web/src/lib/bonding-curve-mint-service.ts` - Updated for mainnet
- ✅ `apps/web/src/components/mint/bonding-curve-editor.tsx` - Linear only, others "Coming Soon"

### Documentation
- ✅ `MAINNET_DEPLOYMENT.md` - Full deployment details
- ✅ `BONDING_CURVE_INTEGRATION.md` - This file

---

## 💻 Usage Example

### Deploy a Collection

```typescript
import { deployCollectionWithBondingCurve } from '@/lib/bonding-curve-deploy';
import { Connection, Keypair } from '@solana/web3.js';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const payer = Keypair.fromSecretKey(/* your keypair */);

const deployed = await deployCollectionWithBondingCurve({
  name: 'My Audio Collection',
  symbol: 'AUDIO',
  description: 'Limited edition audio NFTs',
  image: collectionImageBuffer,
  bondingCurve: {
    type: 'linear',
    basePrice: 0.1,        // 0.1 SOL for first edition
    priceIncrement: 0.01,  // +0.01 SOL per edition
    maxSupply: 100,        // 100 total editions
  }
}, payer, connection);

console.log('Collection Mint:', deployed.collectionMint.toString());
console.log('Bonding Curve PDA:', deployed.bondingCurvePDA.toString());
```

### Mint an Edition

```typescript
import { mintEditionWithMetadata } from '@/lib/bonding-curve-deploy';

const result = await mintEditionWithMetadata({
  collectionMint: deployed.collectionMint,
  bondingCurvePDA: deployed.bondingCurvePDA,
  editionNumber: 1,
  name: 'My Audio Collection',
  symbol: 'AUDIO',
  image: editionImageBuffer,
  attributes: [
    { trait_type: 'Rarity', value: 'Common' },
    { trait_type: 'Duration', value: '3:45' }
  ]
}, buyer, connection);

console.log('Minted at price:', result.price / 1e9, 'SOL');
console.log('Mint address:', result.mint.toString());
```

### Query Curve Info

```typescript
import { getBondingCurveInfo } from '@/lib/bonding-curve-deploy';

const info = await getBondingCurveInfo(collectionMint, connection);

console.log('Current Supply:', info.currentSupply, '/', info.maxSupply);
console.log('Current Price:', info.currentPrice, 'SOL');
console.log('Next Price:', info.nextPrice, 'SOL');
console.log('Total Volume:', info.totalVolume, 'SOL');
```

---

## 🎨 UI Integration

### Curve Type Selector

The bonding curve editor (`bonding-curve-editor.tsx`) now shows:
- ✅ **Linear** - Fully functional, click to select
- 🔜 **Exponential** - Disabled with "Soon" badge
- 🔜 **Logarithmic** - Disabled with "Soon" badge
- 🔜 **Bezier** - Disabled with "Soon" badge

### Pricing Display

Linear curve pricing example:
```
Base Price:     0.1 SOL
Increment:    + 0.01 SOL per edition

Edition #1:     0.10 SOL
Edition #2:     0.11 SOL
Edition #3:     0.12 SOL
Edition #10:    0.19 SOL
Edition #100:   1.09 SOL
```

---

## 🔐 Security Notes

1. **Authority Control** - Collection authority can close empty curves
2. **Payment Flow** - SOL goes directly from buyer → authority (no intermediary)
3. **Supply Limits** - Max supply enforced on-chain
4. **Rent-Exempt** - Program account is rent-exempt (1.55 SOL locked)

---

## 🧪 Testing Checklist

Before deploying to production:

- [ ] Test collection deployment on devnet
- [ ] Verify metadata uploads correctly
- [ ] Test minting flow (payment + metadata)
- [ ] Confirm pricing calculations match UI
- [ ] Check supply limits enforce correctly
- [ ] Verify explorer shows metadata properly

---

## 📊 Cost Breakdown

### Collection Deployment
| Item | Cost | Notes |
|------|------|-------|
| Metadata Upload | ~0.01 SOL | Arweave/IPFS |
| Collection NFT | ~0.01 SOL | Metaplex |
| Curve Initialization | ~0.002 SOL | On-chain state |
| **Total** | **~0.022 SOL** | Per collection |

### Edition Minting
| Item | Cost | Notes |
|------|------|-------|
| Metadata Upload | ~0.005 SOL | Per edition |
| Token Creation | ~0.002 SOL | SPL mint |
| Bonding Curve Price | Variable | Set by creator |
| **Total** | **Price + ~0.007 SOL** | Per mint |

---

## 🚀 Next Steps

1. **Build SDK**: `cd packages/bonding-curve-program && pnpm build`
2. **Update .env**: Add `NEXT_PUBLIC_BONDING_CURVE_PROGRAM_ID=8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G`
3. **Test Locally**: Deploy test collection on devnet
4. **Go Live**: Deploy to production with mainnet

---

## 📞 Support

- **Program ID**: `8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G`
- **Explorer**: https://solscan.io/account/8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G
- **Docs**: See `MAINNET_DEPLOYMENT.md` for full deployment details

---

**Happy Minting!** 🎉

