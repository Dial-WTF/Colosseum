/**
 * User settings entity
 * Stored at: users/[address]/settings.json
 */

import { BaseEntity, getUserPath } from "./base";

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  newListings: boolean;
  priceChanges: boolean;
  outbid: boolean;
  salesActivity: boolean;
  newsletter: boolean;
}

export interface PrivacySettings {
  showCollection: boolean;
  showActivity: boolean;
  showProfile: boolean;
  allowDirectMessages: boolean;
}

export interface DisplaySettings {
  theme: "light" | "dark" | "auto";
  language: string;
  currency: "SOL" | "USD";
  gridSize: "small" | "medium" | "large";
  showPrices: boolean;
}

export class UserSettings extends BaseEntity {
  /**
   * User's wallet address
   */
  address: string = "";

  /**
   * Notification preferences
   */
  notifications: NotificationSettings = {
    email: true,
    push: true,
    newListings: true,
    priceChanges: true,
    outbid: true,
    salesActivity: true,
    newsletter: false,
  };

  /**
   * Privacy settings
   */
  privacy: PrivacySettings = {
    showCollection: true,
    showActivity: true,
    showProfile: true,
    allowDirectMessages: true,
  };

  /**
   * Display preferences
   */
  display: DisplaySettings = {
    theme: "dark",
    language: "en",
    currency: "SOL",
    gridSize: "medium",
    showPrices: true,
  };

  /**
   * Advanced settings (custom key-value pairs)
   */
  advanced: Record<string, any> = {};

  static getBasePath(): string {
    return "users";
  }

  getPath(): string {
    return getUserPath(this.address, "settings.json");
  }

  /**
   * Create settings for a specific address
   */
  static forAddress(address: string): UserSettings {
    const settings = new UserSettings();
    settings.address = address;
    return settings;
  }

  /**
   * Update notification settings
   */
  updateNotifications(updates: Partial<NotificationSettings>): void {
    this.notifications = { ...this.notifications, ...updates };
    this.touch();
  }

  /**
   * Update privacy settings
   */
  updatePrivacy(updates: Partial<PrivacySettings>): void {
    this.privacy = { ...this.privacy, ...updates };
    this.touch();
  }

  /**
   * Update display settings
   */
  updateDisplay(updates: Partial<DisplaySettings>): void {
    this.display = { ...this.display, ...updates };
    this.touch();
  }
}
