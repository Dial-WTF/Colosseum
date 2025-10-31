# 🧪 NFT Minting Testing Guide

Complete guide for testing the Solana NFT minting functionality end-to-end.

## ⚙️ Prerequisites Checklist

Before testing, ensure you have:

- [x] **Solana Payer Wallet** configured with funds
  - Devnet: Use `solana airdrop` to get test SOL
  - Mainnet: Send real SOL to payer address
  
- [x] **Environment Variables** set in `apps/web/.env.local`:
  ```bash
  SOLANA_PAYER_PRIVATE_KEY=your_base58_private_key
  SOLANA_RPC_URL=https://api.devnet.solana.com
  SOLANA_NETWORK=devnet
  NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
  
  # Storage (Storj via WORM)
  STORJ_ACCESS_KEY_ID=...
  STORJ_SECRET_ACCESS_KEY=...
  STORJ_BUCKET=...
  STORJ_PUBLIC_URL=...
  ```

- [x] **Privy Authentication** configured
- [x] **Storj Storage** set up and accessible
- [x] **Dependencies** installed: `pnpm install`

## 🚀 Testing Flow

### Step 1: Start the Development Server

```bash
cd apps/web
pnpm dev
```

Navigate to `http://localhost:3000`

### Step 2: Connect Wallet

1. Click **"Connect Wallet"** in the top-right
2. Sign in with your preferred method (email, wallet, social)
3. Ensure you have a Solana wallet connected
4. Verify your wallet address appears in the UI

### Step 3: Create Audio Content

**Option A: Generate Audio with AI**

1. Navigate to **Dashboard → Studio**
2. Click **"Create New Project"** or open existing
3. Click **"AI Generate"** to create audio
4. Enter a prompt (e.g., "upbeat ringtone")
5. Wait for generation to complete

**Option B: Upload Audio**

1. Navigate to **Dashboard → Studio**
2. Click **"Load Audio"**
3. Select an audio file from your computer
4. Audio will load into the waveform editor

### Step 4: Package & Mint NFT

1. Ensure audio is loaded in the studio
2. Click the **"Package & Mint"** button (📦 icon)
3. The Mint Packager modal will open

### Step 5: Configure NFT Metadata

**Metadata Tab:**

1. **Name**: Enter NFT name (e.g., "Ringtone 001")
2. **Symbol**: Enter token symbol (e.g., "RING")
3. **Description**: Describe your NFT
4. **Artist Name**: Your name or brand

**Cover Image:**

- **Option 1**: Upload image
  - Click "Upload Image"
  - Select PNG/JPG file (max 5MB)
  
- **Option 2**: Generate with AI
  - Click "Generate with AI"
  - Enter a prompt
  - Choose style (sticker, album cover, etc.)
  - Wait for generation

**Attributes:**

- Add custom metadata (optional)
- Examples: Genre, Mood, BPM, Duration
- Format: `trait_type` → `value`

**Tags:**

- Add searchable tags (optional)
- Examples: ringtone, electronic, upbeat

Click **"Next"** to proceed.

### Step 6: Configure Minting Options

**NFT Type:**

- **Master Edition**: Unique 1/1 NFT (~0.02 SOL fee)
- **SFT (Semi-Fungible)**: Limited edition with bonding curve (~0.015 SOL)
- **cNFT (Compressed)**: Coming soon (~0.001 SOL)

Select **SFT** for testing with bonding curves.

**Royalties:**

- Set creator royalty percentage (0-100%)
- Default: 5%
- This is paid to the creator on secondary sales

**Bonding Curve:**

Configure the pricing model:

- **Type**: Linear, Exponential, or Logarithmic
- **Base Price**: Starting price in SOL (e.g., 0.1)
- **Price Increment**: How much price increases per mint (e.g., 0.01)
- **Max Supply**: Maximum number of editions (e.g., 100)

The chart will update in real-time to show pricing curve.

Click **"Next"** to review.

### Step 7: Review & Mint

**Review Screen:**

- Verify all metadata is correct
- Check bonding curve configuration
- Review estimated costs:
  - NFT Minting: ~0.015 SOL
  - Metadata Storage: ~0.002 SOL
  - Network Fees: ~0.001 SOL
  - **Total**: ~0.018 SOL

Click **"Mint NFT"** to proceed.

### Step 8: Monitor Minting Progress

The minting progress modal will show:

1. **📤 Uploading Metadata** (10-20s)
   - Uploads metadata JSON to Storj
   - Generates public URL

2. **🪙 Creating NFT** (15-30s)
   - Submits transaction to Solana
   - Creates token mint account
   - Creates metadata account
   - Creates master edition (if applicable)

3. **🛡️ Confirming Transaction** (5-10s)
   - Waits for blockchain confirmation
   - Verifies transaction success

### Step 9: Verify Success

**Success Indicators:**

- ✅ Green checkmarks on all steps
- 🎉 Success message appears
- Mint address displayed
- "View on Solscan" button active

Click **"View on Solscan"** to see your NFT on the blockchain!

### Step 10: Verify On-Chain

**On Solscan:**

1. **Token Tab**: Verify mint address matches
2. **Metadata Tab**: Check name, symbol, description
3. **Attributes**: Verify all traits are correct
4. **Media**: Confirm image and audio load correctly
5. **Creators**: Verify creator address and royalty %

**Verify in Wallet:**

1. Open Phantom/Solflare wallet
2. Navigate to "Collectibles" or "NFTs"
3. Your NFT should appear (may take 1-2 minutes)
4. Click to view full details

## 🧪 Test Cases

### Test Case 1: Master Edition NFT

**Objective**: Mint a unique 1/1 audio NFT

**Steps**:
1. Create/load audio
2. Set NFT Type to "Master Edition"
3. Configure metadata
4. Mint NFT

