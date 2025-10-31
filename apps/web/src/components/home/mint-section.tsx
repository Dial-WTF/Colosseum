'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { NFTTypeSelector } from '~/mint/nft-type-selector';

export function MintSection() {
  const [selectedType, setSelectedType] = useState<'master-edition' | 'sft' | 'cnft'>('master-edition');

  return (
    <section id="mint" className="container mx-auto px-4 py-20 bg-secondary/30">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Mint Your Ringtone NFT</h2>
          <p className="text-muted-foreground">
            Select the NFT type and choose your ringtone pack
          </p>
        </div>

        <div className="bg-background border border-border rounded-lg p-8 space-y-6">
          <NFTTypeSelector selectedType={selectedType} onTypeChange={setSelectedType} />

          <div className="border-t border-border pt-6">
            <h3 className="font-semibold mb-4">Available Ringtone Packs</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <RingtonePack
                name="Dial Tones Vol. 1"
                supply="42/100"
                price="0.5 SOL"
                image="🎵"
              />
              <RingtonePack
                name="Retro Ringtones"
                supply="23/50"
                price="0.8 SOL"
                image="📞"
              />
              <RingtonePack
                name="Future Beats"
                supply="87/200"
                price="0.3 SOL"
                image="🔮"
              />
              <RingtonePack
                name="Classic Collection"
                supply="15/25"
                price="1.2 SOL"
                image="👑"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RingtonePack({
  name,
  supply,
  price,
  image,
}: {
  name: string;
  supply: string;
  price: string;
  image: string;
}) {
  return (
    <div className="bg-secondary rounded-lg p-4 hover:bg-secondary/70 transition-colors cursor-pointer">
      <div className="flex items-center space-x-4">
        <div className="text-5xl">{image}</div>
        <div className="flex-1">
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground">Edition: {supply}</p>
          <p className="text-sm font-semibold text-primary">{price}</p>
        </div>
      </div>
    </div>
  );
}

