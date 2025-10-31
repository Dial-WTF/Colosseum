// Bonding Curve Configuration
export interface BondingCurveConfig {
  type: 'linear' | 'exponential' | 'logarithmic';
  basePrice: number;
  priceIncrement: number;
  maxSupply: number;
}

