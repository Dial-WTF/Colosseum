'use client';

import { useState } from 'react';
import { Heart, ShoppingCart, Share2, Play, Pause, TrendingUp, Sparkles, ExternalLink } from 'lucide-react';
import { ScoredFeedItem } from '@/lib/recommendation-service';
import { cn } from '@/lib/utils';
import { openTensorItem, getTensorItemUrl } from '@/lib/tensor-utils';

interface FeedCardProps {
  item: ScoredFeedItem;
  onLike?: (itemMint: string) => void;
  onBuy?: (itemMint: string) => void;
  onView?: (itemMint: string) => void;
}

export function FeedCard({ item, onLike, onBuy, onView }: FeedCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(item.mint);
  };

  const handleBuy = () => {
    // Open Tensor.trade for this NFT
    openTensorItem(item.mint);
    onBuy?.(item.mint);
  };

  const handleViewOnTensor = (e: React.MouseEvent) => {
    e.stopPropagation();
    openTensorItem(item.mint);
  };

  const handleShare = async () => {
    const tensorUrl = getTensorItemUrl(item.mint);
    if (navigator.share) {
      await navigator.share({
        title: item.name,
        text: item.description,
        url: tensorUrl,
      });
    } else {
      // Fallback: Copy Tensor link to clipboard
      await navigator.clipboard.writeText(tensorUrl);
      // TODO: Show toast notification
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Integrate with audio player
  };

  const priceChange = item.lastSale
    ? ((item.price - item.lastSale) / item.lastSale) * 100
    : null;

  return (
    <div
      className={cn(
        'group relative bg-card rounded-2xl overflow-hidden',
        'border border-border hover:border-primary/50',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:shadow-primary/20',
        'cursor-pointer'
      )}
      onMouseEnter={() => {
        setShowActions(true);
        onView?.(item.mint);
      }}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Score Badge */}
      {item.score > 80 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-primary/90 to-purple-500/90 backdrop-blur-sm rounded-full text-xs font-semibold">
          <Sparkles className="w-3 h-3" />
          Hot Pick
        </div>
      )}

      {/* Trending Badge */}
      {item.velocity > 1 && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full text-xs font-semibold">
          <TrendingUp className="w-3 h-3" />
          Trending
        </div>
      )}

      {/* Image/Preview */}
      <div className="relative aspect-square bg-muted">
        <div className="w-full h-full flex items-center justify-center text-8xl">
          {item.image}
        </div>

        {/* Play Button Overlay (for audio NFTs) */}
        {item.audio && (
          <button
            onClick={handlePlayPause}
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'bg-black/40 backdrop-blur-sm',
              'transition-opacity duration-200',
              showActions ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
              {isPlaying ? (
                <Pause className="w-8 h-8 text-black" />
              ) : (
                <Play className="w-8 h-8 text-black ml-1" />
              )}
            </div>
          </button>
        )}

        {/* Quick Actions Overlay */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 p-4',
            'bg-gradient-to-t from-black/80 to-transparent',
            'flex items-center justify-between gap-2',
            'transition-all duration-300',
            showActions ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          )}
        >
          <button
            onClick={handleLike}
            className={cn(
              'p-2 rounded-full backdrop-blur-sm transition-all duration-200',
              isLiked
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white/10 hover:bg-white/20 text-white'
            )}
          >
            <Heart className={cn('w-5 h-5', isLiked && 'fill-current')} />
          </button>

          <button
            onClick={handleBuy}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 rounded-full font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span>Trade</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Recommendation Reason */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {item.reason}
        </div>

        {/* Title & Collection */}
        <div>
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {item.collection}
          </p>
        </div>

        {/* Edition & Attributes */}
        {item.edition && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Edition {item.edition}</span>
            {item.attributes?.rarity && (
              <>
                <span>•</span>
                <span className={cn(
                  'font-semibold',
                  item.attributes.rarity === 'Rare' && 'text-purple-400',
                  item.attributes.rarity === 'Uncommon' && 'text-blue-400'
                )}>
                  {item.attributes.rarity}
                </span>
              </>
            )}
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-end justify-between pt-3 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Price</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-primary">
                {item.price} <span className="text-base">SOL</span>
              </p>
              {priceChange !== null && (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    priceChange > 0 ? 'text-green-400' : 'text-red-400'
                  )}
                >
                  {priceChange > 0 ? '+' : ''}
                  {priceChange.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Social Proof */}
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart className="w-3 h-3" />
              <span>{item.favorites}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {item.sales} sales
            </div>
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 pt-2">
            {item.description}
          </p>
        )}

        {/* Tensor.trade Link */}
        <button
          onClick={handleViewOnTensor}
          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-lg text-sm font-medium transition-colors group"
        >
          <span className="text-muted-foreground group-hover:text-foreground transition-colors">
            View on Tensor
          </span>
          <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </div>
  );
}

