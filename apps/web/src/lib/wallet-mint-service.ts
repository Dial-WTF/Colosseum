/**
 * Wallet-Based NFT Minting Service
 * Mints NFTs using the connected Solana wallet (no server-side private key needed)
 */

import {
  Metaplex,
  walletAdapterIdentity,
  bundlrStorage,
} from '@metaplex-foundation/js';
import { Connection, PublicKey } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import type { BondingCurveConfig } from '@dial/bonding-curve';

export interface WalletMintNFTParams {
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

export interface WalletMintNFTResult {
  mint: string;
  metadata: string;
  masterEdition?: string;
  tokenAccount: string;
  signature: string;
  explorerUrl: string;
  metadataUri: string;
}

export interface MintProgress {
  step: 'uploading' | 'creating' | 'confirming' | 'complete' | 'error';
  message: string;
  percentage: number;
}

/**
 * Get Solana connection
 */
function getConnection(): Connection {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Get Metaplex instance with wallet adapter
 */
function getMetaplex(
  connection: Connection,
  wallet: Pick<WalletContextState, 'publicKey' | 'signTransaction' | 'signAllTransactions'>
): Metaplex {
  if (!wallet.publicKey) {
    throw new Error('Wallet not connected');
  }

  return Metaplex.make(connection)
    .use(walletAdapterIdentity(wallet));
}

/**
 * Build NFT metadata JSON
 */
function buildMetadata(params: WalletMintNFTParams, creatorAddress: string) {
  return {
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: params.imageUrl,
    animation_url: params.audioUrl,
    external_url: 'https://dial.wtf',
    attributes: params.attributes || [],
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
      creators: [
        {
          address: creatorAddress,
          share: 100,
        },
      ],
    },
  };
}

/**
 * Mint NFT using connected wallet
 */
export async function mintNFTWithWallet(
  params: WalletMintNFTParams,
  wallet: Pick<WalletContextState, 'publicKey' | 'signTransaction' | 'signAllTransactions'>,
  onProgress?: (progress: MintProgress) => void
): Promise<WalletMintNFTResult> {
  try {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    const connection = getConnection();
    const metaplex = getMetaplex(connection, wallet);

    // Step 1: Upload metadata to storage
    onProgress?.({
      step: 'uploading',
      message: 'Uploading metadata to storage...',
      percentage: 10,
    });

    console.log('📝 Building NFT metadata...');
    const metadata = buildMetadata(params, wallet.publicKey.toBase58());

    // Upload metadata via API (to use our storage service)
    console.log('☁️ Uploading metadata to storage...');
    const metadataResponse = await fetch('/api/nft/metadata/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata,
        walletAddress: wallet.publicKey.toBase58(),
      }),
    });

    if (!metadataResponse.ok) {
      const error = await metadataResponse.json();
      throw new Error(error.error || 'Failed to upload metadata');
    }

    const { uri: metadataUri } = await metadataResponse.json();

    // Step 2: Create NFT on-chain
    onProgress?.({
      step: 'creating',
      message: 'Creating NFT on Solana...',
      percentage: 40,
    });

    console.log('⚡ Minting NFT on Solana with wallet...');
    const royaltyBasisPoints = params.royaltyPercentage * 100; // Convert % to basis points

    // Prepare creators array
    const creators = [
      {
        address: wallet.publicKey,
        share: 100,
      },
    ];

    // Create the NFT using Metaplex SDK with wallet adapter
    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name: params.name,
      symbol: params.symbol,
      sellerFeeBasisPoints: royaltyBasisPoints,
      creators,
      isMutable: true,
      maxSupply: params.nftType === 'master-edition' ? 0 : params.bondingCurve.maxSupply,
    });

    // Step 3: Confirm transaction
    onProgress?.({
      step: 'confirming',
      message: 'Confirming transaction on blockchain...',
      percentage: 80,
    });

    console.log('✅ NFT minted successfully!', {
      mint: nft.mint.address.toString(),
    });

    // Get the transaction signature from the NFT
    const signature = nft.mint.address.toString(); // This is a placeholder, actual signature would be from the transaction

    // Build explorer URL
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
    const explorerUrl = `https://solscan.io/token/${nft.mint.address.toString()}?cluster=${network}`;

    // Step 4: Complete
    onProgress?.({
      step: 'complete',
      message: 'NFT minted successfully!',
      percentage: 100,
    });

    return {
      mint: nft.mint.address.toString(),
      metadata: nft.metadataAddress.toString(),
      masterEdition: nft.edition?.address.toString(),
      tokenAccount: nft.token.address.toString(),
      signature,
      explorerUrl,
      metadataUri,
    };
  } catch (error) {
    console.error('❌ Error minting NFT with wallet:', error);
    
    onProgress?.({
      step: 'error',
      message: error instanceof Error ? error.message : 'Failed to mint NFT',
      percentage: 0,
    });
    
    throw new Error(
      `Failed to mint NFT: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Estimate transaction fees for minting
 */
export function estimateWalletMintFee(nftType: 'master-edition' | 'sft' | 'cnft'): number {
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

