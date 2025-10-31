/**
 * 🎯 Personalized Recommendation Algorithm
 * 
 * Scores and ranks NFT listings based on:
 * - User purchase history and preferences
 * - Similarity to owned/favorited items
 * - Trending items and velocity
 * - Price range preferences
 * - Collection preferences
 * - Recent activity patterns
 */

import { NFTItem } from '@dial/worm';

export interface FeedItem {
  id: string;
  mint: string;
  name: string;
  description?: string;
  image?: string;
  audio?: string;
  price: number;
  lastSale?: number;
  edition?: string;
  supply?: number;
  collection?: string;
  creator?: string;
  attributes?: Record<string, any>;
  listedAt: string;
  views: number;
  favorites: number;
  sales: number;
  velocity: number; // Sales per hour
}

export interface UserPreferences {
  favoriteCollections: string[];
  priceRange: { min: number; max: number };
  favoriteCreators: string[];
  ownedNFTs: NFTItem[];
  recentActivity: {
    views: string[]; // mint addresses
    purchases: string[];
    favorites: string[];
  };
}

export interface ScoredFeedItem extends FeedItem {
  score: number;
  reason: string; // Why this was recommended
}

/**
 * Calculate recommendation score for an item (0-100)
 */
export function calculateRecommendationScore(
  item: FeedItem,
  preferences: UserPreferences
): ScoredFeedItem {
  let score = 0;
  const reasons: string[] = [];

  // 1. Collection Match (0-25 points)
  if (item.collection && preferences.favoriteCollections.includes(item.collection)) {
    score += 25;
    reasons.push('From a collection you love');
  }

  // 2. Creator Match (0-20 points)
  if (item.creator && preferences.favoriteCreators.includes(item.creator)) {
    score += 20;
    reasons.push('From a creator you follow');
  }

  // 3. Price Preference (0-15 points)
  const priceScore = calculatePriceScore(item.price, preferences.priceRange);
  score += priceScore;
  if (priceScore > 10) {
    reasons.push('In your price range');
  }

  // 4. Trending Score (0-20 points)
  const trendingScore = calculateTrendingScore(item);
  score += trendingScore;
  if (trendingScore > 15) {
    reasons.push('🔥 Trending now');
  }

  // 5. Similarity Score (0-15 points)
  const similarityScore = calculateSimilarityScore(item, preferences.ownedNFTs);
  score += similarityScore;
  if (similarityScore > 10) {
    reasons.push('Similar to items you own');
  }

  // 6. Freshness Score (0-10 points)
  const freshnessScore = calculateFreshnessScore(item.listedAt);
  score += freshnessScore;
  if (freshnessScore > 8) {
    reasons.push('✨ Just listed');
  }

  // 7. Social Proof (0-10 points)
  const socialScore = calculateSocialScore(item);
  score += socialScore;
  if (socialScore > 7) {
    reasons.push('Popular item');
  }

  // 8. Novelty Bonus (0-5 points)
  // Give slight boost to items user hasn't seen
  const isNovel = !preferences.recentActivity.views.includes(item.mint);
  if (isNovel) {
    score += 5;
  }

  // Ensure score is between 0-100
  score = Math.min(100, Math.max(0, score));

  return {
    ...item,
    score,
    reason: reasons.length > 0 ? reasons[0] : 'Recommended for you',
  };
}

/**
 * Score based on price preference (0-15)
 */
function calculatePriceScore(price: number, priceRange: { min: number; max: number }): number {
  if (price < priceRange.min || price > priceRange.max) {
    // Outside preferred range - penalize but don't eliminate
    return 0;
  }

  // Perfect score if in middle of range
  const rangeMid = (priceRange.min + priceRange.max) / 2;
  const rangeSize = priceRange.max - priceRange.min;
  const distanceFromMid = Math.abs(price - rangeMid);
  const normalizedDistance = distanceFromMid / (rangeSize / 2);

  return Math.round(15 * (1 - normalizedDistance));
}

/**
 * Score based on trending metrics (0-20)
 */
function calculateTrendingScore(item: FeedItem): number {
  let score = 0;

  // Velocity (sales per hour) - max 10 points
  const velocityScore = Math.min(10, item.velocity * 2);
  score += velocityScore;

  // Recent views - max 5 points
  const viewScore = Math.min(5, item.views / 20);
  score += viewScore;

  // Recent favorites - max 5 points
  const favoriteScore = Math.min(5, item.favorites / 10);
  score += favoriteScore;

  return Math.round(score);
}

