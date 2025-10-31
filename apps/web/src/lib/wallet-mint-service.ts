/**
 * Wallet-Based NFT Minting Service
 * Mints NFTs using the connected Solana wallet (no server-side private key needed)
 */

import {
  Metaplex,
  walletAdapterIdentity,
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

  const metaplex = Metaplex.make(connection)
    .use(walletAdapterIdentity(wallet));

  console.log('🔧 Metaplex instance created with:', {
    rpcEndpoint: connection.rpcEndpoint,
    wallet: wallet.publicKey.toBase58(),
    commitment: connection.commitment,
  });

  return metaplex;
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
 * Check if wallet has sufficient balance for minting
 */
async function checkWalletBalance(
  connection: Connection,
  publicKey: PublicKey,
  nftType: 'master-edition' | 'sft' | 'cnft'
): Promise<{ sufficient: boolean; balance: number; required: number }> {
  const balance = await connection.getBalance(publicKey);
  const balanceInSol = balance / 1_000_000_000;
  const requiredSol = estimateWalletMintFee(nftType);

  return {
    sufficient: balanceInSol >= requiredSol,
    balance: balanceInSol,
    required: requiredSol,
  };
}

/**
 * Airdrop SOL for devnet testing
 */
async function airdropDevnetSol(
  connection: Connection,
  publicKey: PublicKey,
  amount: number = 2
): Promise<void> {
  try {
    console.log(`🪂 Requesting ${amount} SOL airdrop for ${publicKey.toBase58()}...`);
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * 1_000_000_000
    );
    
    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');
    console.log(`✅ Airdrop confirmed: ${signature}`);
  } catch (error) {
    console.error('❌ Airdrop failed:', error);
    throw new Error(
      `Failed to airdrop SOL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
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

    // Check wallet balance
    console.log('💰 Checking wallet balance...');
    const balanceCheck = await checkWalletBalance(
      connection,
      wallet.publicKey,
      params.nftType
    );

    console.log(`Wallet balance: ${balanceCheck.balance.toFixed(4)} SOL`);
    console.log(`Required: ${balanceCheck.required.toFixed(4)} SOL`);

    // If insufficient balance and on devnet, request airdrop
    if (!balanceCheck.sufficient) {
      const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';
      
      if (network === 'devnet') {
        onProgress?.({
          step: 'uploading',
          message: 'Insufficient balance detected. Requesting devnet airdrop...',
          percentage: 5,
        });

        try {
          await airdropDevnetSol(connection, wallet.publicKey, 2);
          console.log('✅ Airdrop successful!');
        } catch (airdropError) {
          throw new Error(
            `Insufficient balance (${balanceCheck.balance.toFixed(4)} SOL) and airdrop failed. ` +
            `Please manually airdrop SOL to your wallet: solana airdrop 2 ${wallet.publicKey.toBase58()}`
          );
        }
      } else {
        throw new Error(
          `Insufficient balance: ${balanceCheck.balance.toFixed(4)} SOL. ` +
          `Required: ${balanceCheck.required.toFixed(4)} SOL. ` +
          `Please add SOL to your wallet (${wallet.publicKey.toBase58()}) to continue.`
        );
      }
    }

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

    // Prepare creators array - must match the format expected by Metaplex
    const creators = [
      {
        address: wallet.publicKey,
        share: 100,
      },
    ];

    // Determine maxSupply based on NFT type
    // Master Edition: 0 means unique 1/1 NFT
    // SFT: Uses the bonding curve's maxSupply
    const maxSupply = params.nftType === 'master-edition' ? 0 : params.bondingCurve.maxSupply;

    console.log('📋 NFT Creation Parameters:', {
      uri: metadataUri,
      name: params.name,
      symbol: params.symbol,
      sellerFeeBasisPoints: royaltyBasisPoints,
      tokenOwner: wallet.publicKey.toBase58(),
      updateAuthority: wallet.publicKey.toBase58(),
      maxSupply,
      nftType: params.nftType,
    });

    // Create the NFT using Metaplex SDK with wallet adapter
    // CRITICAL: Must specify tokenOwner and updateAuthority to properly initialize accounts
    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name: params.name,
      symbol: params.symbol,
      sellerFeeBasisPoints: royaltyBasisPoints,
      creators,
      isMutable: true,
      maxSupply,
      tokenOwner: wallet.publicKey, // The wallet that will own the NFT token
      updateAuthority: wallet.publicKey, // The wallet that can update metadata
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

    // Get token account address (handle different Metaplex versions)
    const tokenAccount = (nft as any).token?.address?.toString() || 
                        (nft as any).tokenAddress?.toString() || 
                        wallet.publicKey.toBase58();

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
      tokenAccount,
      signature,
      explorerUrl,
      metadataUri,
    };
  } catch (error: any) {
    console.error('❌ Error minting NFT with wallet:', error);
    
    // Extract more detailed error information
    let errorMessage = 'Failed to mint NFT';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific Solana/Metaplex errors
      if (error.message.includes('Attempt to debit an account')) {
        errorMessage = 
          'Transaction failed: Missing or unfunded account. ' +
          'This usually means the wallet needs more SOL or an account needs initialization. ' +
          `Wallet: ${wallet.publicKey?.toBase58()}`;
      } else if (error.message.includes('Simulation failed')) {
        errorMessage = 
          'Transaction simulation failed. Please check your wallet balance and network connection. ' +
          `Details: ${error.message}`;
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 
          'Insufficient funds in wallet. Please add more SOL to cover transaction fees. ' +
          `Wallet: ${wallet.publicKey?.toBase58()}`;
      }
    }
    
    // Log additional error context
    console.error('Error context:', {
      walletAddress: wallet.publicKey?.toBase58(),
      nftType: params.nftType,
      errorName: error?.name,
      errorCause: error?.cause,
      errorStack: error?.stack,
    });
    
    onProgress?.({
      step: 'error',
      message: errorMessage,
      percentage: 0,
    });
    
    throw new Error(`Failed to mint NFT: ${errorMessage}`);
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

