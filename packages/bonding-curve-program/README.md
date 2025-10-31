# @dial/bonding-curve-program

TypeScript SDK for interacting with the Dial.WTF bonding curve Solana program.

## Installation

```bash
pnpm add @dial/bonding-curve-program
```

## Usage

### Initialize a Bonding Curve

```typescript
import { BondingCurveClient, CurveType, solToLamports } from '@dial/bonding-curve-program';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection('https://api.devnet.solana.com');
const client = new BondingCurveClient(connection);

// Initialize curve
const tx = await client.initializeCurve({
  authority: authorityPublicKey,
  collectionMint: collectionMintPublicKey,
  curveType: CurveType.Linear,
  basePrice: solToLamports(0.1), // 0.1 SOL
  priceIncrement: solToLamports(0.01), // 0.01 SOL per edition
  maxSupply: 100,
});

// Sign and send transaction
await sendAndConfirmTransaction(connection, tx, [authoritySigner]);
```

### Mint an Edition

```typescript
// Mint new edition with bonding curve pricing
const mintTx = await client.mintEdition({
  collectionMint: collectionMintPublicKey,
  editionMint: editionMintPublicKey,
  buyer: buyerPublicKey,
  authority: authorityPublicKey,
});

// User signs and pays
await sendAndConfirmTransaction(connection, mintTx, [buyerSigner]);
```

### Get Current Price

```typescript
// Fetch current price for next edition
const currentPrice = await client.getCurrentPrice(collectionMintPublicKey);

console.log(`Next edition costs: ${formatSol(currentPrice)} SOL`);
```

### Fetch Curve State

```typescript
// Get full curve state
const curveState = await client.fetchBondingCurve(collectionMintPublicKey);

console.log(`Supply: ${curveState.currentSupply}/${curveState.maxSupply}`);
console.log(`Total Volume: ${formatSol(curveState.totalVolume)} SOL`);
```

## Curve Types

### Linear
Price increases by fixed amount per edition:
```
price = basePrice + (edition - 1) * increment
```

### Exponential
Price grows exponentially:
```
price = basePrice * (1 + growthFactor)^(edition - 1)
```

### Logarithmic
Price increases quickly then levels off:
```
price = basePrice + increment * log2(edition)
```

## Program Structure

### State Accounts

**BondingCurve** - Main state account storing curve parameters
- `authority` - Creator/owner of the curve
- `collectionMint` - Associated NFT collection
- `curveType` - Linear/Exponential/Logarithmic
- `basePrice` - Starting price in lamports
- `priceIncrement` - Price increase rate
- `maxSupply` - Maximum editions
- `currentSupply` - Current minted count
- `totalVolume` - Total SOL traded

### Instructions

1. **initialize_curve** - Create new bonding curve
2. **mint_edition** - Mint edition with automatic pricing
3. **update_curve** - Update parameters (authority only)
4. **close_curve** - Close and reclaim rent (authority only, must be empty)

## Development

### Build the SDK

```bash
pnpm build
```

### Build the Program

```bash
cd programs/bonding-curve
anchor build
```

### Deploy

```bash
anchor deploy --provider.cluster devnet
```

### Test

```bash
anchor test
```

## License

MIT

