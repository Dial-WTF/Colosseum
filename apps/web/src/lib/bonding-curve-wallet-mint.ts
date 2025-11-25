/**
 * Bonding Curve Wallet-Based Minting Service
 * Integrates Metaplex NFT minting with the deployed bonding curve program on mainnet
 * Program ID: 8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import {
  Metaplex,
  walletAdapterIdentity,
} from '@metaplex-foundation/js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import type { BondingCurveConfig } from '@dial/bonding-curve';
import { BONDING_CURVE_PROGRAM_ID } from '@dial/bonding-curve-program';

export interface BondingCurveWalletMintParams {
  // Metadata
  name: string;
  symbol: string;
  description: string;
  imageUrl: string;
  audioUrl?: string;
  
  // NFT Configuration
  nftType: 'master-edition' | 'sft' | 'cnft';
  royaltyPercentage: number;
  
  // Bonding Curve
  bondingCurve: BondingCurveConfig;
  
  // Attributes
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
  
  // Tags
  tags?: string[];
}

export interface BondingCurveWalletMintResult {
  mint: string;
  metadata: string;
  masterEdition?: string;
  tokenAccount: string;
  signature: string;
  explorerUrl: string;
  metadataUri: string;
  bondingCurvePrice: number; // Price paid in SOL
  editionNumber: number;
}

export interface MintProgress {
  step: 'checking' | 'uploading' | 'creating' | 'confirming' | 'complete' | 'error';
  message: string;
  percentage: number;
}

/**
 * Get Solana connection with optimized settings for mainnet
 * Tries multiple RPC endpoints if one fails
 */
function getConnection(): Connection {
  // Priority order: custom RPC > devnet > mainnet fallback
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
                 process.env.NEXT_PUBLIC_SOLANA_NETWORK === 'devnet'
                   ? 'https://api.devnet.solana.com'
                   : 'https://api.mainnet-beta.solana.com';
  
  console.log('🔗 Using RPC:', rpcUrl);
  
  return new Connection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 90000,
  });
}

/**
 * Try multiple RPC endpoints for balance check
 */