/**
 * Score based on similarity to owned items (0-15)
 */
function calculateSimilarityScore(item: FeedItem, ownedNFTs: NFTItem[]): number {
  if (ownedNFTs.length === 0) return 0;

  let maxSimilarity = 0;

  for (const ownedNFT of ownedNFTs) {
    let similarity = 0;

    // Same collection - high similarity
    if (item.collection && ownedNFT.attributes?.collection === item.collection) {
      similarity += 10;
    }

    // Similar attributes
    if (item.attributes && ownedNFT.attributes) {
      const matchingAttributes = Object.keys(item.attributes).filter(
        key => ownedNFT.attributes?.[key] === item.attributes?.[key]
      );
      similarity += matchingAttributes.length;
    }

    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  return Math.min(15, maxSimilarity);
}

/**
 * Score based on listing freshness (0-10)
 */
function calculateFreshnessScore(listedAt: string): number {
  const now = new Date().getTime();
  const listed = new Date(listedAt).getTime();
  const ageHours = (now - listed) / (1000 * 60 * 60);

  if (ageHours < 1) return 10; // Less than 1 hour
  if (ageHours < 6) return 8;  // Less than 6 hours
  if (ageHours < 24) return 5; // Less than 1 day
  if (ageHours < 72) return 2; // Less than 3 days
  return 0;
}

/**
 * Score based on social proof (0-10)
 */
function calculateSocialScore(item: FeedItem): number {
  let score = 0;

  // Favorites (max 5 points)
  score += Math.min(5, item.favorites / 20);

  // Sales history (max 5 points)
  score += Math.min(5, item.sales / 10);

  return Math.round(score);
}

/**
 * Rank and filter items for personalized feed
 */
export function generatePersonalizedFeed(
  items: FeedItem[],
  preferences: UserPreferences,
  limit: number = 20,
  offset: number = 0
): ScoredFeedItem[] {
  // Score all items
  const scoredItems = items.map(item => 
    calculateRecommendationScore(item, preferences)
  );

  // Sort by score (highest first)
  scoredItems.sort((a, b) => b.score - a.score);

  // Add some randomization to top items to avoid staleness
  // (Fisher-Yates shuffle for top 10%)
  const topCount = Math.ceil(scoredItems.length * 0.1);
  const topItems = scoredItems.slice(0, topCount);
  const restItems = scoredItems.slice(topCount);

  for (let i = topItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [topItems[i], topItems[j]] = [topItems[j], topItems[i]];
  }

  const shuffledItems = [...topItems, ...restItems];

  // Apply pagination
  return shuffledItems.slice(offset, offset + limit);
}

/**
 * Generate default preferences for new users
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    favoriteCollections: [],
    priceRange: { min: 0, max: 10 },
    favoriteCreators: [],
    ownedNFTs: [],
    recentActivity: {
      views: [],
      purchases: [],
      favorites: [],
    },
  };
}

/**
 * Update preferences based on user action
 */
export function updatePreferencesFromAction(
  preferences: UserPreferences,
  action: {
    type: 'view' | 'purchase' | 'favorite' | 'collection_follow' | 'creator_follow';
    itemMint?: string;
    collection?: string;
    creator?: string;
  }
): UserPreferences {
  const updated = { ...preferences };

  switch (action.type) {
    case 'view':
      if (action.itemMint) {
        updated.recentActivity.views = [
          action.itemMint,
          ...updated.recentActivity.views.slice(0, 99), // Keep last 100
        ];
      }
      break;

    case 'purchase':
      if (action.itemMint) {
        updated.recentActivity.purchases = [
          action.itemMint,
          ...updated.recentActivity.purchases.slice(0, 49),
        ];
      }
      break;

    case 'favorite':
      if (action.itemMint) {
        updated.recentActivity.favorites = [
          action.itemMint,
          ...updated.recentActivity.favorites.slice(0, 49),
        ];
      }
      break;

    case 'collection_follow':
      if (action.collection && !updated.favoriteCollections.includes(action.collection)) {
        updated.favoriteCollections.push(action.collection);
      }
      break;

    case 'creator_follow':
      if (action.creator && !updated.favoriteCreators.includes(action.creator)) {
        updated.favoriteCreators.push(action.creator);
      }
      break;
  }

  return updated;
}

