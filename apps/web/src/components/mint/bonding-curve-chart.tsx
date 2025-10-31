'use client';

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
} from 'recharts';
import type { BondingCurveConfig, BezierCurveData } from '@dial/bonding-curve';
import { calculatePrice, formatLamportsToSOL, createDefaultBezierCurve } from '@dial/bonding-curve';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Eye } from 'lucide-react';
import { BezierCurveEditor } from '~/mint/bezier-curve-editor';

interface BondingCurveChartProps {
  config: BondingCurveConfig;
  currentEdition?: number;
  totalSupply: number;
  showArea?: boolean;
  editable?: boolean;
  onConfigChange?: (config: BondingCurveConfig) => void;
}

export function BondingCurveChart({
  config,
  currentEdition = 0,
  totalSupply = 100,
  showArea = true,
  editable = false,
  onConfigChange,
}: BondingCurveChartProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [localBezierData, setLocalBezierData] = useState<BezierCurveData>(() => {
    // Initialize with config's bezier curve or create a default one
    if (config.type === 'bezier' && config.bezierCurve) {
      return config.bezierCurve;
    }
    return createDefaultBezierCurve(config.basePrice, config.basePrice + config.priceIncrement * totalSupply);
  });

  const isBezierCurve = config.type === 'bezier';
  
  const chartData = useMemo(() => {
    const data = [];
    const step = Math.max(1, Math.floor(totalSupply / 50)); // Max 50 data points for performance
    
    for (let i = 0; i <= totalSupply; i += step) {
      const price = calculatePrice(i, config);
      data.push({
        edition: i,
        price: price,
        isCurrent: i === currentEdition,
      });
    }
    
    // Always include the last edition
    if (data[data.length - 1]?.edition !== totalSupply) {
      const price = calculatePrice(totalSupply, config);
      data.push({
        edition: totalSupply,
        price: price,
        isCurrent: totalSupply === currentEdition,
      });
    }
    
    return data;
  }, [config, totalSupply, currentEdition]);

  const currentPrice = useMemo(() => {
    if (currentEdition > 0) {
      return calculatePrice(currentEdition, config);
    }
    return config.basePrice;
  }, [currentEdition, config]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-background border border-border rounded-lg p-3 shadow-lg"
        >
          <p className="text-sm font-semibold">Edition #{payload[0].payload.edition}</p>
          <p className="text-sm text-primary font-bold">
            {payload[0].value.toFixed(4)} SOL
          </p>
        </motion.div>
      );
    }
    return null;
  };

  const handleBezierChange = (newBezierData: BezierCurveData) => {
    setLocalBezierData(newBezierData);
  };

  const handleSaveBezierCurve = () => {
    if (onConfigChange) {
      onConfigChange({
        ...config,
        type: 'bezier',
        bezierCurve: localBezierData,
      });
    }
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    // Reset to original curve data
    if (config.type === 'bezier' && config.bezierCurve) {
      setLocalBezierData(config.bezierCurve);
    }
    setIsEditMode(false);
  };

  return (
    <div className="w-full relative">
      {/* Toggle Button for Bezier Curves */}
      {isBezierCurve && editable && (
        <div className="absolute top-2 right-2 z-10 flex gap-2">
          {!isEditMode ? (
            <motion.button
              onClick={() => setIsEditMode(true)}
              className="px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-lg border border-primary/20 transition-colors flex items-center gap-2 text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Curve</span>
            </motion.button>
          ) : (
            <>
              <motion.button
                onClick={handleSaveBezierCurve}
                className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 rounded-lg border border-green-500/20 transition-colors text-green-500 text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Save
              </motion.button>
              <motion.button
                onClick={handleCancelEdit}
                className="px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors text-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {isEditMode && isBezierCurve ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BezierCurveEditor
              curveData={localBezierData}
              onChange={handleBezierChange}
              className="mb-4"
            />
          </motion.div>
        ) : (
          <motion.div
            key="chart"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full h-[300px] relative"
          >
            <ResponsiveContainer width="100%" height="100%">
              {showArea ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="edition"
                    label={{ value: 'Edition Number', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Price (SOL)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {currentEdition > 0 && (
                    <ReferenceLine
                      x={currentEdition}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="3 3"
                      label={{
                        value: 'Current',
                        position: 'top',
                        fill: 'hsl(var(--primary))',
                        fontSize: 12,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorPrice)"
                    animationDuration={800}
                  />
                </AreaChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="edition"
                    label={{ value: 'Edition Number', position: 'insideBottom', offset: -5 }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{ value: 'Price (SOL)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {currentEdition > 0 && (
                    <ReferenceLine
                      x={currentEdition}
                      stroke="hsl(var(--primary))"
                      strokeDasharray="3 3"
                      label={{
                        value: 'Current',
                        position: 'top',
                        fill: 'hsl(var(--primary))',
                        fontSize: 12,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    animationDuration={800}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

