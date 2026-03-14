/**
 * Validators - Barrel Export
 */

// Re-export validators from shared package
export {
  userRegisterSchema,
  userLoginSchema,
  loginWithOTPRequestSchema,
  verifyLoginOTPSchema,
  checkPhoneSchema,
  sendOTPSchema,
  verifyOTPSchema,
  setPasswordSchema,
  changePasswordSchema,
  profileSetupSchema,
  birthDetailsSchema,
  sendMessageSchema,
  getChatHistorySchema,
  createConsultationSchema,
  updateConsultationSchema,
  createHoroscopeSchema,
  getHoroscopeSchema,
  createNotificationSchema,
  createPaymentSchema,
  paginationSchema,
  idParamSchema,
  createJyotishBookingRequestSchema,
  adminUpdateJyotishBookingStatusSchema,
  createClientProfileSchema,
  updateClientProfileSchema,
} from '@jyotish/shared';

// Export backend-specific validators (auth password-reset schemas live here so API works without shared build)
export {
  forgotPasswordSchema,
  resetPasswordWithTokenSchema,
  resetPasswordWithOtpSchema,
  verifyPasswordResetOtpSchema,
  googleMobileLoginSchema,
  type GoogleMobileLoginInput,
} from './auth.validators';
export * from './query.validators';
export * from './coin.validators';
export * from './horoscope.validators';
export * from './notification.validators';
export * from './appointment.validators';
export * from './slot.validators';
export * from './dashboardRotatingCopy.validators';
export * from './jyotishBooking.validators';
export * from './broadcastMessage.validators';
export * from './adminAstrologer.validators';
export * from './tip.validators';