**Expected Result**:
- NFT mints successfully
- Max supply = 0 (unlimited editions possible, but we use 1)
- Shows as unique NFT in wallet
- No bonding curve (fixed price)

### Test Case 2: SFT with Linear Bonding Curve

**Objective**: Create limited edition with linear pricing

**Configuration**:
- NFT Type: SFT
- Bonding Curve: Linear
- Base Price: 0.1 SOL
- Price Increment: 0.01 SOL
- Max Supply: 10

**Expected Results**:
- Edition #1: 0.1 SOL
- Edition #2: 0.11 SOL
- Edition #3: 0.12 SOL
- Edition #10: 0.19 SOL

### Test Case 3: SFT with Exponential Bonding Curve

**Objective**: Create edition with exponential pricing

**Configuration**:
- NFT Type: SFT
- Bonding Curve: Exponential
- Base Price: 0.05 SOL
- Growth Factor: 1.1 (10% increase)
- Max Supply: 20

**Expected Results**:
- Edition #1: 0.05 SOL
- Edition #5: ~0.073 SOL
- Edition #10: ~0.118 SOL
- Edition #20: ~0.30 SOL

### Test Case 4: Cover Image Upload

**Objective**: Upload custom cover art

**Steps**:
1. Prepare image (PNG/JPG, <5MB)
2. Click "Upload Image" in mint packager
3. Select image file
4. Verify preview displays correctly
5. Complete minting

**Expected Result**:
- Image uploads to Storj successfully
- Public URL generated
- NFT displays custom cover art on Solscan

### Test Case 5: AI-Generated Cover Art

**Objective**: Generate cover art with AI

**Steps**:
1. Click "Generate with AI"
2. Enter prompt: "futuristic neon ringtone cover"
3. Select style: "Sticker"
4. Wait for generation
5. Complete minting

**Expected Result**:
- Image generates successfully
- Preview displays in UI
- NFT uses AI-generated cover art

## 🐛 Common Issues & Solutions

### Issue: "Wallet address is required"

**Cause**: User wallet not connected

**Solution**: 
1. Click "Connect Wallet"
2. Complete authentication
3. Retry minting

### Issue: "Server configuration error: SOLANA_PAYER_PRIVATE_KEY not set"

**Cause**: Environment variable missing

**Solution**:
1. Generate keypair (see SOLANA_MINTING_SETUP.md)
2. Add to `.env.local`
3. Restart dev server

### Issue: "Failed to upload NFT metadata"

**Cause**: Storj configuration issue

**Solution**:
1. Verify STORJ env vars are set
2. Test with `pnpm test:storj` (if available)
3. Check bucket permissions

### Issue: "Insufficient funds"

**Cause**: Payer wallet has insufficient SOL

**Solution**:
```bash
# For devnet
solana airdrop 2 YOUR_PAYER_ADDRESS

# For mainnet
# Send SOL from your wallet
```

### Issue: "Blockhash not found"

**Cause**: RPC node overloaded or transaction expired

**Solution**:
1. Use dedicated RPC provider (Helius, QuickNode)
2. Retry minting
3. Check Solana network status

### Issue: "Transaction simulation failed"

**Cause**: Various on-chain errors

**Solution**:
1. Check console for detailed error
2. Verify wallet has sufficient SOL
3. Ensure metadata format is correct
4. Try again with different parameters

## 📊 Performance Benchmarks

**Expected Timings** (Devnet):

| Step | Duration | Notes |
|------|----------|-------|
| Metadata Upload | 5-15s | Depends on file sizes |
| NFT Creation | 10-20s | Blockchain confirmation |
| Total | 15-35s | Typical flow |

**Expected Costs** (Devnet/Mainnet):

| Item | Cost | Description |
|------|------|-------------|
| Master Edition | ~0.02 SOL | Unique NFT |
| SFT | ~0.015 SOL | Limited edition |
| cNFT | ~0.001 SOL | Compressed (future) |
| Storage | Included | Via Storj |

## ✅ Success Criteria

A successful test should:

1. ✅ Upload metadata to Storj without errors
2. ✅ Create NFT on Solana within 30 seconds
3. ✅ Generate valid mint address
4. ✅ Display NFT on Solscan correctly
5. ✅ Show all metadata fields properly
6. ✅ Load cover image and audio file
7. ✅ Reflect correct bonding curve pricing
8. ✅ Set proper royalty percentages
9. ✅ Transfer NFT to user's wallet
10. ✅ Return valid explorer URL

## 🔄 Continuous Testing

**Automated Tests** (Coming Soon):

```bash
# Run integration tests
pnpm test:minting

# Run end-to-end tests
pnpm test:e2e
```

## 📝 Reporting Issues

When reporting minting issues, include:

1. **Steps to reproduce**
2. **Console logs** (browser dev tools)
3. **Transaction signature** (if available)
4. **Solscan URL** (if minted)
5. **Environment** (devnet/mainnet)
6. **RPC provider** used
7. **Error messages** (full stack trace)

## 🎓 Next Steps

After successful testing:

1. **Switch to Mainnet**
   - Update RPC URLs
   - Fund payer wallet with real SOL
   - Update SOLANA_NETWORK env var

2. **Implement Bonding Curve Contract**
   - Deploy Solana program for pricing
   - Handle edition tracking on-chain
   - Implement automatic pricing updates

3. **Add User-Paid Minting**
   - Let users pay their own tx fees
   - Implement client-side signing
   - Remove need for hot wallet

4. **Optimize Performance**
   - Use faster RPC provider
   - Batch metadata uploads
   - Implement caching

5. **Add Analytics**
   - Track minting success rate
   - Monitor transaction times
   - Log errors for debugging

---

**Happy Minting! 🎨🚀**

