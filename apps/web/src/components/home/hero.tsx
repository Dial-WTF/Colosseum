'use client';

import { Phone, Zap, TrendingUp } from 'lucide-react';

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-20 text-center">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          Limited Edition <span className="text-primary">Ringtone NFTs</span> on Solana
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Mint, collect, and trade exclusive ringtones as NFTs. Each ringtone pack is a limited Master Edition with bonding curve pricing.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <a
            href="#mint"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Start Minting
          </a>
          <a
            href="/marketplace"
            className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/80 transition-colors"
          >
            Explore Marketplace
          </a>
        </div>

        <div className="grid md:grid-cols-3 gap-8 pt-12">
          <div className="space-y-2">
            <Phone className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-semibold text-lg">Master Editions</h3>
            <p className="text-sm text-muted-foreground">
              Each ringtone is a limited edition NFT with numbered prints
            </p>
          </div>
          
          <div className="space-y-2">
            <TrendingUp className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-semibold text-lg">Bonding Curves</h3>
            <p className="text-sm text-muted-foreground">
              Dynamic pricing that increases with scarcity
            </p>
          </div>
          
          <div className="space-y-2">
            <Zap className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-semibold text-lg">Instant Trading</h3>
            <p className="text-sm text-muted-foreground">
              Trade on the open market with full Metaplex support
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

