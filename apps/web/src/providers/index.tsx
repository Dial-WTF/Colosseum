'use client';

import { ReactNode, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { UserProvider } from './user-context';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { autoMigrate } from '@/lib/storage-migration';

// Dynamically import WalletModalProvider to avoid SSR issues
const WalletModalProvider = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletModalProvider,
  { ssr: false }
);

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Use devnet for development
  const network = WalletAdapterNetwork.Devnet;
  
  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configure supported wallets - only Solana wallets
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  // Run storage migration on app startup
  useEffect(() => {
    autoMigrate().catch(error => {
      console.error('Failed to run storage migration:', error);
    });
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

