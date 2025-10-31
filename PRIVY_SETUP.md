# Privy Integration Setup Guide

This guide will help you set up Privy authentication and wallet management for Dial.WTF.

## 🚀 Quick Start

### 1. Get Your Privy App ID

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Sign up or log in
3. Create a new app or use an existing one
4. Copy your **App ID** from the dashboard

### 2. Configure Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `.env.local` and add your Privy App ID:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
```

### 3. Configure Privy Dashboard Settings

In your Privy Dashboard, configure the following:

#### Allowed Origins
Add your development and production URLs:
- `http://localhost:3000`
- `https://yourdomain.com` (for production)

#### Allowed Chains
Enable Solana:
- Solana Mainnet
- Solana Devnet (for testing)

#### Login Methods
Enable the authentication methods you want to support:
- ✅ Email
- ✅ Wallet (Phantom, Solflare, etc.)
- ✅ Social (Google, Twitter, Discord, etc.)

#### Embedded Wallets
- Enable "Create embedded wallets for users without wallets"
- This allows users without crypto wallets to still participate

## 📁 File Structure

```
apps/web/src/
├── providers/
│   ├── index.tsx              # Main providers wrapper
│   └── privy-provider.tsx     # Privy configuration
├── components/wallet/
│   └── privy-wallet-button.tsx # Wallet connect button with UI
├── hooks/
│   └── use-solana-wallet.ts   # Custom hook for Solana interactions
└── app/
    └── layout.tsx             # Root layout with providers
```

## 🎨 Features Implemented

### 1. Authentication
- ✅ Multiple login methods (email, wallet, social)
- ✅ Embedded wallet creation
- ✅ Session management
- ✅ User profile access

### 2. Wallet Connection
- ✅ Connect/disconnect functionality
- ✅ Wallet address display
- ✅ Multiple wallet support
- ✅ Solana-specific integration

### 3. UI Components
- ✅ Responsive wallet button
- ✅ User dropdown menu
- ✅ Wallet info display
- ✅ Loading states
- ✅ Dark mode support

### 4. Developer Experience
- ✅ TypeScript support
- ✅ Custom React hooks
- ✅ Error handling
- ✅ Transaction signing helpers

## 🔧 Usage Examples

### Using the Wallet Button

The `PrivyWalletButton` is already integrated in the header:

```tsx
import { PrivyWalletButton } from '#/components/wallet/privy-wallet-button';

<PrivyWalletButton />
```

### Accessing User Information

```tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';

export function MyComponent() {
  const { authenticated, user } = usePrivy();

  if (!authenticated) {
    return <div>Please connect your wallet</div>;
  }

  return (
    <div>
      <p>Email: {user?.email?.address}</p>
      <p>User ID: {user?.id}</p>
    </div>
  );
}
```

### Using the Solana Wallet Hook

```tsx
'use client';

import { useSolanaWallet } from '@/src/hooks/use-solana-wallet';

export function MyComponent() {
  const { connected, address, publicKey, signAndSendTransaction } = useSolanaWallet();

  const handleTransaction = async () => {
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      // Create your transaction
      const transaction = new Transaction();
      // ... add instructions to transaction

      // Sign and send
      const signature = await signAndSendTransaction(transaction);
      console.log('Transaction successful:', signature);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div>
      {connected ? (
        <>
          <p>Connected: {address}</p>
          <button onClick={handleTransaction}>Send Transaction</button>
        </>
      ) : (
        <p>Not connected</p>
      )}
    </div>
  );
}
```

### Protecting Routes

```tsx
'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function ProtectedPage() {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  if (!ready) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return null;
  }

  return <div>Protected content</div>;
}
```

## 🎨 Customization

### Styling the Privy Modal

The Privy configuration in `privy-provider.tsx` includes appearance settings:

```tsx
appearance: {
  theme: 'dark',
  accentColor: '#6366F1',
  logo: 'https://dial.wtf/logo.png',
}
```

You can customize:
- `theme`: 'light' or 'dark'
- `accentColor`: Any hex color
- `logo`: URL to your logo image

### Login Methods

Edit the `loginMethods` array in `privy-provider.tsx`:

```tsx
loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord', 'github']
```

Available options:
- `email` - Email/password authentication
- `wallet` - External wallet connection
- `google` - Google OAuth
- `twitter` - Twitter OAuth
- `discord` - Discord OAuth
- `github` - GitHub OAuth
- `apple` - Apple Sign In

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Use environment-specific App IDs** - Different IDs for dev/staging/prod
3. **Validate transactions on the backend** - Don't trust client-side only
4. **Implement rate limiting** - Protect your API endpoints
5. **Monitor suspicious activity** - Use Privy dashboard analytics

## 🐛 Troubleshooting

### "NEXT_PUBLIC_PRIVY_APP_ID is not set" Warning

Make sure you:
1. Created a `.env.local` file
2. Added your Privy App ID
3. Restarted the dev server

### Wallet Not Connecting

Check that:
1. Your domain is whitelisted in Privy Dashboard
2. Solana is enabled in supported chains
3. User has a compatible wallet installed (for external wallets)

### Transaction Signing Fails

Verify:
1. Wallet is properly connected
2. User has approved the transaction
3. Account has sufficient SOL for fees
4. RPC endpoint is responsive

## 📚 Additional Resources

- [Privy Documentation](https://docs.privy.io/)
- [Privy React Auth SDK](https://docs.privy.io/reference/react-auth)
- [Solana Web3.js Documentation](https://solana-labs.github.io/solana-web3.js/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🆘 Support

If you encounter issues:
1. Check the browser console for errors
2. Review Privy Dashboard logs
3. Consult the [Privy Discord](https://discord.gg/privy)
4. Open an issue in the project repository

## ✅ Next Steps

After setting up Privy:
1. ✅ Test wallet connection flow
2. ✅ Verify user authentication works
3. ✅ Test transaction signing
4. ⬜ Implement NFT minting with wallet integration
5. ⬜ Add wallet-gated features
6. ⬜ Integrate with Metaplex for NFT operations
7. ⬜ Add user profile management
8. ⬜ Implement collection viewing with wallet filtering

