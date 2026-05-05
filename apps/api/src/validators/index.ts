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
  facebookMobileLoginSchema,
  appleMobileLoginSchema,
  type GoogleMobileLoginInput,
  type FacebookMobileLoginInput,
  type AppleMobileLoginInput,
} from './auth.validators';
export * from './query.validators';
export * from './coin.validators';
export * from './horoscope.validators';
export * from './notification.validators';
export * from './appointment.validators';
export * from './slot.validators';
export * from './dashboardRotatingCopy.validators';
export * from './jyotishBooking.validators';
export * from './userAccount.validators';
export * from './broadcastMessage.validators';
export * from './adminAstrologer.validators';
export * from './tip.validators';
export * from './astrologer.validators';
export * from './adminPlatformPayment.validators';
export * from './adminUsersList.validators';
export * from './adminBroadcastAcceptanceReport.validators';
export * from './chatAudit.validators';
export * from './chat.validators';
export * from './kundaliMatchConsultationCatalogue.validators';