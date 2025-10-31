import Decimal from 'decimal.js';
import type { BondingCurveConfig } from './types';
import { calculateBezierPrice } from './bezier';

// Configure Decimal.js for high precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_DOWN });

/**
 * Calculate the price for a specific edition using Decimal.js for precision
 */
export function calculatePricePrecise(
  currentSupply: number,
  config: BondingCurveConfig
): Decimal {
  const { type, basePrice, priceIncrement, maxSupply } = config;

  let price: Decimal;

  switch (type) {
    case 'linear':
      price = new Decimal(basePrice).plus(
        new Decimal(currentSupply).times(priceIncrement)
      );
      break;

    case 'exponential':
      price = new Decimal(basePrice).times(
        new Decimal(1 + priceIncrement).pow(currentSupply)
      );
      break;

    case 'logarithmic':
      const logValue = Math.log(currentSupply + 1);
      price = new Decimal(basePrice).plus(
        new Decimal(logValue).times(priceIncrement)
      );
      break;

    case 'bezier':
      if (!config.bezierCurve) {
        // Fallback to base price if no curve data
        price = new Decimal(basePrice);
      } else {
        price = calculateBezierPrice(
          currentSupply,
          maxSupply,
          config.bezierCurve
        );
      }
      break;

    default:
      price = new Decimal(basePrice);
  }

  return price;
}

/**
 * Calculate the total cost to mint multiple editions with high precision
 */
export function calculateBatchPricePrecise(
  startSupply: number,
  count: number,
  config: BondingCurveConfig
): Decimal {
  let totalCost = new Decimal(0);
  for (let i = 0; i < count; i++) {
    totalCost = totalCost.plus(calculatePricePrecise(startSupply + i, config));
  }
  return totalCost;
}

/**
 * Calculate the average price across all editions
 */
export function calculateAveragePrice(
  maxSupply: number,
  config: BondingCurveConfig
): Decimal {
  const totalRevenue = calculateBatchPricePrecise(0, maxSupply, config);
  return totalRevenue.dividedBy(maxSupply);
}

/**
 * Find the supply number where price reaches a target
 */
export function findSupplyAtPrice(
  targetPrice: number,
  config: BondingCurveConfig,
  maxSupply: number = 10000
): number | null {
  const target = new Decimal(targetPrice);

  for (let supply = 0; supply <= maxSupply; supply++) {
    const price = calculatePricePrecise(supply, config);
    if (price.greaterThanOrEqualTo(target)) {
      return supply;
    }
  }

  return null; // Price never reaches target within max supply
}

/**
 * Calculate the return on investment for buying at one supply and selling at another
 */
export function calculateROI(
  buySupply: number,
  sellSupply: number,
  config: BondingCurveConfig
): {
  buyPrice: Decimal;
  sellPrice: Decimal;
  profit: Decimal;
  roiPercentage: Decimal;
} {
  const buyPrice = calculatePricePrecise(buySupply, config);
  const sellPrice = calculatePricePrecise(sellSupply, config);
  const profit = sellPrice.minus(buyPrice);
  const roiPercentage = profit.dividedBy(buyPrice).times(100);

  return {
    buyPrice,
    sellPrice,
    profit,
    roiPercentage,
  };
}

/**
 * Calculate price appreciation rate between supply points
 */
export function calculateAppreciationRate(
  startSupply: number,
  endSupply: number,
  config: BondingCurveConfig
): Decimal {
  const startPrice = calculatePricePrecise(startSupply, config);
  const endPrice = calculatePricePrecise(endSupply, config);
  
  return endPrice
    .minus(startPrice)
    .dividedBy(startPrice)
    .times(100);
}

/**
 * Generate a price table for a range of supply points
 */
export function generatePriceTable(
  startSupply: number,
  endSupply: number,
  config: BondingCurveConfig,
  step: number = 1
): Array<{
  supply: number;
  price: Decimal;
  cumulativeRevenue: Decimal;
}> {
  const table = [];
  let cumulativeRevenue = new Decimal(0);

  for (let supply = startSupply; supply <= endSupply; supply += step) {
    const price = calculatePricePrecise(supply, config);
    cumulativeRevenue = cumulativeRevenue.plus(price);
    
    table.push({
      supply,
      price,
      cumulativeRevenue,
    });
  }

  return table;
}

/**
 * Estimate optimal bonding curve parameters for target metrics
 */
export function estimateOptimalCurve(
  maxSupply: number,
  targetFloorPrice: number,
  targetCeilingPrice: number,
  curveType: BondingCurveConfig['type'] = 'exponential'
): BondingCurveConfig {
  const floor = new Decimal(targetFloorPrice);
  const ceiling = new Decimal(targetCeilingPrice);

  switch (curveType) {
    case 'linear': {
      const increment = ceiling.minus(floor).dividedBy(maxSupply);
      return {
        type: 'linear',
        basePrice: targetFloorPrice,
        priceIncrement: increment.toNumber(),
        maxSupply,
      };
    }

    case 'exponential': {
      // Calculate growth rate: (ceiling/floor)^(1/maxSupply) - 1
      const ratio = ceiling.dividedBy(floor);
      const exponent = new Decimal(1).dividedBy(maxSupply);
      const growthRate = ratio.pow(exponent.toNumber()).minus(1);
      
      return {
        type: 'exponential',
        basePrice: targetFloorPrice,
        priceIncrement: growthRate.toNumber(),
        maxSupply,
      };
    }

    case 'logarithmic': {
      // For logarithmic: basePrice + log(maxSupply) * increment = ceiling
      // increment = (ceiling - basePrice) / log(maxSupply)
      const logSupply = Math.log(maxSupply + 1);
      const increment = ceiling.minus(floor).dividedBy(logSupply);
      
      return {
        type: 'logarithmic',
        basePrice: targetFloorPrice,
        priceIncrement: increment.toNumber(),
        maxSupply,
      };
    }

    default:
      return {
        type: 'linear',
        basePrice: targetFloorPrice,
        priceIncrement: 0,
        maxSupply,
      };
  }
}

/**
 * Convert Decimal lamports to SOL string with precision
 */
export function formatDecimalLamportsToSOL(lamports: Decimal, decimals: number = 2): string {
  const sol = lamports.dividedBy(1_000_000_000);
  return sol.toFixed(decimals);
}

/**
 * Convert SOL to lamports using Decimal for precision
 */
export function solToLamportsDecimal(sol: number): Decimal {
  return new Decimal(sol).times(1_000_000_000);
}

