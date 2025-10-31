/**
 * Bonding Curve Deployment & Minting Integration
 * Connects our deployed mainnet contract with Metaplex metadata
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  Metaplex,
  keypairIdentity,
  toMetaplexFile,
} from '@metaplex-foundation/js';
import { BondingCurveClient } from '@dial/bonding-curve-program';
import type { BondingCurveConfig } from '@dial/bonding-curve';

// Mainnet Program ID
const BONDING_CURVE_PROGRAM_ID = new PublicKey(
  '8KQf2fczuHCXXMWZnVogCS971rpuBxmMia93qg1BdP8G'
);

export interface DeployCollectionParams {
  name: string;
  symbol: string;
  description: string;
  image: string | Buffer;
  externalUrl?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  bondingCurve: BondingCurveConfig;
}

export interface MintEditionParams {
  collectionMint: PublicKey;
  bondingCurvePDA: PublicKey;
  editionNumber: number;
  name: string;
  symbol: string;
  image: string | Buffer;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}

export interface DeployedCollection {
  collectionMint: PublicKey;
  collectionMetadata: PublicKey;
  bondingCurvePDA: PublicKey;
  metadataUri: string;
  signature: string;
}

/**
 * Deploy a new NFT collection with bonding curve pricing
 * This:
 * 1. Creates Metaplex collection metadata
 * 2. Initializes bonding curve state
 * 3. Returns collection info for minting
 */
export async function deployCollectionWithBondingCurve(
  params: DeployCollectionParams,
  payer: Keypair,
  connection: Connection
): Promise<DeployedCollection> {
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer));

  // 1. Upload collection metadata to Arweave/IPFS
  console.log('📤 Uploading collection metadata...');
  
  const imageFile = typeof params.image === 'string'
    ? await fetch(params.image).then(r => r.arrayBuffer()).then(b => Buffer.from(b))
    : params.image;
  
  const metaplexImage = toMetaplexFile(imageFile, 'collection.png');
  const imageUri = await metaplex.storage().upload(metaplexImage);

  const metadata = {
    name: params.name,
    symbol: params.symbol,
    description: params.description,
    image: imageUri,
    external_url: params.externalUrl,
    attributes: params.attributes || [],
    properties: {
      files: [{ uri: imageUri, type: 'image/png' }],
      category: 'audio',
    },
  };

  const metadataUri = await metaplex.storage().uploadJson(metadata);
  console.log('✅ Metadata uploaded:', metadataUri);

  // 2. Create Metaplex Collection NFT
  console.log('🎨 Creating Metaplex collection...');
  const { nft: collection } = await metaplex.nfts().create({
    uri: metadataUri,
    name: params.name,
    symbol: params.symbol,
    sellerFeeBasisPoints: 500, // 5% royalty
    isCollection: true,
  });

  console.log('✅ Collection created:', collection.mint.address.toString());

  // 3. Initialize bonding curve
  console.log('📈 Initializing bonding curve...');
  const bondingCurveClient = new BondingCurveClient(connection);
  
  const basePrice = Math.floor(params.bondingCurve.basePrice * 1e9); // Convert SOL to lamports
  const priceIncrement = Math.floor(params.bondingCurve.priceIncrement * 1e9);

  const { bondingCurvePDA, signature } = await bondingCurveClient.initializeCurve({
    authority: payer.publicKey,
    collectionMint: collection.mint.address,
    basePrice,
    priceIncrement,
    maxSupply: params.bondingCurve.maxSupply,
  }, payer);

  console.log('✅ Bonding curve initialized:', bondingCurvePDA.toString());

  return {
    collectionMint: collection.mint.address,
    collectionMetadata: collection.metadataAddress,
    bondingCurvePDA,
    metadataUri,
    signature,
  };
}

/**
 * Mint an edition NFT with bonding curve pricing
 * This:
 * 1. Gets current price from bonding curve
 * 2. Mints token through curve contract (handles payment)
 * 3. Adds Metaplex metadata to the minted token
 */
