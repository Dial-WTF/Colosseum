'use client';

import { useMemo } from 'react';
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
import type { BondingCurveConfig } from '@dial/bonding-curve';
import { calculatePrice, formatLamportsToSOL } from '@dial/bonding-curve';
import { motion } from 'framer-motion';

interface BondingCurveChartProps {
  config: BondingCurveConfig;
  currentEdition?: number;
  totalSupply: number;
  showArea?: boolean;
}

export function BondingCurveChart({
  config,
  currentEdition = 0,
  totalSupply = 100,
  showArea = true,
}: BondingCurveChartProps) {
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

  return (
    <div className="w-full h-[300px] relative">
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
    </div>
  );
}

