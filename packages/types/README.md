# @dial/types

Shared type definitions for the Dial.WTF ecosystem.

## Overview

This package contains domain-specific TypeScript type definitions used across the Dial.WTF platform.

## Installation

```bash
pnpm add @dial/types
```

## Usage

```typescript
import type { RingtoneNFT, StickerNFT, NFTType } from '@dial/types';

const ringtone: RingtoneNFT = {
  id: '1',
  mint: 'abc123...',
  name: 'Dial Tones Vol. 1',
  // ...
};
```

## Types

### NFT Types

```typescript
type NFTType = 'master-edition' | 'sft' | 'cnft';

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}
```

### Ringtone NFTs

```typescript
interface RingtoneNFT {
  id: string;
  mint: string;
  name: string;
  description: string;
  imageUrl: string;
  audioUrl: string;
  supply: number;
  maxSupply: number;
  price: number;
  bondingCurve: BondingCurveConfig; // from @dial/bonding-curve
  creator: string;
  createdAt: number;
}
```

### Sticker NFTs

```typescript
interface StickerNFT {
  id: string;
  mint: string;
  name: string;
  description: string;
  imageUrl: string;
  supply: number;
  maxSupply: number;
  price: number;
  bondingCurve: BondingCurveConfig; // from @dial/bonding-curve
  creator: string;
  createdAt: number;
}
```

## Dependencies

This package depends on:
- `@dial/bonding-curve` - For BondingCurveConfig type



