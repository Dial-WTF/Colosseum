# 🚀 Mainnet Deployment - Bonding Curve Program

**Deployed:** October 31, 2025

## Program Details

- **Program ID:** `8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G`
- **Transaction Signature:** `Ay1L3XTdEfQasGYfksWpvu6h7ZQ3T6YvtKiwVnJEQfJSH9jqTv3PHAESZFySJbvaxur26s9bGR1JurncSVBSfJG`
- **Network:** Solana Mainnet Beta
- **Program Size:** 221,704 bytes (217 KB)
- **Deployment Cost:** 1.55 SOL

## Payer Information

- **Wallet Address:** `2agjAkvMhkUHsUipNK7uvfhnCiWaJbnAc6uvBQ3g3kWC`
- **Initial Balance:** 1.6078269 SOL
- **Remaining Balance:** ~0.06 SOL

## Explorer Links

- **Program:** https://solscan.io/account/8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G
- **Transaction:** https://solscan.io/tx/Ay1L3XTdEfQasGYfksWpvu6h7ZQ3T6YvtKiwVnJEQfJSH9jqTv3PHAESZFySJbvaxur26s9bGR1JurncSVBSfJG

## Program Features

✅ **Initialize Bonding Curve**
- Set base price, price increment, and max supply
- Creates a PDA for the collection

✅ **Linear Bonding Curve Pricing**
- Formula: `price = base_price + (current_supply × price_increment)`
- Example: base=0.1 SOL, increment=0.01 SOL → Edition #1: 0.1 SOL, #2: 0.11 SOL, #3: 0.12 SOL

✅ **Mint with Payment**
- Buyer pays calculated price
- Payment goes directly to authority
- Mints SPL token to buyer

✅ **Query Price**
- Get current price for next edition
- Track total supply and volume

## Program Functions

1. **`initialize_curve`**
   - Parameters: `base_price`, `price_increment`, `max_supply`
   - Creates bonding curve state account

2. **`mint_edition`**
   - Calculates current price
   - Transfers SOL from buyer to authority
   - Mints 1 token to buyer
   - Increments supply counter

3. **`get_price`**
   - Returns current price for next edition
   - Read-only, no state changes

## State Account Structure

```rust
pub struct BondingCurve {
    pub authority: Pubkey,          // 32 bytes
    pub collection_mint: Pubkey,    // 32 bytes
    pub base_price: u64,            // 8 bytes
    pub price_increment: u64,       // 8 bytes
    pub max_supply: u32,            // 4 bytes
    pub current_supply: u32,        // 4 bytes
    pub total_volume: u64,          // 8 bytes
    pub bump: u8,                   // 1 byte
}
```

## Next Steps

1. ✅ Program deployed to mainnet
2. ⏳ Update SDK with new program ID
3. ⏳ Test minting flow
4. ⏳ Add frontend integration
5. ⏳ Optional: Add Metaplex metadata on frontend

## Notes

- This is a **minimal version** optimized for size
- No built-in Metaplex metadata (can be added via frontend)
- Fully functional for bonding curve pricing and minting
- Can be upgraded later if needed

## Upgrade Path

To add more features later:
```bash
solana program upgrade target/deploy/bonding_curve.so \
  --program-id 8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G \
  --upgrade-authority <AUTHORITY_KEYPAIR>
```

