/**
 * User profile entity
 * Stored at: users/[address]/profile.json
 */

import { BaseEntity, getUserPath } from './base';

export interface SocialLinks {
  twitter?: string;
  discord?: string;
  telegram?: string;
  website?: string;
}

export class UserProfile extends BaseEntity {
  /**
   * User's wallet address (used as unique identifier)
   */
  address: string = '';

  /**
   * Display name chosen by the user
   */
  displayName?: string;

  /**
   * User's bio/description
   */
  bio?: string;

  /**
   * Avatar image URL (could be IPFS or uploaded to Storj)
   */
  avatarUrl?: string;

  /**
   * Banner/cover image URL
   */
  bannerUrl?: string;

  /**
   * Social media links
   */
  socialLinks?: SocialLinks;

  /**
   * Email address (optional, for notifications)
   */
  email?: string;

  /**
   * Whether the user has verified their email
   */
  emailVerified: boolean = false;

  /**
   * User's preferences (theme, notifications, etc.)
   */
  preferences: Record<string, any> = {};

  static getBasePath(): string {
    return 'users';
  }

  getPath(): string {
    return getUserPath(this.address, 'profile.json');
  }

  /**
   * Create a user profile for a specific address
   */
  static forAddress(address: string): UserProfile {
    const profile = new UserProfile();
    profile.address = address;
    return profile;
  }
}

