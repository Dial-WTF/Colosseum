import { PublicKey } from '@solana/web3.js';

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet';

export const LAMPORTS_PER_SOL = 1_000_000_000;

export const DEFAULT_ROYALTY_BPS = 500; // 5%

export const METAPLEX_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

export const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
);

export const MASTER_EDITION_DECIMALS = 0;
export const MASTER_EDITION_SUPPLY = 0; // 0 means master edition

