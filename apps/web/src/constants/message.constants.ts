/**
 * Message & Toast Constants
 */

export const TOAST_MESSAGES = {
  SUCCESS: {
    LOGIN: 'Successfully logged in!',
    OTP_SENT: 'OTP sent successfully to your phone!',
    OTP_VERIFIED: 'Phone number verified successfully!',
    PASSWORD_SET: 'Password set successfully!',
    PROFILE_CREATED: 'Profile created successfully!',
    REGISTER: 'Account created successfully!',
    PROFILE_UPDATE: 'Profile updated successfully!',
    CONSULTATION_BOOKED: 'Consultation booked successfully!',
    HOROSCOPE_SUBSCRIBED: 'Subscribed to daily horoscope!',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    LOGIN: 'Invalid credentials. Please try again.',
    OTP_SEND_FAILED: 'Failed to send OTP. Please try again.',
    OTP_INVALID: 'Invalid OTP. Please check and try again.',
    OTP_EXPIRED: 'OTP has expired. Please request a new one.',
    PHONE_INVALID: 'Invalid phone number. Please check and try again.',
    PASSWORD_MISMATCH: 'Passwords do not match.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'Session expired. Please login again.',
    PROFILE_INCOMPLETE: 'Please complete your profile setup.',
  },
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio',
} as const;

