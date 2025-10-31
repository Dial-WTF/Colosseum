'use client';

import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { motion, AnimatePresence } from 'framer-motion';
import type { BondingCurveConfig } from '@dial/bonding-curve';
import { solToLamports } from '@dial/bonding-curve';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface BondingCurveEditorProps {
  config: BondingCurveConfig;
  onChange: (config: BondingCurveConfig) => void;
  className?: string;
}

export function BondingCurveEditor({ config, onChange, className = '' }: BondingCurveEditorProps) {
  const [curveType, setCurveType] = useState<BondingCurveConfig['type']>(config.type);
  const [basePrice, setBasePrice] = useState(config.basePrice);
  const [priceIncrement, setPriceIncrement] = useState(config.priceIncrement);
  const [maxSupply, setMaxSupply] = useState(config.maxSupply);

  const handleUpdate = (updates: Partial<BondingCurveConfig>) => {
    onChange({
      ...config,
      ...updates,
    });
  };

  const handleTypeChange = (type: BondingCurveConfig['type']) => {
    setCurveType(type);
    onChange({
      ...config,
      type,
    });
  };

  const handleBasePriceChange = (value: number[]) => {
    const sol = value[0];
    setBasePrice(sol);
    handleUpdate({ basePrice: sol });
  };

  const handleIncrementChange = (value: number[]) => {
    const increment = value[0];
    setPriceIncrement(increment);
    handleUpdate({ priceIncrement: increment });
  };

  const handleMaxSupplyChange = (value: number[]) => {
    const supply = Math.floor(value[0]);
    setMaxSupply(supply);
    handleUpdate({ maxSupply: supply });
  };

  const curveTypes = [
    {
      type: 'linear' as const,
      icon: TrendingUp,
      label: 'Linear',
      description: 'Constant price increase per edition',
      color: 'text-blue-500',
    },
    {
      type: 'exponential' as const,
      icon: Activity,
      label: 'Exponential',
      description: 'Accelerating price growth',
      color: 'text-orange-500',
    },
    {
      type: 'logarithmic' as const,
      icon: TrendingDown,
      label: 'Logarithmic',
      description: 'Diminishing price increases',
      color: 'text-green-500',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Curve Type Selector */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Curve Type</h3>
        <div className="grid grid-cols-3 gap-3">
          {curveTypes.map(({ type, icon: Icon, label, description, color }) => (
            <motion.button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                curveType === type
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className={`h-5 w-5 mb-2 ${color}`} />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Base Price */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold">Base Price</label>
          <span className="text-sm font-mono text-primary">{basePrice.toFixed(4)} SOL</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[basePrice]}
          onValueChange={handleBasePriceChange}
          max={5}
          min={0.001}
          step={0.001}
        >
          <Slider.Track className="bg-muted relative grow rounded-full h-2">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-primary rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            aria-label="Base Price"
          />
        </Slider.Root>
        <p className="text-xs text-muted-foreground mt-1">Starting price for supply 0</p>
      </div>

      {/* Price Increment Parameter */}
      <AnimatePresence mode="wait">
        {curveType === 'linear' && (
          <motion.div
            key="linear"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Price Increment</label>
              <span className="text-sm font-mono text-primary">{priceIncrement.toFixed(4)} SOL</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[priceIncrement]}
              onValueChange={handleIncrementChange}
              max={1}
              min={0.001}
              step={0.001}
            >
              <Slider.Track className="bg-muted relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-primary rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-5 h-5 bg-primary rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                aria-label="Increment"
              />
            </Slider.Root>
            <p className="text-xs text-muted-foreground mt-1">
              Price increase per unit (linear growth)
            </p>
          </motion.div>
        )}

        {curveType === 'exponential' && (
          <motion.div
            key="exponential"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Growth Rate</label>
              <span className="text-sm font-mono text-primary">{(priceIncrement * 100).toFixed(2)}%</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[priceIncrement]}
              onValueChange={handleIncrementChange}
              max={1}
              min={0.01}
              step={0.01}
            >
              <Slider.Track className="bg-muted relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-primary rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-5 h-5 bg-primary rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                aria-label="Growth Rate"
              />
            </Slider.Root>
            <p className="text-xs text-muted-foreground mt-1">
              Exponential growth rate (higher = faster growth)
            </p>
          </motion.div>
        )}

        {curveType === 'logarithmic' && (
          <motion.div
            key="logarithmic"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Log Scaling Factor</label>
              <span className="text-sm font-mono text-primary">{priceIncrement.toFixed(4)} SOL</span>
            </div>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[priceIncrement]}
              onValueChange={handleIncrementChange}
              max={1}
              min={0.001}
              step={0.001}
            >
              <Slider.Track className="bg-muted relative grow rounded-full h-2">
                <Slider.Range className="absolute bg-primary rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-5 h-5 bg-primary rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                aria-label="Log Scaling"
              />
            </Slider.Root>
            <p className="text-xs text-muted-foreground mt-1">
              Logarithmic scaling factor (diminishing returns)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Max Supply */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-semibold">Max Supply</label>
          <span className="text-sm font-mono text-primary">{maxSupply}</span>
        </div>
        <Slider.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[maxSupply]}
          onValueChange={handleMaxSupplyChange}
          max={10000}
          min={10}
          step={10}
        >
          <Slider.Track className="bg-muted relative grow rounded-full h-2">
            <Slider.Range className="absolute bg-primary rounded-full h-full" />
          </Slider.Track>
          <Slider.Thumb
            className="block w-5 h-5 bg-primary rounded-full hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
            aria-label="Max Supply"
          />
        </Slider.Root>
        <p className="text-xs text-muted-foreground mt-1">
          Maximum number of NFTs in collection
        </p>
      </div>
    </div>
  );
}

