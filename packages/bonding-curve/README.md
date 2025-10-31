# @dial/bonding-curve

Domain-specific package for bonding curve calculations and tokenomics.

## Overview

This package provides high-precision bonding curve calculations for NFT pricing mechanisms. It supports multiple curve types and includes both basic and advanced mathematical operations using Decimal.js for financial accuracy.

## Features

- **Multiple Curve Types**: Linear, Exponential, and Logarithmic pricing models
- **High Precision**: Uses Decimal.js for accurate financial calculations
- **Comprehensive Utilities**: Price calculations, ROI analysis, revenue projections
- **Type-Safe**: Full TypeScript support with exported types

## Installation

```bash
pnpm add @dial/bonding-curve
```

## Usage

### Basic Price Calculation

```typescript
import { calculatePrice, BondingCurveConfig } from '@dial/bonding-curve';

const config: BondingCurveConfig = {
  type: 'exponential',
  basePrice: 0.5,
  priceIncrement: 0.05,
  maxSupply: 100,
};

const price = calculatePrice(42, config); // Price at supply 42
```

### Calculate Total Cost

```typescript
import { calculateTotalCost } from '@dial/bonding-curve';

const totalCost = calculateTotalCost(0, 10, config); // Cost to mint 10 from supply 0
```

### High-Precision Calculations

```typescript
import { calculatePricePrecise, calculateAveragePrice } from '@dial/bonding-curve';

const precisePrice = calculatePricePrecise(42, config); // Returns Decimal
const avgPrice = calculateAveragePrice(100, config); // Average across all supply
```

### ROI Analysis

```typescript
import { calculateROI } from '@dial/bonding-curve';

const roi = calculateROI(10, 50, config);
// Returns: { buyPrice, sellPrice, profit, roiPercentage }
```

### Optimal Curve Estimation

```typescript
import { estimateOptimalCurve } from '@dial/bonding-curve';

const optimalCurve = estimateOptimalCurve(
  1000, // maxSupply
  0.5,  // targetFloorPrice
  10.0, // targetCeilingPrice
  'exponential'
);
```

## Curve Types

### Linear
- **Formula**: `basePrice + currentSupply * priceIncrement`
- **Use Case**: Steady, predictable price growth

### Exponential
- **Formula**: `basePrice * (1 + priceIncrement) ^ currentSupply`
- **Use Case**: Accelerating growth for premium collections

### Logarithmic
- **Formula**: `basePrice + priceIncrement * log(currentSupply + 1)`
- **Use Case**: Diminishing increases for accessibility

## Utilities

### Calculator (`calculator.ts`)
- `calculatePrice()` - Basic price calculation
- `calculateTotalCost()` - Multi-mint cost calculation
- `formatLamportsToSOL()` - Format lamports to SOL
- `solToLamports()` - Convert SOL to lamports
- `generatePricePoints()` - Generate chart data points

### Advanced (`advanced.ts`)
- `calculatePricePrecise()` - High-precision price calculation
- `calculateBatchPricePrecise()` - Precise batch calculations
- `calculateAveragePrice()` - Average price across supply
- `findSupplyAtPrice()` - Find supply at target price
- `calculateROI()` - Investment return analysis
- `calculateAppreciationRate()` - Price growth metrics
- `generatePriceTable()` - Detailed price table generation
- `estimateOptimalCurve()` - Auto-generate curve parameters

## Types

```typescript
interface BondingCurveConfig {
  type: 'linear' | 'exponential' | 'logarithmic';
  basePrice: number;      // Starting price
  priceIncrement: number; // Growth rate/increment
  maxSupply: number;      // Maximum supply
}
```

## Architecture

This package is designed to be:
- **Domain-Specific**: Focused solely on bonding curve logic
- **Framework-Agnostic**: Can be used in any TypeScript/JavaScript project
- **Precision-First**: Uses Decimal.js to avoid floating-point errors
- **Well-Typed**: Full TypeScript support with exported types


