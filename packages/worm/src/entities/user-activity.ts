/**
 * User activity log entity
 * Stored at: users/[address]/activity.json
 */

import { BaseEntity, getUserPath } from './base';

export type ActivityType =
  | 'mint'
  | 'purchase'
  | 'sale'
  | 'transfer'
  | 'list'
  | 'delist'
  | 'bid'
  | 'offer'
  | 'profile_update'
  | 'collection_update';

export interface ActivityEvent {
  /**
   * Unique event ID
   */
  id: string;

  /**
   * Type of activity
   */
  type: ActivityType;

  /**
   * Timestamp of the event
   */
  timestamp: string;

  /**
   * Associated NFT mint address (if applicable)
   */
  mint?: string;

  /**
   * Transaction signature on Solana
   */
  signature?: string;

  /**
   * Amount involved (in SOL)
   */
  amount?: number;

  /**
   * Other party involved (buyer, seller, recipient)
   */
  otherParty?: string;

  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;

  /**
   * Description of the activity
   */
  description?: string;
}

export class UserActivity extends BaseEntity {
  /**
   * User's wallet address
   */
  address: string = '';

  /**
   * Array of activity events (most recent first)
   */
  events: ActivityEvent[] = [];

  /**
   * Total number of activities
   */
  totalCount: number = 0;

  /**
   * Last activity timestamp
   */
  lastActivityAt?: string;

  static getBasePath(): string {
    return 'users';
  }

  getPath(): string {
    return getUserPath(this.address, 'activity.json');
  }

  /**
   * Create an activity log for a specific address
   */
  static forAddress(address: string): UserActivity {
    const activity = new UserActivity();
    activity.address = address;
    return activity;
  }

  /**
   * Add a new activity event
   */
  addEvent(event: Omit<ActivityEvent, 'id' | 'timestamp'>): void {
    // Use node:crypto if available, otherwise fall back to a simple ID generator
    let id: string;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      // Fallback: timestamp + random number
      id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    const newEvent: ActivityEvent = {
      ...event,
      id,
      timestamp: new Date().toISOString(),
    };

    // Insert at the beginning (most recent first)
    this.events.unshift(newEvent);
    this.totalCount = this.events.length;
    this.lastActivityAt = newEvent.timestamp;
    this.touch();
  }

  /**
   * Get recent activities (last N events)
   */
  getRecentActivities(limit: number = 10): ActivityEvent[] {
    return this.events.slice(0, limit);
  }

  /**
   * Get activities by type
   */
  getActivitiesByType(type: ActivityType): ActivityEvent[] {
    return this.events.filter((event) => event.type === type);
  }

  /**
   * Get activities for a specific NFT
   */
  getActivitiesForNFT(mint: string): ActivityEvent[] {
    return this.events.filter((event) => event.mint === mint);
  }
}

