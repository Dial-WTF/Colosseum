'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { BondingCurveConfig } from '@dial/bonding-curve';
import {
  calculatePrice,
  calculateTotalCost,
  formatLamportsToSOL,
} from '@dial/bonding-curve';
import { TrendingUp, DollarSign, Users, Coins, Target, ArrowUpRight } from 'lucide-react';
import Decimal from 'decimal.js';

interface TokenomicsCalculatorProps {
  config: BondingCurveConfig;
  currentEdition: number;
  totalSupply: number;
}

export function TokenomicsCalculator({
  config,
  currentEdition,
  totalSupply,
}: TokenomicsCalculatorProps) {
  const metrics = useMemo(() => {
    const currentPrice = calculatePrice(Math.max(1, currentEdition + 1), config);
    const firstPrice = calculatePrice(1, config);
    const lastPrice = calculatePrice(totalSupply, config);
    const midPrice = calculatePrice(Math.floor(totalSupply / 2), config);

    // Calculate total revenue if all editions sell
    const totalRevenue = calculateTotalCost(1, totalSupply, config);

    // Calculate average price
    const avgPrice = totalRevenue / totalSupply;

    // Calculate revenue at current stage (already minted)
    const currentRevenue = currentEdition > 0 ? calculateTotalCost(1, currentEdition, config) : 0;

    // Calculate remaining revenue potential
    const remainingRevenue =
      currentEdition < totalSupply
        ? calculateTotalCost(currentEdition + 1, totalSupply - currentEdition, config)
        : 0;

    // Calculate price appreciation from start to end
    const priceAppreciation =
      ((lastPrice - firstPrice) / firstPrice) * 100;

    return {
      currentPrice,
      firstPrice,
      lastPrice,
      midPrice,
      avgPrice,
      totalRevenue,
      currentRevenue,
      remainingRevenue,
      priceAppreciation,
      remainingSupply: totalSupply - currentEdition,
    };
  }, [config, currentEdition, totalSupply]);

  const milestones = useMemo(() => {
    const points = [25, 50, 75, 100];
    return points.map((percent) => {
      const edition = Math.floor((totalSupply * percent) / 100);
      const price = calculatePrice(edition, config);
      const revenue = calculateTotalCost(1, edition, config);
      return {
        percent,
        edition,
        price,
        revenue,
      };
    });
  }, [config, totalSupply]);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color = 'text-primary',
  }: {
    icon: any;
    label: string;
    value: string;
    subValue?: string;
    color?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-secondary rounded-lg p-4 border border-border"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-1">{subValue}</p>}
        </div>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={Target}
            label="Next Mint Price"
            value={`${formatLamportsToSOL(metrics.currentPrice, 4)} SOL`}
            color="text-primary"
          />
          <StatCard
            icon={Coins}
            label="Floor Price"
            value={`${formatLamportsToSOL(metrics.firstPrice, 4)} SOL`}
            color="text-green-500"
          />
          <StatCard
            icon={ArrowUpRight}
            label="Ceiling Price"
            value={`${formatLamportsToSOL(metrics.lastPrice, 4)} SOL`}
            color="text-orange-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg Price"
            value={`${formatLamportsToSOL(metrics.avgPrice, 4)} SOL`}
          />
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`${formatLamportsToSOL(metrics.totalRevenue, 2)} SOL`}
            subValue={`$${(parseFloat(formatLamportsToSOL(metrics.totalRevenue)) * 150).toFixed(0)} @ $150/SOL`}
          />
          <StatCard
            icon={Users}
            label="Supply Remaining"
            value={`${metrics.remainingSupply}`}
            subValue={`${((metrics.remainingSupply / totalSupply) * 100).toFixed(1)}% left`}
          />
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="bg-secondary rounded-lg p-4 border border-border">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Revenue Breakdown
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Already Earned</span>
            <span className="text-sm font-semibold text-green-500">
              {formatLamportsToSOL(metrics.currentRevenue, 2)} SOL
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Remaining Potential</span>
            <span className="text-sm font-semibold text-primary">
              {formatLamportsToSOL(metrics.remainingRevenue, 2)} SOL
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{
                width: `${(metrics.currentRevenue / metrics.totalRevenue) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Target className="h-4 w-4" />
          Price Milestones
        </h3>
        <div className="space-y-2">
          {milestones.map((milestone, idx) => {
            const isPassed = currentEdition >= milestone.edition;
            return (
              <motion.div
                key={milestone.percent}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isPassed
                    ? 'bg-primary/10 border-primary/30'
                    : 'bg-secondary border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                      isPassed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {milestone.percent}%
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Edition #{milestone.edition}</p>
                    <p className="text-xs text-muted-foreground">
                      Total Revenue: {formatLamportsToSOL(milestone.revenue, 2)} SOL
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">
                    {formatLamportsToSOL(milestone.price, 4)} SOL
                  </p>
                  <p className="text-xs text-muted-foreground">mint price</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Price Appreciation */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm font-semibold">Total Price Appreciation</p>
            <p className="text-2xl font-bold text-primary">
              {metrics.priceAppreciation > 1000
                ? `${(metrics.priceAppreciation / 1000).toFixed(1)}K%`
                : `${metrics.priceAppreciation.toFixed(1)}%`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              From {formatLamportsToSOL(metrics.firstPrice, 4)} SOL to{' '}
              {formatLamportsToSOL(metrics.lastPrice, 4)} SOL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

