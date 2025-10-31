'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { FeedCard } from './feed-card';
import { ScoredFeedItem } from '@/lib/recommendation-service';
import { Loader2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InfiniteFeedProps {
  userAddress?: string;
  initialItems?: ScoredFeedItem[];
}

export function InfiniteFeed({ userAddress, initialItems = [] }: InfiniteFeedProps) {
  const [items, setItems] = useState<ScoredFeedItem[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Intersection observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load more items
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: offset.toString(),
      });

      if (userAddress) {
        params.set('address', userAddress);
      }

      const response = await fetch(`/api/feed?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load feed items');
      }

      const data = await response.json();

      setItems((prev) => [...prev, ...data.items]);
      setHasMore(data.hasMore);
      setOffset((prev) => prev + data.items.length);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Failed to load more items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, userAddress]);

  // Set up intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.5 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMore]);

  // Track item view
  const handleView = useCallback(async (itemMint: string) => {
    if (!userAddress) return;

    try {
      await fetch('/api/feed/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          action: 'view',
          itemMint,
        }),
      });
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  }, [userAddress]);

  // Handle like
  const handleLike = useCallback(async (itemMint: string) => {
    if (!userAddress) return;

    // Optimistic update
    setItems((prev) =>
      prev.map((item) =>
        item.mint === itemMint
          ? { ...item, favorites: item.favorites + 1 }
          : item
      )
    );

    try {
      await fetch('/api/feed/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: userAddress,
          action: 'like',
          itemMint,
        }),
      });
    } catch (err) {
      console.error('Error tracking like:', err);
      // Revert optimistic update
      setItems((prev) =>
        prev.map((item) =>
          item.mint === itemMint
            ? { ...item, favorites: item.favorites - 1 }
            : item
        )
      );
    }
  }, [userAddress]);

  // Handle buy - opens Tensor.trade
  const handleBuy = useCallback(async (itemMint: string) => {
    try {
      // Track purchase intent (Tensor redirect)
      if (userAddress) {
        await fetch('/api/feed/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address: userAddress,
            action: 'purchase',
            itemMint,
          }),
        });
      }

      // Note: The actual Tensor.trade redirect happens in FeedCard
      // This just tracks the analytics
    } catch (err) {
      console.error('Error tracking purchase intent:', err);
    }
  }, [userAddress]);

  // Refresh feed
  const handleRefresh = useCallback(async () => {
    setItems([]);
    setOffset(0);
    setHasMore(true);
    await loadMore();
  }, [loadMore]);

  // Load initial items if not provided
  useEffect(() => {
    if (initialItems.length === 0) {
      loadMore();
    }
  }, []);

  return (
    <div className="w-full">
      {/* Refresh Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">For You</h2>
          <p className="text-sm text-muted-foreground">
            Personalized recommendations based on your taste
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className={cn(
            'p-2 rounded-full bg-secondary hover:bg-secondary/70',
            'transition-colors duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <RefreshCw className={cn('w-5 h-5', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* Feed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <FeedCard
            key={item.id}
            item={item}
            onView={handleView}
            onLike={handleLike}
            onBuy={handleBuy}
          />
        ))}
      </div>

      {/* Loading State */}
      {isLoading && items.length > 0 && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h3 className="text-xl font-semibold mb-2">No items yet</h3>
          <p className="text-muted-foreground max-w-md">
            Start exploring the marketplace to get personalized recommendations
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={loadMore}
            className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* End of Feed */}
      {!hasMore && items.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">
            You've reached the end! Check back later for more.
          </p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-lg font-medium transition-colors"
          >
            Refresh Feed
          </button>
        </div>
      )}

      {/* Intersection Observer Target */}
      <div ref={observerTarget} className="h-4" />
    </div>
  );
}

