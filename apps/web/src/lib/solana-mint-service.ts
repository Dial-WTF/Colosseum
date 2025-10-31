/**
 * Solana NFT Minting Service
 * Handles creating NFTs on Solana using Metaplex
 */

import {
  Metaplex,
  keypairIdentity,
  bundlrStorage,
  toMetaplexFile,
  CreateNftOutput,
} from '@metaplex-foundation/js';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  createCreateMasterEditionV3Instruction,
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from '@metaplex-foundation/mpl-token-metadata';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import type { BondingCurveConfig } from '@dial/bonding-curve';

export interface MintNFTParams {
  // Metadata
  name: string;
  symbol: string;
  metadataUri: string; // URI to the uploaded metadata JSON
  
  // Wallet
  walletAddress: string;
  
  // NFT Configuration
  nftType: 'master-edition' | 'sft' | 'cnft';
  royaltyBasisPoints: number; // 500 = 5%
  
  // Bonding Curve
  bondingCurve: BondingCurveConfig;
  
  // Optional
  sellerFeeBasisPoints?: number;
  creators?: Array<{
    address: string;
    share: number;
    verified?: boolean;
  }>;
}

export interface MintNFTResult {
  mint: string; // Mint address
  metadata: string; // Metadata account address
  masterEdition?: string; // Master edition account (for master editions)
  tokenAccount: string; // Token account address
  signature: string; // Transaction signature
  explorerUrl: string; // Solscan/Explorer URL
}

/**
 * Get Solana connection
 */
function getConnection(): Connection {
  const rpcUrl = process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Get Metaplex instance
 * Note: In production, you'd want to use a proper wallet adapter
 */
function getMetaplex(connection: Connection, payerKeypair: Keypair): Metaplex {
  return Metaplex.make(connection)
    .use(keypairIdentity(payerKeypair));
}

/**
 * Create a Master Edition NFT
 * This is a unique 1/1 NFT with a master edition
 */
export async function createMasterEditionNFT(
  params: MintNFTParams,
  payerKeypair: Keypair
): Promise<MintNFTResult> {
  try {
    const connection = getConnection();
    const metaplex = getMetaplex(connection, payerKeypair);
    
    const owner = new PublicKey(params.walletAddress);
    
    // Prepare creators array
    const creators = params.creators?.map(c => ({
      address: new PublicKey(c.address),
      share: c.share,
      verified: c.verified || false,
    })) || [
      {
        address: owner,
        share: 100,
        verified: false,
      },
    ];

    // Create the NFT using Metaplex SDK
    const { nft } = await metaplex.nfts().create({
      uri: params.metadataUri,
      name: params.name,
      symbol: params.symbol,
      sellerFeeBasisPoints: params.royaltyBasisPoints,
      creators,
      isMutable: true,
      maxSupply: 0, // 0 means unlimited for master edition, but we'll set to 1
      tokenOwner: owner,
      updateAuthority: payerKeypair,
    });

    // Get the latest transaction signature
    const signature = nft.mint.address.toString();

    // Build explorer URL (adjust for mainnet/devnet)
    const network = process.env.SOLANA_NETWORK || 'devnet';
    const explorerUrl = `https://solscan.io/token/${nft.mint.address.toString()}?cluster=${network}`;

    return {
      mint: nft.mint.address.toString(),
      metadata: nft.metadataAddress.toString(),
      masterEdition: nft.edition?.address.toString(),
      tokenAccount: nft.token.address.toString(),
      signature,
      explorerUrl,
    };
  } catch (error) {
    console.error('Error creating Master Edition NFT:', error);
    throw new Error(`Failed to create Master Edition NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a Semi-Fungible Token (SFT)
 * This allows multiple editions to be minted from the same metadata
 */
export async function createSFT(
  params: MintNFTParams,
  payerKeypair: Keypair,
  maxSupply: number
): Promise<MintNFTResult> {
  try {
    const connection = getConnection();
    const metaplex = getMetaplex(connection, payerKeypair);
    
    const owner = new PublicKey(params.walletAddress);
    
    // Prepare creators array
    const creators = params.creators?.map(c => ({
      address: new PublicKey(c.address),
      share: c.share,
      verified: c.verified || false,
    })) || [
      {
        address: owner,
        share: 100,
        verified: false,
      },
    ];

    // Create the SFT using Metaplex SDK
    const { nft } = await metaplex.nfts().create({
      uri: params.metadataUri,
      name: params.name,
      symbol: params.symbol,
      sellerFeeBasisPoints: params.royaltyBasisPoints,
      creators,
      isMutable: true,
      maxSupply: maxSupply,
      tokenOwner: owner,
      updateAuthority: payerKeypair,
    });

    // Get the transaction signature
    const signature = nft.mint.address.toString();

    // Build explorer URL
    const network = process.env.SOLANA_NETWORK || 'devnet';
    const explorerUrl = `https://solscan.io/token/${nft.mint.address.toString()}?cluster=${network}`;

    return {
      mint: nft.mint.address.toString(),
      metadata: nft.metadataAddress.toString(),
      masterEdition: nft.edition?.address.toString(),
      tokenAccount: nft.token.address.toString(),
      signature,
      explorerUrl,
    };
  } catch (error) {
    console.error('Error creating SFT:', error);
    throw new Error(`Failed to create SFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main minting function that routes to the appropriate NFT type
 */
export async function mintNFT(
  params: MintNFTParams,
  payerKeypair: Keypair
): Promise<MintNFTResult> {
  switch (params.nftType) {
    case 'master-edition':
      return createMasterEditionNFT(params, payerKeypair);
    
    case 'sft':
      const maxSupply = params.bondingCurve.maxSupply || 100;
      return createSFT(params, payerKeypair, maxSupply);
    
    case 'cnft':
      // Compressed NFTs require different implementation (using Bubblegum)
      // For now, fallback to SFT
      console.warn('cNFT support not yet implemented, falling back to SFT');
      return createSFT(params, payerKeypair, params.bondingCurve.maxSupply || 100);
    
    default:
      throw new Error(`Unsupported NFT type: ${params.nftType}`);
  }
}

/**
 * Estimate transaction fees for minting
 */
export async function estimateMintFee(nftType: 'master-edition' | 'sft' | 'cnft'): Promise<number> {
  // Rough estimates in SOL
  switch (nftType) {
    case 'master-edition':
      return 0.02; // ~0.02 SOL for master edition
    case 'sft':
      return 0.015; // ~0.015 SOL for SFT
    case 'cnft':
      return 0.001; // ~0.001 SOL for compressed NFT
    default:
      return 0.02;
  }
}

