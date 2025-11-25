import type { BondingCurveConfig } from './types';

/**
 * Calculate the price for a given supply based on bonding curve configuration
 */
export function calculatePrice(
  currentSupply: number,
  config: BondingCurveConfig
): number {
  const { type, basePrice, priceIncrement } = config;

  switch (type) {
    case 'linear':
      return basePrice + currentSupply * priceIncrement;

    case 'exponential':
      return basePrice * Math.pow(1 + priceIncrement, currentSupply);

    case 'logarithmic':
      return basePrice + priceIncrement * Math.log(currentSupply + 1);

    default:
      return basePrice;
  }
}

/**
 * Calculate total cost to mint multiple NFTs
 */
export function calculateTotalCost(
  currentSupply: number,
  quantity: number,
  config: BondingCurveConfig
): number {
  let totalCost = 0;

  for (let i = 0; i < quantity; i++) {
    totalCost += calculatePrice(currentSupply + i, config);
  }

  return totalCost;
}

/**
 * Format lamports to SOL with specified decimal places
 */
export function formatLamportsToSOL(lamports: number, decimals: number = 4): string {
  const sol = lamports / 1e9;
  return sol.toFixed(decimals);
}

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
  return Math.floor(sol * 1e9);
}

/**
 * Generate price points for chart visualization
 */
export function generatePricePoints(
  config: BondingCurveConfig,
  points: number = 50
): Array<{ supply: number; price: number }> {
  const step = Math.max(1, Math.floor(config.maxSupply / points));
  const pricePoints = [];

  for (let supply = 0; supply <= config.maxSupply; supply += step) {
    pricePoints.push({
      supply,
      price: calculatePrice(supply, config),
    });
  }

  // Ensure we have the final point
  if (pricePoints[pricePoints.length - 1].supply !== config.maxSupply) {
    pricePoints.push({
      supply: config.maxSupply,
      price: calculatePrice(config.maxSupply, config),
    });
  }

  return pricePoints;
}



