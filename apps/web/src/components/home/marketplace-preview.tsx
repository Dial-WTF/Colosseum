'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function MarketplacePreview() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Recent Listings</h2>
            <p className="text-muted-foreground">Browse and trade ringtone NFTs</p>
          </div>
          <Link
            href="/marketplace"
            className="flex items-center space-x-2 text-primary hover:underline"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-secondary rounded-lg p-4 hover:bg-secondary/70 transition-colors cursor-pointer"
            >
              <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center text-4xl">
                🎵
              </div>
              <h4 className="font-semibold mb-1">Dial Tones Vol. 1 #{i}</h4>
              <p className="text-sm text-muted-foreground mb-2">Edition {i}/100</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-primary">
                  {(0.5 + i * 0.1).toFixed(1)} SOL
                </span>
                <span className="text-xs text-muted-foreground">Last: 0.{i}5 SOL</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

