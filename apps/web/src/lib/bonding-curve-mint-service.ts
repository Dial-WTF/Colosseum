/**
 * Bonding Curve Minting Service
 * Integrates with the on-chain bonding curve program for automated pricing
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Metaplex,
  keypairIdentity,
  CreateNftOutput,
} from '@metaplex-foundation/js';
import {
  BondingCurveClient,
  CurveType,
  solToLamports as bondingCurveSolToLamports,
} from '@dial/bonding-curve-program';
import type { BondingCurveConfig } from '@dial/bonding-curve';

export interface InitializeBondingCurveParams {
  collectionName: string;
  collectionSymbol: string;
  metadataUri: string;
  authority: PublicKey;
  bondingCurve: BondingCurveConfig;
}

export interface MintWithBondingCurveParams {
  collectionMint: PublicKey;
  buyer: PublicKey;
  editionMetadataUri: string;
  editionNumber: number;
}

export interface BondingCurveCollection {
  collectionMint: string;
  bondingCurvePDA: string;
  curveType: CurveType;
  basePrice: number;
  currentSupply: number;
  maxSupply: number;
  currentPrice: number;
  nextPrice: number;
}

/**
 * Get Solana connection
 */
function getConnection(): Connection {
  const rpcUrl =
    process.env.SOLANA_RPC_URL ||
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    'https://api.devnet.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Convert BondingCurveConfig type to on-chain CurveType
 */
function convertCurveType(type: string): CurveType {
  switch (type.toLowerCase()) {
    case 'exponential':
      return CurveType.Exponential;
    case 'logarithmic':
      return CurveType.Logarithmic;
    case 'linear':
    default:
      return CurveType.Linear;
  }
}

/**
 * Initialize a new collection with bonding curve
 * This creates:
 * 1. Collection NFT (master)
 * 2. Bonding curve state account
 * 3. Sets up automated pricing
 */
export async function initializeCollectionWithCurve(
  params: InitializeBondingCurveParams,
  payerKeypair: Keypair
): Promise<BondingCurveCollection> {
  const connection = getConnection();
  const metaplex = Metaplex.make(connection).use(keypairIdentity(payerKeypair));
  const bondingCurveClient = new BondingCurveClient(connection);

  try {
    // Step 1: Create collection NFT
    console.log('📦 Creating collection NFT...');
    const { nft: collectionNft } = await metaplex.nfts().create({
      uri: params.metadataUri,
      name: params.collectionName,
      symbol: params.collectionSymbol,
      sellerFeeBasisPoints: 500, // 5% royalty
      isCollection: true,
      creators: [
        {
          address: params.authority,
          share: 100,
        },
      ],
    });

    // Step 2: Initialize bonding curve
    console.log('📈 Initializing bonding curve...');
    const curveType = convertCurveType(params.bondingCurve.type);
    
    const initCurveTx = await bondingCurveClient.initializeCurve({
      authority: params.authority,
      collectionMint: collectionNft.mint.address,
      curveType,
      basePrice: bondingCurveSolToLamports(
        params.bondingCurve.basePrice / 1_000_000_000
      ),
      priceIncrement: bondingCurveSolToLamports(
        params.bondingCurve.priceIncrement / 1_000_000_000
      ),
      maxSupply: params.bondingCurve.maxSupply || 100,
    });

    // Sign and send
    await sendAndConfirmTransaction(connection, initCurveTx, [payerKeypair]);

    const [bondingCurvePDA] = BondingCurveClient.getBondingCurvePDA(
      collectionNft.mint.address
    );

    // Calculate initial prices
    const currentPrice = params.bondingCurve.basePrice / 1_000_000_000; // Convert to SOL
    const nextPrice =
      (params.bondingCurve.basePrice + params.bondingCurve.priceIncrement) /
      1_000_000_000;

    console.log('✅ Collection with bonding curve created!');
    console.log(`Collection Mint: ${collectionNft.mint.address.toString()}`);
    console.log(`Bonding Curve PDA: ${bondingCurvePDA.toString()}`);

    return {
      collectionMint: collectionNft.mint.address.toString(),
      bondingCurvePDA: bondingCurvePDA.toString(),
      curveType,
      basePrice: currentPrice,
      currentSupply: 0,
      maxSupply: params.bondingCurve.maxSupply || 100,
      currentPrice,
      nextPrice,
    };
  } catch (error) {
    console.error('Error initializing collection with curve:', error);
    throw new Error(
      `Failed to initialize collection: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Mint an edition from the bonding curve
 * Price is automatically calculated and enforced by the program
 */
export async function mintEditionWithCurve(
  params: MintWithBondingCurveParams,
  payerKeypair: Keypair
): Promise<{
  mint: string;
  signature: string;
  price: number;
  edition: number;
}> {
  const connection = getConnection();
  const bondingCurveClient = new BondingCurveClient(connection);

  try {
    // Get current price from on-chain
    console.log('💰 Fetching current price...');
    const currentPrice = await bondingCurveClient.getCurrentPrice(
      params.collectionMint
    );

    if (!currentPrice) {
      throw new Error('Bonding curve not found');
    }

    console.log(
      `Current price: ${currentPrice.toNumber() / 1_000_000_000} SOL`
    );

    // Create edition mint
    console.log('🪙 Creating edition mint...');
    const editionMint = await createMint(
      connection,
      payerKeypair,
      payerKeypair.publicKey, // mint authority
      null, // freeze authority
      0 // decimals (0 for NFT)
    );

    // Mint edition through bonding curve program
    console.log('⚡ Minting through bonding curve...');
    const mintTx = await bondingCurveClient.mintEdition({
      collectionMint: params.collectionMint,
      editionMint,
      buyer: params.buyer,
      authority: payerKeypair.publicKey,
    });

    const signature = await sendAndConfirmTransaction(connection, mintTx, [
      payerKeypair,
    ]);

    console.log(`✅ Edition #${params.editionNumber} minted!`);
    console.log(`Signature: ${signature}`);

    return {
      mint: editionMint.toString(),
      signature,
      price: currentPrice.toNumber() / 1_000_000_000,
      edition: params.editionNumber,
    };
  } catch (error) {
    console.error('Error minting edition:', error);
    throw new Error(
      `Failed to mint edition: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Get collection info including current bonding curve state
 */
export async function getCollectionInfo(
  collectionMint: PublicKey
): Promise<BondingCurveCollection | null> {
  const connection = getConnection();
  const bondingCurveClient = new BondingCurveClient(connection);

  try {
    const curveState = await bondingCurveClient.fetchBondingCurve(
      collectionMint
    );

    if (!curveState) {
      return null;
    }

    const currentPrice =
      curveState.basePrice.toNumber() / 1_000_000_000;
    
    // Calculate next price
    const nextPriceBN = await bondingCurveClient.getCurrentPrice(
      collectionMint
    );
    const nextPrice = nextPriceBN
      ? nextPriceBN.toNumber() / 1_000_000_000
      : currentPrice;

    const [bondingCurvePDA] = BondingCurveClient.getBondingCurvePDA(
      collectionMint
    );

    return {
      collectionMint: collectionMint.toString(),
      bondingCurvePDA: bondingCurvePDA.toString(),
      curveType: curveState.curveType,
      basePrice: curveState.basePrice.toNumber() / 1_000_000_000,
      currentSupply: curveState.currentSupply,
      maxSupply: curveState.maxSupply,
      currentPrice,
      nextPrice,
    };
  } catch (error) {
    console.error('Error fetching collection info:', error);
    return null;
  }
}

/**
 * Update bonding curve parameters (authority only)
 */
export async function updateBondingCurve(
  collectionMint: PublicKey,
  updates: {
    basePrice?: number;
    priceIncrement?: number;
    maxSupply?: number;
  },
  authorityKeypair: Keypair
): Promise<string> {
  const connection = getConnection();
  const bondingCurveClient = new BondingCurveClient(connection);

  try {
    const tx = await bondingCurveClient.updateCurve(
      collectionMint,
      authorityKeypair.publicKey,
      {
        basePrice: updates.basePrice
          ? bondingCurveSolToLamports(updates.basePrice)
          : undefined,
        priceIncrement: updates.priceIncrement
          ? bondingCurveSolToLamports(updates.priceIncrement)
          : undefined,
        maxSupply: updates.maxSupply,
      }
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [
      authorityKeypair,
    ]);

    console.log('✅ Bonding curve updated!');
    return signature;
  } catch (error) {
    console.error('Error updating bonding curve:', error);
    throw new Error(
      `Failed to update bonding curve: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

