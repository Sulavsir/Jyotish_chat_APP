/**
 * Phone number utility functions
 */

/**
 * Check if a phone number is Nepali format
 * Nepali numbers typically start with 98 or 97 and are 10 digits
 * Can also have +977 prefix
 */
export function isNepaliPhoneNumber(phone: string): boolean {
  if (!phone) return false;

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // Check if it has +977 prefix (13 digits total)
  if (cleanPhone.startsWith('977') && cleanPhone.length === 13) {
    // Remove 977 prefix and check if remaining starts with 98 or 97
    const withoutPrefix = cleanPhone.slice(3);
    return /^(98|97)\d{8}$/.test(withoutPrefix);
  }

  // Check if it's a 10-digit number starting with 98 or 97
  if (cleanPhone.length === 10) {
    return /^(98|97)\d{8}$/.test(cleanPhone);
  }

  return false;
}
