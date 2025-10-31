/**
 * Base entity class for all Dial.WTF entities
 * Extends S3Worm Entity with common functionality
 */

import { Entity as S3WormEntity } from '@decoperations/s3worm';

export abstract class BaseEntity extends S3WormEntity {
  /**
   * Timestamp when the entity was created
   */
  createdAt: string = new Date().toISOString();

  /**
   * Timestamp when the entity was last updated
   */
  updatedAt: string = new Date().toISOString();

  /**
   * Version number for optimistic locking
   */
  version: number = 1;

  /**
   * Update the entity's updatedAt timestamp and increment version
   */
  touch(): void {
    this.updatedAt = new Date().toISOString();
    this.version += 1;
  }

  /**
   * Get the full S3 path for this entity
   */
  abstract getPath(): string;
}

/**
 * Helper to create entity paths for users
 * Format: users/[address]/[filename]
 */
export function getUserPath(address: string, filename: string): string {
  // Normalize the address (lowercase, remove 0x if present)
  const normalizedAddress = address.toLowerCase().replace(/^0x/, '');
  return `users/${normalizedAddress}/${filename}`;
}

