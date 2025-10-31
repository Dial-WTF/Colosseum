'use client';

import { useState } from 'react';
import { Header } from '~/layout/header';
import { BondingCurveConfigurator } from '~/mint/bonding-curve-configurator';
import type { BondingCurveConfig } from '@dial/bonding-curve';
import { solToLamports } from '@dial/bonding-curve';
import { Sparkles, Info } from 'lucide-react';

export default function BondingCurveDemoPage() {
  const [config, setConfig] = useState<BondingCurveConfig>({
    type: 'exponential',
    basePrice: 0.5,
    priceIncrement: 0.05,
    maxSupply: 100,
  });

  const [totalSupply, setTotalSupply] = useState(100);
  const [currentEdition, setCurrentEdition] = useState(42);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Bonding Curve Demo</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Interactive tokenomics calculator and bonding curve editor for NFT collections
              </p>
            </div>

            {/* Info Banner */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <Info className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">What is a Bonding Curve?</h2>
                  <p className="text-sm text-muted-foreground">
                    A bonding curve is an algorithmic pricing mechanism where the price of an NFT
                    increases based on the number already minted. This creates scarcity and rewards
                    early adopters while ensuring fair, transparent pricing for everyone.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-background rounded-lg p-3">
                      <p className="font-semibold text-sm mb-1">📈 Linear</p>
                      <p className="text-xs text-muted-foreground">
                        Constant price increase per mint
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3">
                      <p className="font-semibold text-sm mb-1">🚀 Exponential</p>
                      <p className="text-xs text-muted-foreground">
                        Accelerating growth for premium collections
                      </p>
                    </div>
                    <div className="bg-background rounded-lg p-3">
                      <p className="font-semibold text-sm mb-1">📊 Logarithmic</p>
                      <p className="text-xs text-muted-foreground">
                        Diminishing increases for accessibility
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-background border border-border rounded-lg p-4">
                <label className="text-sm font-semibold mb-2 block">Total Supply</label>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {totalSupply} editions
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <label className="text-sm font-semibold mb-2 block">Current Edition (Simulation)</label>
                <input
                  type="range"
                  min="0"
                  max={totalSupply}
                  value={currentEdition}
                  onChange={(e) => setCurrentEdition(parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  {currentEdition} / {totalSupply} minted ({((currentEdition / totalSupply) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>

            {/* Bonding Curve Configurator */}
            <BondingCurveConfigurator
              initialConfig={config}
              currentEdition={currentEdition}
              totalSupply={totalSupply}
              onConfigChange={setConfig}
              editable={true}
            />

            {/* Feature Highlights */}
            <div className="mt-8 grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-6">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-semibold mb-2">Real-time Visualization</h3>
                <p className="text-sm text-muted-foreground">
                  See your bonding curve in action with interactive charts powered by Recharts
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="font-semibold mb-2">Precise Calculations</h3>
                <p className="text-sm text-muted-foreground">
                  Built with Decimal.js for accurate tokenomics with no floating-point errors
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-6">
                <div className="text-3xl mb-3">⚡</div>
                <h3 className="font-semibold mb-2">Instant Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Adjust parameters and see changes across all metrics immediately
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

