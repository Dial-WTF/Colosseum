/**
 * 🎯 Tensor.trade Integration Utilities
 * 
 * Helper functions for integrating with Tensor.trade NFT marketplace
 * https://www.tensor.trade/
 */

/**
 * Generate Tensor.trade URL for a specific NFT mint
 */
export function getTensorItemUrl(mintAddress: string): string {
  return `https://www.tensor.trade/item/${mintAddress}`;
}

/**
 * Generate Tensor.trade URL for a collection
 */
export function getTensorCollectionUrl(collectionSlug: string): string {
  return `https://www.tensor.trade/trade/${collectionSlug}`;
}

/**
 * Open Tensor.trade item page in new tab
 */
export function openTensorItem(mintAddress: string): void {
  window.open(getTensorItemUrl(mintAddress), '_blank', 'noopener,noreferrer');
}

/**
 * Open Tensor.trade collection page in new tab
 */
export function openTensorCollection(collectionSlug: string): void {
  window.open(getTensorCollectionUrl(collectionSlug), '_blank', 'noopener,noreferrer');
}

/**
 * Generate shareable Tensor link with optional referral
 */
export function getTensorShareUrl(mintAddress: string, referralCode?: string): string {
  const baseUrl = getTensorItemUrl(mintAddress);
  return referralCode ? `${baseUrl}?ref=${referralCode}` : baseUrl;
}

/**
 * Convert collection name to Tensor slug format
 * Example: "Dial Tones Vol. 1" -> "dial-tones-vol-1"
 */
export function collectionNameToSlug(collectionName: string): string {
  return collectionName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
}

/**
 * Check if Tensor.trade is accessible
 */
export async function isTensorAccessible(): Promise<boolean> {
  try {
    const response = await fetch('https://www.tensor.trade/', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    console.warn('Tensor.trade may not be accessible:', error);
    return false;
  }
}

