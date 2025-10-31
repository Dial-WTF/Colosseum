/**
 * TypeScript SDK for Dial.WTF Bonding Curve Program
 * Provides easy interaction with the on-chain bonding curve program
 */

import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from '@solana/spl-token';
import { Program, AnchorProvider, BN, Idl } from '@coral-xyz/anchor';
import { calculateBezierPrice as evalBezierPrice } from '@dial/bonding-curve';

// Program ID (will be set after deployment)
export const BONDING_CURVE_PROGRAM_ID = new PublicKey(
  'BC11111111111111111111111111111111111111111'
);

/**
 * Curve types supported by the program
 */
export enum CurveType {
  Linear = 'linear',
  Exponential = 'exponential',
  Logarithmic = 'logarithmic',
  Bezier = 'bezier',
}

/**
 * Bezier control point (for curve definition)
 */
export interface BezierControlPoint {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
}

/**
 * Bezier curve segment (cubic Bezier)
 */
export interface BezierSegment {
  p0: BezierControlPoint;
  p1: BezierControlPoint;
  p2: BezierControlPoint;
  p3: BezierControlPoint;
}

/**
 * Complete Bezier curve definition
 */
export interface BezierCurveData {
  segments: BezierSegment[];
  minPrice: number; // SOL
  maxPrice: number; // SOL
}

/**
 * On-chain bonding curve state
 */
export interface BondingCurveState {
  authority: PublicKey;
  collectionMint: PublicKey;
  curveType: CurveType;
  basePrice: BN;
  priceIncrement: BN;
  maxSupply: number;
  currentSupply: number;
  totalVolume: BN;
  bump: number;
  bezierMinPrice: BN;
  bezierMaxPrice: BN;
}

/**
 * Parameters for initializing a bonding curve
 */
export interface InitializeCurveParams {
  authority: PublicKey;
  collectionMint: PublicKey;
  curveType: CurveType;
  basePrice: number | BN;
  priceIncrement: number | BN;
  maxSupply: number;
  // For Bezier curves
  bezierCurveData?: BezierCurveData;
}

/**
 * Parameters for minting an edition
 */
export interface MintEditionParams {
  collectionMint: PublicKey;
  editionMint: PublicKey;
  buyer: PublicKey;
  authority: PublicKey;
}

/**
 * Bonding Curve Program Client
 */
export class BondingCurveClient {
  constructor(
    private connection: Connection,
    private program?: Program
  ) {}

