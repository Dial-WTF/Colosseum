'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { ReactNode } from 'react';

interface PrivyProviderWrapperProps {
  children: ReactNode;
}

export function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  // If no app ID is configured, render children without Privy wrapper
  if (!appId || appId === 'your_privy_app_id_here') {
    console.error(
      '⚠️ NEXT_PUBLIC_PRIVY_APP_ID is not configured!\n' +
      '📝 Please follow these steps:\n' +
      '1. Go to https://dashboard.privy.io/ and create an app\n' +
      '2. Copy your App ID\n' +
      '3. Add it to apps/web/.env.local as NEXT_PUBLIC_PRIVY_APP_ID=your_app_id\n' +
      '4. Restart the dev server\n' +
      '📚 See PRIVY_SETUP.md for detailed instructions'
    );
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Customize Privy appearance
        appearance: {
          theme: 'dark',
          accentColor: '#6366F1',
          logo: '/logo.png',
        },
        // Configure embedded wallets
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        // Configure supported login methods
        loginMethods: ['email', 'wallet', 'google', 'twitter'],
        // Configure supported chains (Solana mainnet and devnet)
        supportedChains: [
          {
            id: 900, // Solana mainnet
            name: 'Solana',
            network: 'mainnet-beta',
            nativeCurrency: {
              name: 'SOL',
              symbol: 'SOL',
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ['https://api.mainnet-beta.solana.com'],
              },
              public: {
                http: ['https://api.mainnet-beta.solana.com'],
              },
            },
          },
          {
            id: 901, // Solana devnet
            name: 'Solana Devnet',
            network: 'devnet',
            nativeCurrency: {
              name: 'SOL',
              symbol: 'SOL',
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ['https://api.devnet.solana.com'],
              },
              public: {
                http: ['https://api.devnet.solana.com'],
              },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