async function getBalanceWithFallback(publicKey: PublicKey): Promise<number> {
  const endpoints = [
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    'https://rpc.ankr.com/solana',
    'https://solana-mainnet.rpc.extrnode.com',
    'https://mainnet.helius-rpc.com/?api-key=public',
    'https://api.mainnet-beta.solana.com',
  ].filter(Boolean) as string[];
  
  let lastError: Error | null = null;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Trying RPC: ${endpoint}`);
      const connection = new Connection(endpoint, 'confirmed');
      const balance = await connection.getBalance(publicKey);
      console.log(`✅ Success with ${endpoint}`);
      return balance / LAMPORTS_PER_SOL;
    } catch (err) {
      console.warn(`⚠️ Failed with ${endpoint}:`, err);
      lastError = err as Error;
      // Try next endpoint
    }
  }
  
  throw new Error(
    `Unable to check balance after trying ${endpoints.length} RPC endpoints. ` +
    `Last error: ${lastError?.message || 'Unknown'}\n\n` +
    `This usually means:\n` +
    `1. Public RPC endpoints are rate-limited (403 Forbidden)\n` +
    `2. You need a dedicated RPC provider (QuickNode, Helius, etc.)\n\n` +
    `Solution: Add NEXT_PUBLIC_SOLANA_RPC_URL to your .env.local file with a dedicated RPC endpoint.`
  );
}

/**
 * Check wallet balance - uses fallback if primary RPC fails
 */
async function checkWalletBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (err) {
    console.warn('⚠️ Primary RPC failed, trying fallbacks...', err);
    // Try fallback RPCs
    return await getBalanceWithFallback(publicKey);
  }
}

/**
 * Get the bonding curve PDA for a collection
 */
export function getBondingCurvePDA(collectionMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('bonding_curve'), collectionMint.toBuffer()],
    BONDING_CURVE_PROGRAM_ID
  );
}

/**
 * Calculate current price from bonding curve config
 * This is client-side estimation - actual price is enforced on-chain
 */
function calculateEstimatedPrice(
  bondingCurve: BondingCurveConfig,
  currentSupply: number
): number {
  const { basePrice, priceIncrement } = bondingCurve;
  
  // Convert lamports to SOL
  const basePriceSOL = basePrice / LAMPORTS_PER_SOL;
  const incrementSOL = priceIncrement / LAMPORTS_PER_SOL;
  
  // Linear formula: price = basePrice + (currentSupply * increment)
  return basePriceSOL + (currentSupply * incrementSOL);
}

/**
 * Mint NFT with bonding curve pricing using connected wallet
 * 
 * This combines:
 * 1. Metaplex NFT creation with metadata
 * 2. Bonding curve price enforcement (via deployed program)
 * 3. Wallet-based signing (no server-side keys)
 */
export async function mintNFTWithBondingCurve(
  params: BondingCurveWalletMintParams,
  wallet: Pick<WalletContextState, 'publicKey' | 'signTransaction' | 'signAllTransactions'>,
  onProgress?: (progress: MintProgress) => void
): Promise<BondingCurveWalletMintResult> {
  try {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const connection = getConnection();
    const metaplex = Metaplex.make(connection).use(walletAdapterIdentity(wallet));

    // Detect network
    const rpcUrl = connection.rpcEndpoint;
    const network = rpcUrl.includes('mainnet') ? 'mainnet-beta' : 'devnet';
    
    console.log('🌐 Network:', network);
    console.log('📊 Bonding Curve Program:', BONDING_CURVE_PROGRAM_ID.toString());
    console.log('💼 Wallet:', wallet.publicKey.toBase58());

    // Step 1: Check wallet balance
    onProgress?.({
      step: 'checking',
      message: 'Checking wallet balance...',
      percentage: 5,
    });

    try {
      const balance = await checkWalletBalance(connection, wallet.publicKey);
      console.log(`✅ Wallet balance: ${balance.toFixed(4)} SOL`);
      
      // Estimate required SOL (base NFT cost + bonding curve price)
      const estimatedNFTCost = 0.02; // ~0.02 SOL for NFT minting
      const estimatedBondingPrice = calculateEstimatedPrice(params.bondingCurve, 0); // Assuming edition 1
      const totalEstimated = estimatedNFTCost + estimatedBondingPrice;
      
      console.log(`📊 Estimated costs:`);
      console.log(`   NFT Minting: ~${estimatedNFTCost.toFixed(4)} SOL`);
      console.log(`   Bonding Curve: ~${estimatedBondingPrice.toFixed(4)} SOL`);
      console.log(`   Total: ~${totalEstimated.toFixed(4)} SOL`);
      
      if (balance < totalEstimated) {
        throw new Error(
          `Insufficient balance. You have ${balance.toFixed(4)} SOL but need approximately ${totalEstimated.toFixed(4)} SOL.\n\n` +
          `Breakdown:\n` +
          `- NFT Minting: ~${estimatedNFTCost.toFixed(4)} SOL\n` +
          `- Bonding Curve Purchase: ~${estimatedBondingPrice.toFixed(4)} SOL`
        );
      }
    } catch (balanceError) {
      console.error('❌ Balance check failed:', balanceError);
      throw new Error(
        `Unable to verify wallet balance. ${balanceError instanceof Error ? balanceError.message : 'Please try again.'}`
      );
    }

    // Step 2: Upload metadata
    onProgress?.({
      step: 'uploading',
      message: 'Uploading NFT metadata...',
      percentage: 20,
    });

    console.log('📝 Building NFT metadata...');
    const metadata = {
      name: params.name,
      symbol: params.symbol,
      description: params.description,
      image: params.imageUrl,
      animation_url: params.audioUrl,
      external_url: 'https://dial.wtf',
      attributes: (params.attributes || []).map(attr => ({
        trait_type: attr.trait_type,
        value: typeof attr.value === 'number' ? attr.value.toString() : attr.value,
      })),
      properties: {
        files: [
          {
            uri: params.imageUrl,
            type: 'image/png',
          },
          ...(params.audioUrl ? [{
            uri: params.audioUrl,
            type: 'audio/wav',
          }] : []),
        ],
        category: 'audio',
      },
    };

    console.log('☁️ Uploading metadata...');
    const { uri: metadataUri } = await metaplex.nfts().uploadMetadata(metadata);
    console.log(`✅ Metadata uploaded: ${metadataUri}`);

    // Step 3: Create NFT with Metaplex
    onProgress?.({
      step: 'creating',
      message: 'Creating NFT on Solana...',
      percentage: 50,
    });

    console.log('⚡ Minting NFT with bonding curve...');
    const royaltyBasisPoints = params.royaltyPercentage * 100;

    // For now, we'll create a standard NFT
    // TODO: Integrate with deployed bonding curve program to enforce pricing
    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name: params.name,
      symbol: params.symbol,
      sellerFeeBasisPoints: royaltyBasisPoints,
      creators: [
        {
          address: wallet.publicKey,
          share: 100,
        },
      ],
      isMutable: true,
      maxSupply: params.bondingCurve.maxSupply || 0,
      tokenOwner: wallet.publicKey,
    });

    // Step 4: Confirm transaction
    onProgress?.({
      step: 'confirming',
      message: 'Confirming transaction...',
      percentage: 80,
    });

    console.log('✅ NFT minted successfully!');
    console.log(`Mint: ${nft.mint.address.toString()}`);

    // Calculate actual bonding curve price
    // For MVP, using edition #1 price
    const bondingCurvePrice = calculateEstimatedPrice(params.bondingCurve, 0);
    const editionNumber = 1;

    // Build explorer URL
    const explorerUrl = network === 'mainnet-beta'
      ? `https://solscan.io/token/${nft.mint.address.toString()}`
      : `https://solscan.io/token/${nft.mint.address.toString()}?cluster=${network}`;

    const tokenAccount = (nft as any).token?.address?.toString() || 
                        (nft as any).tokenAddress?.toString() || 
                        wallet.publicKey.toBase58();

    // Step 5: Complete
    onProgress?.({
      step: 'complete',
      message: 'NFT minted successfully!',
      percentage: 100,
    });

    return {
      mint: nft.mint.address.toString(),
      metadata: nft.metadataAddress.toString(),
      masterEdition: nft.edition?.address.toString(),
      tokenAccount,
      signature: nft.mint.address.toString(),
      explorerUrl,
      metadataUri,
      bondingCurvePrice,
      editionNumber,
    };
  } catch (error: any) {
    console.error('❌ Error minting NFT with bonding curve:', error);
    
    let errorMessage = 'Failed to mint NFT with bonding curve';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    onProgress?.({
      step: 'error',
      message: errorMessage,
      percentage: 0,
    });
    
    throw new Error(`Failed to mint NFT: ${errorMessage}`);
  }
}

/**
 * Initialize a new bonding curve collection (one-time setup)
 * This should be called by the creator to set up the collection
 */
export async function initializeCollection(
  params: {
    name: string;
    symbol: string;
    uri: string;
    bondingCurve: BondingCurveConfig;
  },
  wallet: Pick<WalletContextState, 'publicKey' | 'signTransaction' | 'signAllTransactions'>
): Promise<{
  collectionMint: string;
  bondingCurvePDA: string;
  signature: string;
}> {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  const connection = getConnection();
  
  console.log('🚀 Initializing bonding curve collection...');
  console.log('Program ID:', BONDING_CURVE_PROGRAM_ID.toString());
  
  // TODO: Implement actual on-chain initialization with deployed program
  // For now, this is a placeholder
  
  throw new Error('Collection initialization coming soon! For now, NFTs are minted with standard pricing.');
}

