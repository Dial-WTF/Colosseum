'use client';

import { useState } from 'react';

export function MarketplaceFilters() {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Status</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Buy Now</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" className="rounded" />
            <span className="text-sm">On Auction</span>
          </label>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-3">Price Range (SOL)</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
              value={priceRange[0]}
              onChange={(e) => setPriceRange([parseFloat(e.target.value), priceRange[1]])}
            />
            <span className="text-muted-foreground">to</span>
            <input
              type="number"
              placeholder="Max"
              className="w-full bg-secondary border border-border rounded px-3 py-2 text-sm"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], parseFloat(e.target.value)])}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="font-semibold mb-3">Collections</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Dial Tones Vol. 1</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Retro Ringtones</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Future Beats</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded" />
            <span className="text-sm">Classic Collection</span>
          </label>
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <button className="w-full px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-lg text-sm font-medium transition-colors">
          Reset Filters
        </button>
      </div>
    </div>
  );
}

