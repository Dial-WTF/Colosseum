# 🎨 Solana NFT Minting Setup Guide

This guide explains how to set up and configure the Solana NFT minting functionality for Dial.WTF.

## 📋 Prerequisites

1. **Solana CLI** installed (for generating keypairs)
2. **Storj Storage** configured (for hosting NFT metadata and assets)
3. **Privy** configured (for wallet authentication)

## 🔑 Solana Wallet Setup

### Generate a Payer Keypair

The payer keypair is used to pay for transaction fees when minting NFTs. This is a "hot wallet" that stays on your server.

```bash
# Install Solana CLI if you haven't already
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate a new keypair
solana-keygen new --no-bip39-passphrase -o ~/solana-payer.json

# Get the public address (you'll need to fund this)
solana-keygen pubkey ~/solana-payer.json
```

### Fund Your Payer Wallet

**For Devnet (Testing):**
```bash
# Switch to devnet
solana config set --url https://api.devnet.solana.com

# Airdrop some SOL for testing
solana airdrop 2 <YOUR_PAYER_ADDRESS>
```

**For Mainnet (Production):**
- Send real SOL to the payer address from your wallet
- Keep it topped up to cover minting fees (~0.02 SOL per mint)

### Get the Private Key in Base58 Format

```bash
# Convert the keypair to base58
# Install bs58 CLI if needed: cargo install bs58
cat ~/solana-payer.json | jq -r '[.[]] | @json' | bs58 --encode
```

Or use this Node.js script:
```javascript
const fs = require('fs');
const bs58 = require('bs58');

const keypair = JSON.parse(fs.readFileSync('~/solana-payer.json', 'utf-8'));
const privateKey = bs58.encode(Buffer.from(keypair));
console.log('Base58 Private Key:', privateKey);
```

## ⚙️ Environment Variables

Add these to your `apps/web/.env.local` file:

```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# Solana Payer Keypair (Base58 encoded)
SOLANA_PAYER_PRIVATE_KEY=<your_base58_private_key_here>
```

### Production Configuration

For mainnet, update to:
```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta
```

**⚠️ Important Security Notes:**
- Never commit your private key to git
- Use environment variables or a secrets manager
- Consider using a dedicated RPC provider (Helius, QuickNode, etc.) for better performance
- Regularly monitor your payer wallet balance

## 🚀 How It Works

### Minting Flow

```
1. User creates audio/content in Studio
   └─> Audio file is generated/uploaded to Storj

2. User clicks "Package & Mint NFT"
   └─> Opens mint packager interface

3. User configures NFT metadata
   ├─> Name, symbol, description
   ├─> Cover image (upload or generate)
   ├─> Bonding curve settings
   ├─> Royalty percentage
   └─> NFT type (Master Edition, SFT, cNFT)

4. User clicks "Mint NFT"
   └─> Client sends request to /api/nft/mint

5. Server processes minting
   ├─> Uploads metadata JSON to Storj
   ├─> Creates NFT on Solana using Metaplex
   ├─> Transfers NFT to user's wallet
   └─> Returns mint address & explorer URL

6. User sees success message
   └─> Can view NFT on Solscan/Explorer
```

### NFT Types Supported

1. **Master Edition** - Unique 1/1 NFT
   - Best for: Rare, one-of-a-kind pieces
   - Fee: ~0.02 SOL

2. **Semi-Fungible Token (SFT)** - Limited edition series
   - Best for: Ringtones, stickers with multiple editions
   - Uses bonding curve pricing
   - Fee: ~0.015 SOL per mint

3. **Compressed NFT (cNFT)** - Coming soon
   - Best for: Large-scale drops (1000s of NFTs)
   - Fee: ~0.001 SOL per mint

## 🔧 API Endpoints

### `POST /api/nft/mint`
Mint a new NFT on Solana.

**Request Body:**
```json
{
  "name": "Ringtone 001",
  "symbol": "RING",
  "description": "A cool ringtone",
  "imageUrl": "https://...",
  "audioUrl": "https://...",
  "walletAddress": "user_wallet_address",
  "nftType": "sft",
  "royaltyPercentage": 5,
  "bondingCurve": {
    "type": "linear",
    "basePrice": 100000000,
    "priceIncrement": 10000000,
    "maxSupply": 100
  },
  "attributes": [
    { "trait_type": "Duration", "value": "30s" },
    { "trait_type": "Genre", "value": "Electronic" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "mint": "mint_address",
  "metadata": "metadata_account_address",
  "tokenAccount": "token_account_address",
  "signature": "transaction_signature",
  "explorerUrl": "https://solscan.io/...",
  "metadataUri": "https://link.storjshare.io/...",
  "estimatedFee": 0.015
}
```

### `GET /api/nft/mint/estimate?nftType=sft`
Estimate minting fees.

**Response:**
```json
{
  "nftType": "sft",
  "estimatedFee": 0.015,
  "currency": "SOL"
}
```

## 📊 Monitoring

### Check Payer Balance
```bash
solana balance <YOUR_PAYER_ADDRESS>
```

### View Transaction on Solscan
```
Devnet: https://solscan.io/tx/<signature>?cluster=devnet
Mainnet: https://solscan.io/tx/<signature>
```

## 🐛 Troubleshooting

### "Insufficient funds" Error
- Check payer wallet balance: `solana balance <address>`
- Airdrop more SOL (devnet) or send more SOL (mainnet)

### "Blockhash not found" Error
- RPC might be overloaded, try switching to a different RPC provider
- Add retry logic with exponential backoff

### Metadata Not Loading
- Verify Storj public URL is configured correctly
- Check that the metadata JSON is publicly accessible
- Ensure CORS headers are set if accessing from browser

## 🔐 Best Practices

1. **Use Dedicated RPC Provider**: Free RPCs are rate-limited and slow
   - Helius (recommended): https://helius.dev
   - QuickNode: https://quicknode.com
   - Alchemy: https://alchemy.com

2. **Monitor Wallet Balance**: Set up alerts when balance drops below threshold

3. **Implement Rate Limiting**: Prevent abuse of your minting API

4. **Add Transaction Retry Logic**: Handle temporary RPC failures gracefully

5. **Consider Client-Side Signing**: Let users pay their own tx fees
   - More decentralized
   - User maintains full control
   - You don't need to manage hot wallet

## 📚 Resources

- [Solana Docs](https://docs.solana.com/)
- [Metaplex Docs](https://docs.metaplex.com/)
- [Token Metadata Standard](https://docs.metaplex.com/programs/token-metadata/)
- [Solana Cookbook](https://solanacookbook.com/)

