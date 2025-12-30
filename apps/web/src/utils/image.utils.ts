/**
 * Image utility functions
 */

import { API_BASE_URL } from '@/constants';

/**
 * Get full image URL from a relative or absolute path
 * @param imagePath - The image path (can be relative or absolute URL)
 * @returns Full image URL or null if no image
 */
export function getImageUrl(imagePath?: string | null): string | null {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}${imagePath}`;
}
