/**
 * @dial/worm - S3WORM data storage for Dial.WTF
 * 
 * Provides entity definitions and repositories for managing user data
 * in Storj-based S3 storage, organized by wallet address.
 * 
 * @example
 * ```typescript
 * import { getWormClient, UserRepository } from '@dial/worm';
 * 
 * const worm = getWormClient();
 * const userRepo = new UserRepository(worm);
 * 
 * // Initialize a new user
 * const userData = await userRepo.initializeUser('0xabc123...', {
 *   displayName: 'Alice',
 *   bio: 'NFT collector',
 * });
 * 
 * // Get user profile
 * const profile = await userRepo.getProfile('0xabc123...');
 * 
 * // Update profile
 * if (profile) {
 *   profile.bio = 'Updated bio';
 *   await userRepo.saveProfile(profile);
 * }
 * ```
 */

// Client exports
export {
  createWormClient,
  getWormClient,
  resetWormClient,
  getStorjConfig,
  type StorjConfig,
} from './client';

// Entity exports
export * from './entities';

// Repository exports
export * from './repositories';

// Re-export S3Worm types for convenience
export type { S3Worm } from '@decoperations/s3worm';