export async function mintEditionWithMetadata(
  params: MintEditionParams,
  buyer: Keypair,
  connection: Connection
): Promise<{ mint: PublicKey; signature: string; price: number }> {
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(buyer));

  const bondingCurveClient = new BondingCurveClient(connection);

  // 1. Get current price
  const curveState = await bondingCurveClient.getCurveState(params.bondingCurvePDA);
  const currentPrice = curveState.basePrice + (curveState.currentSupply * curveState.priceIncrement);
  
  console.log(`💰 Current price: ${currentPrice / 1e9} SOL (Edition #${curveState.currentSupply + 1})`);

  // 2. Create mint for this edition
  console.log('🎫 Creating edition mint...');
  const editionMint = await createMint(
    connection,
    buyer,
    params.bondingCurvePDA, // Bonding curve is mint authority
    null, // No freeze authority
    0 // 0 decimals for NFT
  );

  // 3. Upload edition metadata
  console.log('📤 Uploading edition metadata...');
  const imageFile = typeof params.image === 'string'
    ? await fetch(params.image).then(r => r.arrayBuffer()).then(b => Buffer.from(b))
    : params.image;
  
  const metaplexImage = toMetaplexFile(imageFile, `edition-${params.editionNumber}.png`);
  const imageUri = await metaplex.storage().upload(metaplexImage);

  const metadata = {
    name: `${params.name} #${params.editionNumber}`,
    symbol: params.symbol,
    image: imageUri,
    attributes: [
      ...(params.attributes || []),
      { trait_type: 'Edition', value: params.editionNumber },
      { trait_type: 'Price (SOL)', value: (currentPrice / 1e9).toFixed(3) },
    ],
    properties: {
      files: [{ uri: imageUri, type: 'image/png' }],
      category: 'audio',
    },
  };

  const metadataUri = await metaplex.storage().uploadJson(metadata);
  console.log('✅ Edition metadata uploaded:', metadataUri);

  // 4. Mint through bonding curve (this handles payment automatically)
  console.log('⚡ Minting through bonding curve...');
  const mintSignature = await bondingCurveClient.mintEdition({
    bondingCurvePDA: params.bondingCurvePDA,
    editionMint,
    buyer: buyer.publicKey,
  }, buyer);

  console.log('✅ Minted! Signature:', mintSignature);

  // 5. Add Metaplex metadata to the minted token
  console.log('🎨 Adding Metaplex metadata...');
  await metaplex.nfts().create({
    uri: metadataUri,
    name: `${params.name} #${params.editionNumber}`,
    symbol: params.symbol,
    sellerFeeBasisPoints: 500,
    useExistingMint: editionMint,
    collection: params.collectionMint,
    collectionAuthority: buyer, // TODO: Should be curve authority
  });

  console.log('🎉 Edition minted with metadata!');

  return {
    mint: editionMint,
    signature: mintSignature,
    price: currentPrice,
  };
}

/**
 * Get current bonding curve info for a collection
 */
export async function getBondingCurveInfo(
  collectionMint: PublicKey,
  connection: Connection
) {
  const bondingCurveClient = new BondingCurveClient(connection);
  
  const [bondingCurvePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from('bonding_curve'), collectionMint.toBuffer()],
    BONDING_CURVE_PROGRAM_ID
  );

  const curveState = await bondingCurveClient.getCurveState(bondingCurvePDA);
  const currentPrice = curveState.basePrice + (curveState.currentSupply * curveState.priceIncrement);
  const nextPrice = curveState.basePrice + ((curveState.currentSupply + 1) * curveState.priceIncrement);

  return {
    bondingCurvePDA,
    currentSupply: curveState.currentSupply,
    maxSupply: curveState.maxSupply,
    basePrice: curveState.basePrice / 1e9, // Convert to SOL
    priceIncrement: curveState.priceIncrement / 1e9,
    currentPrice: currentPrice / 1e9,
    nextPrice: nextPrice / 1e9,
    totalVolume: curveState.totalVolume / 1e9,
  };
}

