# 🔧 Deployment Issue & Solution

## Issue

The bonding curve program fails to build with this error:
```
Failed to obtain package metadata: unknown variant `2024`, expected one of `2015`, `2018`, `2021`
```

## Root Cause

- Your Solana CLI version: **1.14.28** (too old)
- Your Anchor version: **0.30.1** (uses newer Rust features)
- Mismatch: Solana 1.14.x doesn't support Rust edition 2024

## Solution

### Option 1: Update Solana CLI (Recommended)

```bash
# Update Solana CLI to latest
solana-install update

# Or reinstall
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Verify
solana --version
# Should show: solana-cli 1.18.x or later
```

Then rebuild:
```bash
cd /Users/jeremy/Development/Dial.WTF/Colosseum
anchor build
```

### Option 2: Downgrade Anchor (Workaround)

```bash
# Uninstall current Anchor
cargo uninstall anchor-cli

# Install compatible version
cargo install --git https://github.com/coral-xyz/anchor --tag v0.28.0 anchor-cli --locked
```

Update `Anchor.toml`:
```toml
[toolchain]
anchor_version = "0.28.0"
```

Update `programs/bonding-curve/Cargo.toml`:
```toml
[dependencies]
anchor-lang = "0.28.0"
anchor-spl = "0.28.0"
```

### Option 3: Use Docker (Alternative)

```bash
# Use Anchor's official Docker image
docker run --rm -v $(pwd):/workspace -w /workspace projectserum/build:latest anchor build
```

## Quick Fix (Try This First)

```bash
# Update Solana
curl https://release.solana.com/v1.18.0/solana-install-init-aarch64-apple-darwin > solana_installer.sh
sh solana_installer.sh v1.18.0

# Restart terminal
source ~/.bashrc  # or source ~/.zshrc

# Verify
solana --version

# Build
cd /Users/jeremy/Development/Dial.WTF/Colosseum
anchor build
```

## If Build Succeeds

Once the build works, continue with deployment:

```bash
# 1. Get program ID
anchor keys list

# 2. Update program IDs in code (see DEPLOYMENT_GUIDE.md)

# 3. Rebuild with correct ID
anchor build

# 4. Deploy
anchor deploy --provider.cluster devnet

# 5. Verify
solana program show [PROGRAM_ID] --url devnet
```

## Alternative: Simplified Deployment

If you want to deploy NOW without fixing tooling issues, I can create a minimal Solana program using native Rust (no Anchor) that will compile with older tooling. Let me know!

## Status

**Current blockers**:
- ❌ Solana CLI too old (1.14.28)
- ✅ Anchor CLI installed (0.30.1)
- ✅ Rust toolchain updated (1.91.0)
- ✅ Devnet wallet funded (1 SOL)
- ✅ Program code ready

**Next action**: Update Solana CLI to 1.18.x or later

---

**Once Solana is updated, deployment should take < 5 minutes!** 🚀

