/**
 * Profile Completion Utilities
 * Check if user profile is complete before allowing certain actions
 */

import type { User } from '@jyotish/shared';

export interface ProfileCompletionResult {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Check if client profile is complete
 * Required fields: name, dateOfBirth, timeOfBirth, placeOfBirth, gender
 */
export function checkClientProfileCompletion(user: User | null): ProfileCompletionResult {
  const missingFields: string[] = [];

  if (!user) {
    return {
      isComplete: false,
      missingFields: ['All profile information'],
    };
  }

  // Check required fields
  if (!user.name || user.name.trim() === '') {
    missingFields.push('Name');
  }

  if (!user.dateOfBirth) {
    missingFields.push('Date of Birth');
  }

  if (!user.timeOfBirth || user.timeOfBirth.trim() === '') {
    missingFields.push('Time of Birth');
  }

  if (!user.placeOfBirth || user.placeOfBirth.trim() === '') {
    missingFields.push('Place of Birth');
  }

  if (!user.gender) {
    missingFields.push('Gender');
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Format missing fields for display
 */
export function formatMissingFields(missingFields: string[]): string {
  if (missingFields.length === 0) return '';
  if (missingFields.length === 1) return missingFields[0];
  if (missingFields.length === 2) return `${missingFields[0]} and ${missingFields[1]}`;
  
  const lastField = missingFields[missingFields.length - 1];
  const otherFields = missingFields.slice(0, -1).join(', ');
  return `${otherFields}, and ${lastField}`;
}
