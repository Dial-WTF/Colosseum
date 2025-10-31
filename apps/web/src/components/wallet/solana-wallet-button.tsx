'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function SolanaWalletButton() {
  return (
    <WalletMultiButton 
      className="!bg-primary !text-primary-foreground !rounded-lg !font-semibold hover:!bg-primary/90 !transition-colors"
    />
  );
}

