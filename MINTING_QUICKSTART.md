# 🚀 Solana Minting - Quick Start

Get your NFT minting up and running in 10 minutes!

## ✅ What's Been Implemented

You now have a complete Solana NFT minting system:

- ✅ **Metadata Service** - Uploads NFT metadata JSON to Storj
- ✅ **Solana Minting Service** - Creates NFTs using Metaplex SDK
- ✅ **API Endpoint** - `/api/nft/mint` for backend minting
- ✅ **Client Library** - Easy-to-use frontend minting helpers
- ✅ **Progress Modal** - Beautiful UI with real-time progress
- ✅ **Studio Integration** - Mint button wired up in audio studios

## 📦 New Files Created

### Services & Libraries
```
apps/web/src/lib/
├── metadata-service.ts        # NFT metadata upload & formatting
├── solana-mint-service.ts     # Solana NFT creation with Metaplex
└── nft-mint-client.ts         # Client-side minting helpers
```

### API Routes
```
apps/web/src/app/api/nft/mint/
└── route.ts                   # POST /api/nft/mint endpoint
```

### UI Components
```
apps/web/src/components/mint/
└── minting-progress-modal.tsx # Progress tracking modal
```

### Documentation
```
./
├── SOLANA_MINTING_SETUP.md          # Complete setup guide
├── SOLANA_MINTING_IMPLEMENTATION.md # Technical implementation details
└── NFT_MINTING_TESTING.md           # Testing guide & test cases
```

## 🔧 Quick Setup (5 Minutes)

### 1. Install Dependencies (Already Done ✅)

```bash
cd apps/web
pnpm install
```

Packages installed:
- `@metaplex-foundation/js` - Metaplex SDK
- `@metaplex-foundation/mpl-token-metadata` - Token metadata program
- `@solana/spl-token` - SPL token utilities

### 2. Generate Solana Keypair

```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate keypair
solana-keygen new --no-bip39-passphrase -o ~/solana-payer.json

# Get address
solana-keygen pubkey ~/solana-payer.json
```

### 3. Fund Wallet (Devnet)

```bash
# Switch to devnet
solana config set --url https://api.devnet.solana.com

# Airdrop SOL
solana airdrop 2 $(solana-keygen pubkey ~/solana-payer.json)
```

### 4. Get Base58 Private Key

```bash
# Install bs58 if needed
npm install -g bs58-cli

# Convert to base58
cat ~/solana-payer.json | jq -r 'map(tostring) | join(",")' | bs58 --encode
```

### 5. Set Environment Variables

Add to `apps/web/.env.local`:

```bash
# Solana Configuration
SOLANA_PAYER_PRIVATE_KEY=<your_base58_private_key>
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Storj (already configured)
STORJ_ACCESS_KEY_ID=<existing>
STORJ_SECRET_ACCESS_KEY=<existing>
STORJ_BUCKET=<existing>
STORJ_PUBLIC_URL=<existing>
```

### 6. Start Dev Server

```bash
pnpm dev
```

## 🎯 How to Use

### From Audio Studio

1. **Create/Load Audio**
   - Generate with AI or upload file
   
2. **Click "Package & Mint"**
   - Purple button in toolbar
   
3. **Configure NFT**
   - Add name, symbol, description
   - Upload or generate cover image
   - Set royalty percentage
   - Configure bonding curve
   
4. **Mint NFT**
   - Review details
   - Click "Mint NFT"
   - Watch progress modal
   - Get Solscan link when complete!

### Programmatically

```typescript
import { mintNFT } from '@/lib/nft-mint-client';

const result = await mintNFT(
  {
    name: "My Ringtone",
    symbol: "RING",
    description: "Cool audio NFT",
    imageUrl: "https://...",
    audioUrl: "https://...",
    walletAddress: userAddress,
    nftType: "sft",
    royaltyPercentage: 5,
    bondingCurve: {
      type: "linear",
      basePrice: 100000000, // 0.1 SOL in lamports
      priceIncrement: 10000000, // 0.01 SOL
      maxSupply: 100,
    },
    attributes: [
      { trait_type: "Duration", value: "30s" },
      { trait_type: "Genre", value: "Electronic" },
    ],
  },
  (progress) => {
    console.log(progress.message, progress.percentage);
  }
);

console.log("Minted!", result.mint);
console.log("View at:", result.explorerUrl);
```

