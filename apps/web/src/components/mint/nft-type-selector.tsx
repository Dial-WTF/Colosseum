'use client';

import { Check, Info } from 'lucide-react';
import { cn } from '#/lib/utils';

type NFTType = 'master-edition' | 'sft' | 'cnft';

interface NFTTypeSelectorProps {
  selectedType: NFTType;
  onTypeChange: (type: NFTType) => void;
}

export function NFTTypeSelector({ selectedType, onTypeChange }: NFTTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">NFT Type</label>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Select your NFT standard</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Master Edition - Default & Available */}
        <button
          onClick={() => onTypeChange('master-edition')}
          className={cn(
            'p-4 rounded-lg border-2 transition-all text-left',
            selectedType === 'master-edition'
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">Master Edition</h3>
            {selectedType === 'master-edition' && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Limited edition NFTs with numbered prints (1/100, 2/100, etc.)
          </p>
          <span className="inline-block px-2 py-1 text-xs bg-primary/20 text-primary rounded">
            Recommended
          </span>
        </button>

        {/* Semi-Fungible Token - Coming Soon */}
        <button
          disabled
          className="p-4 rounded-lg border-2 border-border opacity-50 cursor-not-allowed text-left"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">Semi-Fungible (SFT)</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Fungible tokens with metadata - true 1155-style
          </p>
          <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
            Coming Soon
          </span>
        </button>

        {/* Compressed NFT - Coming Soon */}
        <button
          disabled
          className="p-4 rounded-lg border-2 border-border opacity-50 cursor-not-allowed text-left"
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold">Compressed (cNFT)</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Ultra-low cost NFTs using Merkle trees
          </p>
          <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
            Coming Soon
          </span>
        </button>
      </div>

      {/* Info box for selected type */}
      {selectedType === 'master-edition' && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">✨ Master Edition Features:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• Each NFT is uniquely numbered (Edition #1, #2, etc.)</li>
            <li>• Full marketplace support (Magic Eden, Tensor, etc.)</li>
            <li>• Built-in royalty enforcement</li>
            <li>• Bonding curve pricing for fair distribution</li>
          </ul>
        </div>
      )}
    </div>
  );
}

