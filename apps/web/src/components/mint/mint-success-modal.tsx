'use client';

import { CheckCircle2, ExternalLink, Share2, Copy, Twitter } from 'lucide-react';
import { useState } from 'react';
import { getTensorItemUrl, openTensorItem, getTensorShareUrl } from '@/lib/tensor-utils';

interface MintSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  nftData: {
    mintAddress: string;
    name: string;
    imageUrl?: string;
    price?: number;
    supply?: number;
  };
}

export function MintSuccessModal({ isOpen, onClose, nftData }: MintSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tensorUrl = getTensorItemUrl(nftData.mintAddress);
  const shareUrl = getTensorShareUrl(nftData.mintAddress);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(tensorUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = `Just minted "${nftData.name}" on @DialWTF! 🎵\n\nTrade it on @tensor`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  };

  const handleTradeNow = () => {
    openTensorItem(nftData.mintAddress);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-2">
          NFT Minted Successfully! 🎉
        </h2>
        <p className="text-center text-muted-foreground mb-6">
          Your audio NFT is now live on Solana
        </p>

        {/* NFT Preview */}
        <div className="bg-secondary rounded-lg p-4 mb-6">
          <div className="flex items-start gap-4">
            {nftData.imageUrl && (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center text-4xl flex-shrink-0">
                {nftData.imageUrl.startsWith('http') ? (
                  <img
                    src={nftData.imageUrl}
                    alt={nftData.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  nftData.imageUrl
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1 truncate">{nftData.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Mint: {nftData.mintAddress.slice(0, 8)}...{nftData.mintAddress.slice(-8)}
              </p>
              {nftData.price && (
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Price: </span>
                    <span className="font-semibold text-primary">{nftData.price} SOL</span>
                  </div>
                  {nftData.supply && (
                    <div>
                      <span className="text-muted-foreground">Supply: </span>
                      <span className="font-semibold">{nftData.supply}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trade on Tensor CTA */}
        <button
          onClick={handleTradeNow}
          className="w-full mb-3 px-6 py-4 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 rounded-xl font-bold text-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-3 shadow-lg shadow-primary/30"
        >
          <span>Trade on Tensor</span>
          <ExternalLink className="w-5 h-5" />
        </button>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            onClick={handleCopyLink}
            className="px-4 py-3 bg-secondary hover:bg-secondary/70 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-green-500">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </>
            )}
          </button>
          <button
            onClick={handleShareTwitter}
            className="px-4 py-3 bg-secondary hover:bg-secondary/70 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Twitter className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>

        {/* Tensor Info */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-1">Trade on Tensor.trade</h4>
              <p className="text-sm text-muted-foreground">
                List your NFT for sale, set prices, and trade with the Solana community on
                the leading NFT marketplace.
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-3 bg-secondary hover:bg-secondary/70 rounded-lg font-medium transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

