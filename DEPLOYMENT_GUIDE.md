# 🚀 Bonding Curve Program - Deployment Guide

Step-by-step guide to deploy the bonding curve program to Solana devnet.

---

## 📋 Prerequisites

### 1. Install Solana CLI

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

Verify installation:
```bash
solana --version
# Should show: solana-cli 1.17.x or later
```

### 2. Install Anchor CLI

```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.29.0 anchor-cli --locked
```

Verify installation:
```bash
anchor --version
# Should show: anchor-cli 0.29.0
```

### 3. Install Rust (if not already installed)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

---

## 🔧 Configuration

### 1. Generate/Configure Solana Keypair

```bash
# Generate new keypair (if you don't have one)
solana-keygen new -o ~/.config/solana/id.json

# Or use existing keypair
solana config set --keypair ~/.config/solana/id.json
```

### 2. Set Solana to Devnet

```bash
solana config set --url https://api.devnet.solana.com
```

Verify:
```bash
solana config get
# Should show:
# RPC URL: https://api.devnet.solana.com
# WebSocket URL: wss://api.devnet.solana.com/
# Keypair Path: /Users/[you]/.config/solana/id.json
```

### 3. Get Devnet SOL

```bash
# Airdrop 2 SOL (may need to run multiple times)
solana airdrop 2

# Check balance
solana balance
# Should show: 2 SOL or more
```

---

## 🏗️ Build & Deploy

### Step 1: Build the Program

```bash
cd /Users/jeremy/Development/Dial.WTF/Colosseum

# Build the program
anchor build
```

**Expected output**:
```
Compiling bonding-curve v0.1.0
Finished release [optimized] target(s) in X.XXs
```

### Step 2: Get Program ID

```bash
# Get the program ID from the build
anchor keys list
```

**Example output**:
```
bonding_curve: BC11111111111111111111111111111111111111111
```

**Copy this program ID!** You'll need it in the next step.

### Step 3: Update Program ID in Code

Update the program ID in **3 files**:

**File 1**: `programs/bonding-curve/src/lib.rs`
```rust
// Line 5 - Update this:
declare_id!("YOUR_ACTUAL_PROGRAM_ID_HERE");
```

**File 2**: `packages/bonding-curve-program/src/index.ts`
```typescript
// Line 22 - Update this:
export const BONDING_CURVE_PROGRAM_ID = new PublicKey(
  'YOUR_ACTUAL_PROGRAM_ID_HERE'
);
```

**File 3**: `Anchor.toml`
```toml
# Lines 8, 11, 14 - Update these:
[programs.localnet]
bonding_curve = "YOUR_ACTUAL_PROGRAM_ID_HERE"

[programs.devnet]
bonding_curve = "YOUR_ACTUAL_PROGRAM_ID_HERE"

[programs.mainnet]
bonding_curve = "YOUR_ACTUAL_PROGRAM_ID_HERE"
```

### Step 4: Rebuild with New Program ID

```bash
# Rebuild with updated program ID
anchor build
```

### Step 5: Deploy to Devnet

```bash
# Deploy to devnet
anchor deploy --provider.cluster devnet
```

**Expected output**:
```
Deploying workspace: https://api.devnet.solana.com
Upgrade authority: [Your wallet address]
Deploying program "bonding_curve"...
Program path: /path/to/target/deploy/bonding_curve.so...
Program Id: [Your program ID]

Deploy success
```

### Step 6: Verify Deployment

```bash
# Check program on devnet
solana program show [YOUR_PROGRAM_ID] --url devnet
```

**Expected output**:
```
Program Id: [Your program ID]
Owner: BPFLoaderUpgradeab1e11111111111111111111111
ProgramData Address: [Some address]
Authority: [Your wallet address]
Last Deployed In Slot: [Some slot number]
Data Length: [Size in bytes]
Balance: X SOL
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Program deployed successfully
- [ ] Program ID matches in all 3 files
- [ ] Program is visible on Solana Explorer
- [ ] You are the upgrade authority
- [ ] Balance deducted from your wallet

### View on Solana Explorer

Open in browser:
```
https://explorer.solana.com/address/[YOUR_PROGRAM_ID]?cluster=devnet
```

---

## 🧪 Test Deployment

### Test 1: Initialize a Bonding Curve

```bash
cd packages/bonding-curve-program
pnpm install
pnpm build

# Run test script (create this next)
node dist/test-deployment.js
```

### Test 2: Verify State Account

```bash
# After initializing a curve, check the account
solana account [BONDING_CURVE_PDA] --url devnet
```

---

## 🐛 Troubleshooting

### "Insufficient funds"

```bash
# Request more SOL
solana airdrop 2
```

### "Program already exists"

If you need to redeploy:
```bash
# Close the existing program (returns rent)
solana program close [PROGRAM_ID] --bypass-warning

# Then redeploy
anchor deploy --provider.cluster devnet
```

### "Account not found"

Make sure you're on devnet:
```bash
solana config set --url https://api.devnet.solana.com
```

### Build errors

```bash
# Clean and rebuild
anchor clean
cargo clean
anchor build
```

---

## 💰 Deployment Costs

Approximate costs on devnet (free with airdrops):

- **Program deployment**: ~0.5 SOL (one-time)
- **Program data**: ~0.01 SOL per KB
- **Total estimate**: ~2 SOL

On mainnet:
- **Same costs but with real SOL**
- Keep ~5 SOL buffer for updates

---

## 🔄 Updating the Program

After deployment, you can update:

```bash
# Make code changes
# Rebuild
anchor build

# Deploy update (you must be upgrade authority)
anchor upgrade target/deploy/bonding_curve.so \
  --program-id [YOUR_PROGRAM_ID] \
  --provider.cluster devnet
```

---

## 🔐 Security Best Practices

### Before Mainnet

1. **Freeze Program** (make immutable):
```bash
solana program set-upgrade-authority [PROGRAM_ID] --final
```

2. **Security Audit**:
   - Professional audit recommended
   - Test extensively on devnet
   - Have emergency procedures

3. **Monitoring**:
   - Set up alerts for program usage
   - Monitor transaction patterns
   - Track total value locked

---

## 📊 Post-Deployment

### Next Steps

1. **Update Environment Variables**:
```bash
# In apps/web/.env.local
NEXT_PUBLIC_BONDING_CURVE_PROGRAM_ID=[YOUR_PROGRAM_ID]
```

2. **Build SDK**:
```bash
cd packages/bonding-curve-program
pnpm build
```

3. **Test in App**:
   - Initialize test collection
   - Mint test editions
   - Verify pricing

4. **Monitor**:
   - Watch Solana Explorer
   - Check transaction logs
   - Verify state updates

---

## 🎉 Success!

Your bonding curve program is now live on Solana devnet!

**Program ID**: `[YOUR_PROGRAM_ID]`  
**Explorer**: `https://explorer.solana.com/address/[YOUR_PROGRAM_ID]?cluster=devnet`  
**Status**: ✅ Deployed  

**Next**: Test minting and verify everything works before mainnet! 🚀

