import { NextRequest, NextResponse } from 'next/server';
import {
  FeedItem,
  generatePersonalizedFeed,
  getDefaultPreferences,
  UserPreferences,
} from '@/lib/recommendation-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/feed
 * 
 * Returns personalized feed items for a user
 * 
 * Query params:
 * - address: User wallet address (optional)
 * - limit: Number of items to return (default: 20)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Get user preferences (will integrate with Worm later)
    const preferences = await getUserPreferences(address);

    // Get all available listings
    const allItems = await getAllListings();

    // Generate personalized feed
    const feed = generatePersonalizedFeed(allItems, preferences, limit, offset);

    return NextResponse.json({
      items: feed,
      hasMore: offset + limit < allItems.length,
      total: allItems.length,
      offset,
      limit,
    });
  } catch (error) {
    console.error('Error generating feed:', error);
    return NextResponse.json(
      { error: 'Failed to generate feed' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed/track
 * 
 * Track user interaction with feed items
 * 
 * Body:
 * - address: User wallet address
 * - action: 'view' | 'like' | 'purchase' | 'click'
 * - itemMint: Item mint address
 */
export async function POST(request: NextRequest) {
  try {
    const { address, action, itemMint } = await request.json();

    if (!address || !action || !itemMint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Track the interaction (will integrate with Worm UserActivity later)
    await trackInteraction(address, action, itemMint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

/**
 * Get user preferences from storage
 * TODO: Integrate with Worm UserSettings and UserActivity
 */
async function getUserPreferences(address: string | null): Promise<UserPreferences> {
  if (!address) {
    return getDefaultPreferences();
  }

  // For now, return default preferences
  // TODO: Load from Worm storage:
  // - UserSettings for display preferences
  // - UserActivity for recent interactions
  // - UserCollection for owned NFTs and favorites
  
  return getDefaultPreferences();
}

/**
 * Get all available listings
 * TODO: Replace with real Solana/marketplace data
 */
async function getAllListings(): Promise<FeedItem[]> {
  // Mock data for now - will be replaced with real Solana queries
  const collections = ['Dial Tones Vol. 1', 'Retro Ringtones', 'Future Beats', 'Classic Collection'];
  const creators = ['creator1', 'creator2', 'creator3'];
  
  return Array.from({ length: 50 }, (_, i) => {
    const listedHoursAgo = Math.random() * 72;
    const listedAt = new Date(Date.now() - listedHoursAgo * 60 * 60 * 1000);
    
    return {
      id: `item-${i + 1}`,
      mint: `mint${i + 1}`,
      name: `Ringtone ${i + 1}`,
      description: `A unique ringtone NFT with exclusive sound design`,
      image: ['🎵', '📞', '🔮', '👑', '🎸', '🎹', '🎺', '🎻'][i % 8],
      audio: `/audio/ringtone-${i + 1}.mp3`,
      price: parseFloat((0.1 + Math.random() * 2).toFixed(2)),
      lastSale: Math.random() > 0.5 ? parseFloat((0.1 + Math.random()).toFixed(2)) : undefined,
      edition: `${(i % 100) + 1}/100`,
      supply: 100,
      collection: collections[i % collections.length],
      creator: creators[i % creators.length],
      attributes: {
        genre: ['Electronic', 'Retro', 'Classical', 'Modern'][i % 4],
        mood: ['Upbeat', 'Chill', 'Energetic', 'Calm'][i % 4],
        rarity: i % 10 === 0 ? 'Rare' : i % 5 === 0 ? 'Uncommon' : 'Common',
      },
      listedAt: listedAt.toISOString(),
      views: Math.floor(Math.random() * 500),
      favorites: Math.floor(Math.random() * 100),
      sales: Math.floor(Math.random() * 50),
      velocity: parseFloat((Math.random() * 2).toFixed(2)),
    };
  });
}

/**
 * Track user interaction
 * TODO: Integrate with Worm UserActivity
 */
async function trackInteraction(address: string, action: string, itemMint: string): Promise<void> {
  // For now, just log it
  console.log(`📊 Tracked: ${address} ${action} ${itemMint}`);
  
  // TODO: Add to UserActivity entity:
  // - Track views for algorithm
  // - Track likes for favorites
  // - Track purchases for history
  // - Update user preferences based on actions
}

