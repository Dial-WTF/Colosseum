/**
 * S3Worm client configuration for Dial.WTF
 * Uses Storj for decentralized storage
 */

import { S3Worm } from '@decoperations/s3worm';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

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
 * Returns null if configuration is missing (for development without Storj)
 */
export function getStorjConfig(): StorjConfig | null {
  const endpoint = process.env.NEXT_PUBLIC_STORJ_ENDPOINT || process.env.STORJ_ENDPOINT;
  const bucket = process.env.NEXT_PUBLIC_STORJ_BUCKET || process.env.STORJ_BUCKET;
  const accessKeyId = process.env.NEXT_PUBLIC_STORJ_ACCESS_KEY || process.env.STORJ_ACCESS_KEY;
  const secretAccessKey = process.env.NEXT_PUBLIC_STORJ_SECRET_KEY || process.env.STORJ_SECRET_KEY;

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    console.warn('⚠️ Storj configuration not found. Storage features will be disabled.');
    return null;
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
 * Returns null if Storj is not configured
 */
export function createWormClient(config?: StorjConfig): S3Worm | null {
  const storjConfig = config || getStorjConfig();
  
  if (!storjConfig) {
    return null;
  }

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
let wormClientInitialized = false;

/**
 * Get the singleton S3Worm client instance
 * Returns null if Storj is not configured
 */
export function getWormClient(): S3Worm | null {
  if (!wormClientInitialized) {
    wormClient = createWormClient();
    wormClientInitialized = true;
  }
  return wormClient;
}

/**
 * Reset the singleton client (useful for testing)
 */
export function resetWormClient(): void {
  wormClient = null;
  wormClientInitialized = false;
}

/**
 * Generate a signed URL for a file stored in Storj
 * This creates a temporary URL that allows public access without exposing credentials
 * @param filename The file path within the bucket (e.g., "users/0x123.../avatar.png")
 * @param expiresIn Time in seconds until the URL expires (default: 1 hour)
 * @returns Promise resolving to the signed URL or empty string if Storj is not configured
 */
export async function getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
  try {
    const config = getStorjConfig();
    
    if (!config) {
      console.warn('⚠️ Cannot generate signed URL: Storj not configured');
      return '';
    }
    
    // Create a dedicated S3 client for signed URLs
    const s3Client = new S3Client({
      endpoint: config.endpoint,
      region: 'us-east-1', // Storj uses us-east-1 as default
      credentials: {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
      },
      forcePathStyle: true, // Required for Storj
    });
    
    // Remove leading slash if present
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    
    // Create the GetObject command
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: cleanFilename,
    });

    // Generate the signed URL
    const signedUrl = await awsGetSignedUrl(s3Client, command, { expiresIn });
    
    console.log('✅ Generated signed URL:', {
      filename: cleanFilename,
      expiresIn: `${expiresIn}s`,
      urlLength: signedUrl.length,
    });
    
    return signedUrl;
  } catch (error) {
    console.error('❌ Error generating signed URL:', error);
    throw error;
  }
}

/**
 * Generate a public URL for a file stored in Storj (legacy method)
 * @deprecated Use getSignedUrl instead for better security
 * @param filename The file path within the bucket (e.g., "users/0x123.../avatar.png")
 * @returns The public URL to access the file
 */
export function getPublicUrl(filename: string): string {
  const baseUrl = process.env.STORJ_PUBLIC_URL || process.env.NEXT_PUBLIC_STORJ_PUBLIC_URL;
  
  if (!baseUrl) {
    console.warn('STORJ_PUBLIC_URL not set. Use getSignedUrl() instead for secure access.');
    return filename;
  }
  
  // Remove leading slash if present
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  
  // Ensure base URL doesn't end with slash
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${cleanBaseUrl}/${cleanFilename}`;
}

/**
 * List objects in the bucket with a given prefix
 * @param prefix The prefix to filter objects by (e.g., "users/0x123.../assets/")
 * @returns Array of objects in the bucket (empty array if Storj is not configured)
 */
export async function listObjects(prefix: string): Promise<Array<{
  key: string;
  size: number;
  lastModified: string;
  contentType?: string;
}>> {
  try {
    const config = getStorjConfig();
    
    if (!config) {
      console.warn('⚠️ Cannot list objects: Storj not configured');
      return [];
    }
    
    // Create a dedicated S3 client for listing objects
    const s3Client = new S3Client({
      endpoint: config.endpoint,
      region: 'us-east-1', // Storj uses us-east-1 as default
      credentials: {
        accessKeyId: config.credentials.accessKeyId,
        secretAccessKey: config.credentials.secretAccessKey,
      },
      forcePathStyle: true, // Required for Storj
    });
    
    // Remove leading slash if present
    const cleanPrefix = prefix.startsWith('/') ? prefix.slice(1) : prefix;
    
    const command = new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: cleanPrefix,
    });

    const response = await s3Client.send(command);
    
    return (response.Contents || []).map((item: any) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified?.toISOString() || new Date().toISOString(),
      contentType: item.ContentType,
    }));
  } catch (error) {
    console.error('Error listing objects:', error);
    return [];
  }
}

