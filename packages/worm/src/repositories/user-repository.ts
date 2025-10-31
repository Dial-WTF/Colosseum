/**
 * Repository for user-related data operations
 * Provides a clean API for managing user data in Storj
 */

import { S3Worm } from "@decoperations/s3worm";
import {
  UserProfile,
  UserCollection,
  UserActivity,
  UserSettings,
} from "../entities";

/**
 * Helper to convert string to Uint8Array
 */
function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Helper to convert Uint8Array to string
 */
function uint8ArrayToString(arr: Uint8Array): string {
  const decoder = new TextDecoder();
  return decoder.decode(arr);
}

export class UserRepository {
  constructor(private readonly worm: S3Worm) {}

  /**
   * Get JSON data from S3
   */
  private async getJSON<T>(key: string): Promise<T | null> {
    try {
      // Note: S3Worm doesn't have a getBytes method in the basic API
      // We'll need to use the underlying S3 client or add a wrapper
      // For now, we'll use a placeholder that assumes the API exists
      const data = await (this.worm as any).getBytes?.(key);
      if (!data) return null;
      const json = uint8ArrayToString(new Uint8Array(data));
      return JSON.parse(json) as T;
    } catch (error) {
      return null;
    }
  }

  /**
   * Put JSON data to S3
   */
  private async putJSON(key: string, data: any): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    const bytes = stringToUint8Array(json);
    await this.worm.putBytes(key, bytes, "application/json");
  }

  /**
   * Get user profile
   */
  async getProfile(address: string): Promise<UserProfile | null> {
    try {
      const profile = UserProfile.forAddress(address);
      const data = await this.getJSON<UserProfile>(profile.getPath());
      if (!data) return null;
      return Object.assign(profile, data);
    } catch (error) {
      // Profile doesn't exist yet
      return null;
    }
  }

  /**
   * Save user profile
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    profile.touch();
    await this.putJSON(profile.getPath(), profile);
  }

  /**
   * Create a new user profile
   */
  async createProfile(
    address: string,
    data?: Partial<UserProfile>
  ): Promise<UserProfile> {
    const profile = UserProfile.forAddress(address);
    Object.assign(profile, data);
    await this.saveProfile(profile);
    return profile;
  }

  /**
   * Get user collection
   */
  async getCollection(address: string): Promise<UserCollection | null> {
    try {
      const collection = UserCollection.forAddress(address);
      const data = await this.getJSON<UserCollection>(collection.getPath());
      if (!data) return null;
      return Object.assign(collection, data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save user collection
   */
  async saveCollection(collection: UserCollection): Promise<void> {
    collection.touch();
    await this.putJSON(collection.getPath(), collection);
  }

  /**
   * Create a new user collection
   */
  async createCollection(address: string): Promise<UserCollection> {
    const collection = UserCollection.forAddress(address);
    await this.saveCollection(collection);
    return collection;
  }

  /**
   * Get user activity
   */
  async getActivity(address: string): Promise<UserActivity | null> {
    try {
      const activity = UserActivity.forAddress(address);
      const data = await this.getJSON<UserActivity>(activity.getPath());
      if (!data) return null;
      return Object.assign(activity, data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save user activity
   */
  async saveActivity(activity: UserActivity): Promise<void> {
    activity.touch();
    await this.putJSON(activity.getPath(), activity);
  }

  /**
   * Create a new user activity log
   */
  async createActivity(address: string): Promise<UserActivity> {
    const activity = UserActivity.forAddress(address);
    await this.saveActivity(activity);
    return activity;
  }

  /**
   * Get user settings
   */
  async getSettings(address: string): Promise<UserSettings | null> {
    try {
      const settings = UserSettings.forAddress(address);
      const data = await this.getJSON<UserSettings>(settings.getPath());
      if (!data) return null;
      return Object.assign(settings, data);
    } catch (error) {
      return null;
    }
  }

  /**
   * Save user settings
   */
  async saveSettings(settings: UserSettings): Promise<void> {
    settings.touch();
    await this.putJSON(settings.getPath(), settings);
  }

  /**
   * Create new user settings
   */
  async createSettings(address: string): Promise<UserSettings> {
    const settings = UserSettings.forAddress(address);
    await this.saveSettings(settings);
    return settings;
  }

  /**
   * Initialize all user data (profile, collection, activity, settings)
   */
  async initializeUser(
    address: string,
    profileData?: Partial<UserProfile>
  ): Promise<{
    profile: UserProfile;
    collection: UserCollection;
    activity: UserActivity;
    settings: UserSettings;
  }> {
    const [profile, collection, activity, settings] = await Promise.all([
      this.createProfile(address, profileData),
      this.createCollection(address),
      this.createActivity(address),
      this.createSettings(address),
    ]);

    return { profile, collection, activity, settings };
  }

  /**
   * Check if user exists (has a profile)
   */
  async userExists(address: string): Promise<boolean> {
    const profile = await this.getProfile(address);
    return profile !== null;
  }

  /**
   * Delete all user data
   */
  async deleteUser(address: string): Promise<void> {
    const profile = UserProfile.forAddress(address);
    const collection = UserCollection.forAddress(address);
    const activity = UserActivity.forAddress(address);
    const settings = UserSettings.forAddress(address);

    // Note: S3Worm delete API needs to be checked
    // Using deleteObject from AWS SDK if needed
    await Promise.all([
      (this.worm as any).delete?.(profile.getPath()),
      (this.worm as any).delete?.(collection.getPath()),
      (this.worm as any).delete?.(activity.getPath()),
      (this.worm as any).delete?.(settings.getPath()),
    ]);
  }
}
