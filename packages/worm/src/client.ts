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
 * Generate a signed URL for a file stored in Storj
 * This creates a temporary URL that allows public access without exposing credentials
 * @param filename The file path within the bucket (e.g., "users/0x123.../avatar.png")
 * @param expiresIn Time in seconds until the URL expires (default: 1 hour)
 * @returns Promise resolving to the signed URL
 */
export async function getSignedUrl(filename: string, expiresIn: number = 3600): Promise<string> {
  try {
    const config = getStorjConfig();
    
    // Import AWS SDK utilities
    const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
    const { getSignedUrl: awsGetSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    
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
 * @returns Array of objects in the bucket
 */
export async function listObjects(prefix: string): Promise<Array<{
  key: string;
  size: number;
  lastModified: string;
  contentType?: string;
}>> {
  try {
    const config = getStorjConfig();
    
    // Import AWS SDK utilities
    const { S3Client, ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
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

