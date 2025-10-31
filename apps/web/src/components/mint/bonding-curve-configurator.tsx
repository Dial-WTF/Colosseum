'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BondingCurveConfig } from '@dial/bonding-curve';
import { BondingCurveChart } from '~/mint/bonding-curve-chart';
import { BondingCurveEditor } from '~/mint/bonding-curve-editor';
import { TokenomicsCalculator } from '~/mint/tokenomics-calculator';
import { ChevronDown, ChevronUp, Settings, BarChart3, Calculator } from 'lucide-react';

interface BondingCurveConfiguratorProps {
  initialConfig: BondingCurveConfig;
  currentEdition: number;
  totalSupply: number;
  onConfigChange?: (config: BondingCurveConfig) => void;
  editable?: boolean;
}

export function BondingCurveConfigurator({
  initialConfig,
  currentEdition,
  totalSupply,
  onConfigChange,
  editable = false,
}: BondingCurveConfiguratorProps) {
  const [config, setConfig] = useState<BondingCurveConfig>(initialConfig);
  const [activeTab, setActiveTab] = useState<'chart' | 'editor' | 'calculator'>('chart');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleConfigChange = (newConfig: BondingCurveConfig) => {
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const tabs = [
    { id: 'chart' as const, label: 'Curve Visualization', icon: BarChart3 },
    ...(editable ? [{ id: 'editor' as const, label: 'Curve Editor', icon: Settings }] : []),
    { id: 'calculator' as const, label: 'Tokenomics', icon: Calculator },
  ];

  return (
    <div className="bg-background border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div className="text-left">
            <h2 className="text-lg font-semibold">Bonding Curve & Tokenomics</h2>
            <p className="text-xs text-muted-foreground">
              {config.type.charAt(0).toUpperCase() + config.type.slice(1)} pricing model
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              {/* Tabs */}
              <div className="flex border-b border-border bg-secondary/30">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      activeTab === id
                        ? 'bg-background border-b-2 border-primary text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                <AnimatePresence mode="wait">
                  {activeTab === 'chart' && (
                    <motion.div
                      key="chart"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BondingCurveChart
                        config={config}
                        currentEdition={currentEdition}
                        totalSupply={totalSupply}
                        showArea={true}
                      />
                      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div className="bg-secondary rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Curve Type</p>
                          <p className="text-sm font-semibold capitalize">{config.type}</p>
                        </div>
                        <div className="bg-secondary rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Supply Progress</p>
                          <p className="text-sm font-semibold">
                            {currentEdition}/{totalSupply}
                          </p>
                        </div>
                        <div className="bg-secondary rounded-lg p-3">
                          <p className="text-xs text-muted-foreground mb-1">Completion</p>
                          <p className="text-sm font-semibold">
                            {((currentEdition / totalSupply) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'editor' && editable && (
                    <motion.div
                      key="editor"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <BondingCurveEditor config={config} onChange={handleConfigChange} />
                      <div className="mt-6 bg-primary/10 border border-primary/20 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">
                          💡 <span className="font-semibold">Tip:</span> Adjust the curve parameters
                          and see the changes reflected in the chart and tokenomics tabs in real-time.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'calculator' && (
                    <motion.div
                      key="calculator"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TokenomicsCalculator
                        config={config}
                        currentEdition={currentEdition}
                        totalSupply={totalSupply}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

