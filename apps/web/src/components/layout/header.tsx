'use client';

import Link from 'next/link';
import { Phone } from 'lucide-react';
import { SolanaWalletButton } from '#/components/wallet/solana-wallet-button';

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <Phone className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Dial.WTF</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/feed" className="text-sm font-medium hover:text-primary transition-colors">
            Feed
          </Link>
          <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">
            Marketplace
          </Link>
          <Link href="/dashboard/create/image" className="text-sm font-medium hover:text-primary transition-colors">
            Image Studio
          </Link>
          <Link href="/dashboard/create/audio" className="text-sm font-medium hover:text-primary transition-colors">
            Audio Studio
          </Link>
          <Link href="/dashboard/mint" className="text-sm font-medium hover:text-primary transition-colors">
            Mint
          </Link>
          <Link href="/dashboard/my-collection" className="text-sm font-medium hover:text-primary transition-colors">
            My Collection
          </Link>
        </nav>

        <SolanaWalletButton />
      </div>
    </header>
  );
}

