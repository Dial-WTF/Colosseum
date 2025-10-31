'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Wallet, LogOut, User } from 'lucide-react';
import { useState } from 'react';

// Solana Logo SVG Component
function SolanaLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 397.7 311.7" xmlns="http://www.w3.org/2000/svg">
      <linearGradient id="solana-gradient" x1="360.88" y1="351.46" x2="-141.46" y2="-115.09" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#00ffa3"/>
        <stop offset="1" stopColor="#dc1fff"/>
      </linearGradient>
      <path fill="url(#solana-gradient)" d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"/>
      <path fill="url(#solana-gradient)" d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
      <path fill="url(#solana-gradient)" d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
    </svg>
  );
}

export function PrivyWalletButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [showMenu, setShowMenu] = useState(false);

  // Get the primary wallet (Solana)
  const solanaWallet = wallets.find((wallet) => wallet.walletClientType === 'solana');
  
  // Format wallet address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Show loading state while Privy is initializing
  if (!ready) {
    return (
      <button
        disabled
        className="flex items-center space-x-2 px-4 py-2 bg-primary/50 text-primary-foreground rounded-lg font-semibold cursor-not-allowed"
      >
        <Wallet className="h-4 w-4 animate-pulse" />
        <span>Loading...</span>
      </button>
    );
  }

  // Not authenticated - show connect button
  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        <Wallet className="h-4 w-4" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  // Authenticated - show wallet info with dropdown menu
  // Get the first available wallet address
  const walletAddress = solanaWallet?.address || wallets[0]?.address;
  
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        {walletAddress ? (
          <>
            <SolanaLogo className="h-5 w-5 flex-shrink-0" />
            <span className="font-mono text-sm">
              {formatAddress(walletAddress)}
            </span>
          </>
        ) : (
          <>
            <User className="h-4 w-4" />
            <span>
              {user?.email?.address || 'Connected'}
            </span>
          </>
        )}
      </button>

      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* User Info Section */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-[#00ffa3] to-[#dc1fff] rounded-full flex items-center justify-center p-2">
                  <SolanaLogo className="h-full w-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user?.email?.address || 'Anonymous'}
                  </p>
                  {walletAddress && (
                    <p className="text-xs text-muted-foreground font-mono">
                      {formatAddress(walletAddress)}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Wallet Info */}
              {walletAddress && (
                <div className="mt-3 p-2 bg-secondary/50 rounded text-xs">
                  <p className="text-muted-foreground mb-1 flex items-center gap-1">
                    <SolanaLogo className="h-3 w-3" />
                    Solana Address
                  </p>
                  <p className="font-mono break-all text-foreground">
                    {walletAddress}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-2">
              <button
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