  /**
   * Get the PDA for a bonding curve
   */
  static getBondingCurvePDA(collectionMint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bonding_curve'), collectionMint.toBuffer()],
      BONDING_CURVE_PROGRAM_ID
    );
  }

  /**
   * Initialize a new bonding curve
   */
  async initializeCurve(params: InitializeCurveParams): Promise<Transaction> {
    const [bondingCurvePDA] = BondingCurveClient.getBondingCurvePDA(
      params.collectionMint
    );

    // Convert curve type to on-chain format
    const curveTypeValue = this.curveTypeToValue(params.curveType);

    const tx = new Transaction();
    
    // In a real implementation, you'd use the Anchor program here
    // For now, this is a placeholder structure
    console.log('Initializing curve with PDA:', bondingCurvePDA.toString());

    return tx;
  }

  /**
   * Mint a new edition from the bonding curve
   */
  async mintEdition(params: MintEditionParams): Promise<Transaction> {
    const [bondingCurvePDA] = BondingCurveClient.getBondingCurvePDA(
      params.collectionMint
    );

    // Get buyer's token account
    const buyerTokenAccount = await getAssociatedTokenAddress(
      params.editionMint,
      params.buyer
    );

    const tx = new Transaction();
    
    // In a real implementation, you'd construct the instruction here
    console.log('Minting edition from curve:', bondingCurvePDA.toString());

    return tx;
  }

  /**
   * Fetch bonding curve state from on-chain
   */
  async fetchBondingCurve(
    collectionMint: PublicKey
  ): Promise<BondingCurveState | null> {
    const [bondingCurvePDA] = BondingCurveClient.getBondingCurvePDA(
      collectionMint
    );

    try {
      const accountInfo = await this.connection.getAccountInfo(bondingCurvePDA);
      
      if (!accountInfo) {
        return null;
      }

      // In a real implementation, deserialize the account data
      // This is a placeholder
      return null;
    } catch (error) {
      console.error('Error fetching bonding curve:', error);
      return null;
    }
  }

  /**
   * Calculate the current price for the next edition
   */
  async getCurrentPrice(collectionMint: PublicKey): Promise<BN | null> {
    const curve = await this.fetchBondingCurve(collectionMint);
    
    if (!curve) {
      return null;
    }

    return this.calculatePrice(
      curve.curveType,
      curve.basePrice,
      curve.priceIncrement,
      curve.currentSupply + 1
    );
  }

  /**
   * Calculate price based on curve formula
   */
  private calculatePrice(
    curveType: CurveType,
    basePrice: BN,
    priceIncrement: BN,
    edition: number
  ): BN {
    switch (curveType) {
      case CurveType.Linear:
        // price = basePrice + (edition - 1) * increment
        return basePrice.add(
          priceIncrement.mul(new BN(edition - 1))
        );

      case CurveType.Exponential:
        // price = basePrice * (1 + increment)^(edition - 1)
        // Simplified on-chain: price = basePrice + (basePrice * increment * (edition - 1) / 10000)
        const multiplier = priceIncrement.mul(new BN(edition - 1)).div(new BN(10000));
        return basePrice.add(basePrice.mul(multiplier));

      case CurveType.Logarithmic:
        // price = basePrice + increment * log2(edition)
        const logEdition = Math.floor(Math.log2(edition));
        return basePrice.add(priceIncrement.mul(new BN(logEdition)));

      default:
        return basePrice;
    }
  }

  /**
   * Convert curve type string to on-chain value
   */
  private curveTypeToValue(curveType: CurveType): number {
    switch (curveType) {
      case CurveType.Linear:
        return 0;
      case CurveType.Exponential:
        return 1;
      case CurveType.Logarithmic:
        return 2;
      case CurveType.Bezier:
        return 3;
      default:
        return 0;
    }
  }

  /**
   * Get the PDA for a Bezier price lookup table
   */
  static getBezierLookupPDA(bondingCurvePDA: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('bezier_lookup'), bondingCurvePDA.toBuffer()],
      BONDING_CURVE_PROGRAM_ID
    );
  }

  /**
   * Initialize Bezier price lookup table
   * Pre-calculates all prices for the collection to avoid on-chain computation
   */
  async initializeBezierLookup(
    bondingCurvePDA: PublicKey,
    authority: PublicKey,
    bezierCurveData: BezierCurveData,
    maxSupply: number
  ): Promise<Transaction> {
    // Pre-calculate all prices using the Bezier curve
    const prices: BN[] = [];
    
    for (let edition = 1; edition <= maxSupply; edition++) {
      const price = this.calculateBezierPrice(edition, maxSupply, bezierCurveData);
      prices.push(price);
    }

    // Convert to u64 array
    const pricesArray = prices.map(p => p.toNumber());

    const tx = new Transaction();
    
    // In real implementation, construct the instruction here
    console.log(`Initializing Bezier lookup with ${pricesArray.length} prices`);
    console.log(`Price range: ${formatSol(prices[0])} - ${formatSol(prices[prices.length - 1])} SOL`);

    return tx;
  }

  /**
   * Calculate Bezier price for a specific edition
   * This matches the off-chain Bezier evaluation from @dial/bonding-curve
   */
  private calculateBezierPrice(
    edition: number,
    maxSupply: number,
    bezierCurveData: BezierCurveData
  ): BN {
    // Use the actual Bezier evaluation from @dial/bonding-curve package
    const priceDecimal = evalBezierPrice(edition, maxSupply, bezierCurveData);
    
    // Convert Decimal to SOL number
    const priceInSol = priceDecimal.toNumber();
    
    // Convert to lamports
    return solToLamports(priceInSol);
  }

  /**
   * Mint edition using Bezier lookup table
   */
  async mintEditionWithBezierLookup(
    params: MintEditionParams
  ): Promise<Transaction> {
    const [bondingCurvePDA] = BondingCurveClient.getBondingCurvePDA(
      params.collectionMint
    );

    const [bezierLookupPDA] = BondingCurveClient.getBezierLookupPDA(
      bondingCurvePDA
    );

    // Get buyer's token account
    const buyerTokenAccount = await getAssociatedTokenAddress(
      params.editionMint,
      params.buyer
    );

    const tx = new Transaction();
    
    // In real implementation, construct mint_edition_with_bezier_lookup instruction
    console.log('Minting with Bezier lookup');
    console.log(`Curve PDA: ${bondingCurvePDA.toString()}`);
    console.log(`Lookup PDA: ${bezierLookupPDA.toString()}`);

    return tx;
  }

  /**
   * Update bonding curve parameters (authority only)
   */
  async updateCurve(
    collectionMint: PublicKey,
    authority: PublicKey,
    updates: {
      basePrice?: number | BN;
      priceIncrement?: number | BN;
      maxSupply?: number;
    }
  ): Promise<Transaction> {
    const [bondingCurvePDA] = BondingCurveClient.getBondingCurvePDA(
      collectionMint
    );

    const tx = new Transaction();
    
    // In a real implementation, construct update instruction
    console.log('Updating curve:', bondingCurvePDA.toString());

    return tx;
  }
}

/**
 * Helper functions for working with bonding curves
 */

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): BN {
  return new BN(sol * 1_000_000_000);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: BN): number {
  return lamports.toNumber() / 1_000_000_000;
}

/**
 * Format lamports as SOL string
 */
export function formatSol(lamports: BN, decimals: number = 4): string {
  return lamportsToSol(lamports).toFixed(decimals);
}

/**
 * Simulate minting sequence to get price array
 */
export function simulatePriceSequence(
  curveType: CurveType,
  basePrice: BN,
  priceIncrement: BN,
  count: number
): BN[] {
  const client = new BondingCurveClient(null as any);
  const prices: BN[] = [];

  for (let i = 1; i <= count; i++) {
    // @ts-ignore - accessing private method for simulation
    const price = client.calculatePrice(curveType, basePrice, priceIncrement, i);
    prices.push(price);
  }

  return prices;
}

export default BondingCurveClient;