## 🎨 NFT Types Supported

### 1. Master Edition (Unique 1/1)
```typescript
nftType: "master-edition"
```
- Perfect for rare collectibles
- One unique NFT
- ~0.02 SOL minting fee

### 2. Semi-Fungible Token (Limited Edition)
```typescript
nftType: "sft"
```
- Multiple editions from same metadata
- Bonding curve pricing
- ~0.015 SOL per mint
- Best for ringtones!

### 3. Compressed NFT (Future)
```typescript
nftType: "cnft"
```
- Ultra-low cost
- ~0.001 SOL per mint
- Coming soon!

## 📊 Bonding Curves

### Linear
```typescript
{
  type: "linear",
  basePrice: solToLamports(0.1),
  priceIncrement: solToLamports(0.01),
  maxSupply: 100
}
```
Price increases by fixed amount per mint.

### Exponential
```typescript
{
  type: "exponential",
  basePrice: solToLamports(0.05),
  growthFactor: 1.1, // 10% increase per mint
  maxSupply: 100
}
```
Price grows exponentially (FOMO effect!).

### Logarithmic
```typescript
{
  type: "logarithmic",
  basePrice: solToLamports(0.5),
  scaleFactor: solToLamports(0.1),
  maxSupply: 100
}
```
Price increases quickly then levels off.

## 🔍 Testing Your Setup

### Test Checklist

1. ✅ Dependencies installed
2. ✅ Payer wallet generated
3. ✅ Wallet funded with devnet SOL
4. ✅ Environment variables set
5. ✅ Dev server running
6. ✅ User wallet connected
7. ✅ Can load/create audio
8. ✅ Can open mint packager
9. ✅ Can configure metadata
10. ✅ Can mint NFT successfully

### Quick Test

```bash
# Check payer balance
solana balance $(solana-keygen pubkey ~/solana-payer.json)

# Should show something like:
# 2.0 SOL
```

### Manual Test Flow

1. Open `http://localhost:3000`
2. Connect wallet (top-right)
3. Go to Dashboard → Studio
4. Create new project
5. Load or generate audio
6. Click "Package & Mint" (📦 button)
7. Fill in metadata
8. Click "Mint NFT"
9. Watch progress modal
10. Click "View on Solscan"
11. Verify NFT on blockchain ✅

## 🐛 Common Issues

### "SOLANA_PAYER_PRIVATE_KEY not set"
- Add private key to `.env.local`
- Restart dev server

### "Insufficient funds"
```bash
solana airdrop 2 $(solana-keygen pubkey ~/solana-payer.json)
```

### "Failed to upload metadata"
- Check Storj env vars
- Verify bucket permissions

### "Transaction timeout"
- Use premium RPC (Helius, QuickNode)
- Retry minting

## 📚 Next Steps

### Move to Mainnet

1. Switch RPC to mainnet:
   ```bash
   SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   SOLANA_NETWORK=mainnet-beta
   ```

2. Fund payer with real SOL

3. Test with small amount first

4. Launch! 🚀

### Advanced Features

- [ ] Implement bonding curve smart contract
- [ ] Add compressed NFTs (cNFTs)
- [ ] Build marketplace integration
- [ ] Add batch minting
- [ ] Implement dynamic NFTs

## 📖 Documentation

For more details, see:

- **[SOLANA_MINTING_SETUP.md](./SOLANA_MINTING_SETUP.md)** - Complete setup guide
- **[SOLANA_MINTING_IMPLEMENTATION.md](./SOLANA_MINTING_IMPLEMENTATION.md)** - Technical details
- **[NFT_MINTING_TESTING.md](./NFT_MINTING_TESTING.md)** - Testing guide

## 🎉 You're Ready!

Everything is implemented and ready to go. Just:

1. ✅ Set up your wallet
2. ✅ Add environment variables  
3. ✅ Start minting! 🚀

**Need help?** Check the docs above or ask in [Solana Discord](https://discord.gg/solana).

