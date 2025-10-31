/**
 * S3Worm client configuration for Dial.WTF
 * Uses Storj for decentralized storage
 */

import { S3Worm } from '@decoperations/s3worm';

export interface StorjConfig {
  endpoint: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * Get Storj configuration from environment variables
 */
export function getStorjConfig(): StorjConfig {
  const endpoint = process.env.NEXT_PUBLIC_STORJ_ENDPOINT || process.env.STORJ_ENDPOINT;
  const bucket = process.env.NEXT_PUBLIC_STORJ_BUCKET || process.env.STORJ_BUCKET;
  const accessKeyId = process.env.NEXT_PUBLIC_STORJ_ACCESS_KEY || process.env.STORJ_ACCESS_KEY;
  const secretAccessKey = process.env.NEXT_PUBLIC_STORJ_SECRET_KEY || process.env.STORJ_SECRET_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing Storj configuration. Please set STORJ_ENDPOINT, STORJ_BUCKET, STORJ_ACCESS_KEY, and STORJ_SECRET_KEY in your environment.'
    );
  }

  return {
    endpoint,
    bucket,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  };
}

/**
 * Create and configure the S3Worm client for Dial.WTF
 * Organized by user address: /users/[address]/
 */
export function createWormClient(config?: StorjConfig): S3Worm {
  const storjConfig = config || getStorjConfig();

  return new S3Worm({
    endpoint: storjConfig.endpoint,
    bucket: storjConfig.bucket,
    credentials: storjConfig.credentials,
  });
}

/**
 * Singleton instance of the S3Worm client
 */
let wormClient: S3Worm | null = null;

/**
 * Get the singleton S3Worm client instance
 */
export function getWormClient(): S3Worm {
  if (!wormClient) {
    wormClient = createWormClient();
  }
  return wormClient;
}

/**
 * Reset the singleton client (useful for testing)
 */
export function resetWormClient(): void {
  wormClient = null;
}

/**
 * Generate a public URL for a file stored in Storj
 * @param filename The file path within the bucket (e.g., "users/0x123.../avatar.png")
 * @returns The public URL to access the file
 */
export function getPublicUrl(filename: string): string {
  const baseUrl = process.env.STORJ_PUBLIC_URL || process.env.NEXT_PUBLIC_STORJ_PUBLIC_URL;
  
  if (!baseUrl) {
    console.warn('STORJ_PUBLIC_URL not set. Files may not be publicly accessible.');
    return filename;
  }
  
  // Remove leading slash if present
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  
  // Ensure base URL doesn't end with slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${cleanBaseUrl}/${cleanFilename}`;
}

