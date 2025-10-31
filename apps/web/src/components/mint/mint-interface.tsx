'use client';

import { useState } from 'react';
import { NFTTypeSelector } from '~/mint/nft-type-selector';
import { BondingCurveConfigurator } from '~/mint/bonding-curve-configurator';
import { Volume2, Info } from 'lucide-react';
import type { BondingCurveConfig } from '@dial/bonding-curve';
import { solToLamports, calculatePrice, formatLamportsToSOL } from '@dial/bonding-curve';

export function MintInterface() {
  const [selectedType, setSelectedType] = useState<'master-edition' | 'sft' | 'cnft'>('master-edition');
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  // Sample bonding curve configs for each pack
  const bondingCurves: Record<string, BondingCurveConfig> = {
    'dial-tones-1': {
      type: 'linear',
      parameters: {
        basePrice: solToLamports(0.5),
        increment: solToLamports(0.01),
        maxPrice: solToLamports(5),
      },
    },
    'retro-ringtones': {
      type: 'exponential',
      parameters: {
        basePrice: solToLamports(0.8),
        multiplier: 1.02,
        maxPrice: solToLamports(10),
      },
    },
    'future-beats': {
      type: 'logarithmic',
      parameters: {
        basePrice: solToLamports(0.3),
        increment: solToLamports(0.05),
        maxPrice: solToLamports(3),
      },
    },
    'classic-collection': {
      type: 'exponential',
      parameters: {
        basePrice: solToLamports(1.0),
        multiplier: 1.05,
        maxPrice: solToLamports(20),
      },
    },
  };

  const packs = [
    {
      id: 'dial-tones-1',
      name: 'Dial Tones Vol. 1',
      supply: { minted: 42, total: 100 },
      image: '🎵',
      description: 'Classic dial tones reimagined for the modern era',
      bondingCurve: bondingCurves['dial-tones-1'],
    },
    {
      id: 'retro-ringtones',
      name: 'Retro Ringtones',
      supply: { minted: 23, total: 50 },
      image: '📞',
      description: 'Nostalgic ringtones from the golden age',
      bondingCurve: bondingCurves['retro-ringtones'],
    },
    {
      id: 'future-beats',
      name: 'Future Beats',
      supply: { minted: 87, total: 200 },
      image: '🔮',
      description: 'Futuristic sounds for the next generation',
      bondingCurve: bondingCurves['future-beats'],
    },
    {
      id: 'classic-collection',
      name: 'Classic Collection',
      supply: { minted: 15, total: 25 },
      image: '👑',
      description: 'Premium curated ringtones for collectors',
      bondingCurve: bondingCurves['classic-collection'],
    },
  ].map(pack => {
    const currentPrice = calculatePrice(pack.supply.minted + 1, pack.bondingCurve);
    const nextPrice = getNextPrice(pack.supply.minted + 1, pack.bondingCurve);
    return {
      ...pack,
      currentPrice: parseFloat(formatLamportsToSOL(currentPrice, 4)),
      nextPrice: parseFloat(formatLamportsToSOL(nextPrice, 4)),
    };
  });

  return (
    <div className="space-y-8">
      <div className="bg-background border border-border rounded-lg p-6">
        <NFTTypeSelector selectedType={selectedType} onTypeChange={setSelectedType} />
      </div>

      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Select Ringtone Pack</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {packs.map((pack) => (
            <button
              key={pack.id}
              onClick={() => setSelectedPack(pack.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedPack === pack.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="text-5xl">{pack.image}</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{pack.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {pack.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {pack.supply.minted}/{pack.supply.total} minted
                    </span>
                    <span className="font-semibold text-primary">
                      {pack.currentPrice} SOL
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${(pack.supply.minted / pack.supply.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedPack && (
        <>
          {/* Bonding Curve Configurator */}
          {(() => {
            const pack = packs.find((p) => p.id === selectedPack)!;
            return (
              <>
                <BondingCurveConfigurator
                  initialConfig={pack.bondingCurve}
                  currentEdition={pack.supply.minted}
                  totalSupply={pack.supply.total}
                  editable={false}
                />

                <div className="bg-background border border-border rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Mint Details</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">{pack.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Edition #{pack.supply.minted + 1}/{pack.supply.total}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="text-xl font-bold text-primary">{pack.currentPrice} SOL</p>
                      </div>
                    </div>

                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-start space-x-3">
                      <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium mb-1">Bonding Curve Pricing</p>
                        <p className="text-muted-foreground">
                          Next mint will cost <span className="font-semibold text-foreground">{pack.nextPrice} SOL</span>. 
                          Price increases with each mint based on the bonding curve.
                        </p>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                      Mint Edition #{pack.supply.minted + 1} for {pack.currentPrice} SOL
                    </button>

                    <p className="text-xs text-center text-muted-foreground">
                      * Plus network fees (~0.01 SOL)
                    </p>
                  </div>
                </div>
              </>
            );
          })()}
        </>
      )}
    </div>
  );
}

