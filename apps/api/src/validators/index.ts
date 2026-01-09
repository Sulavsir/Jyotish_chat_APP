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
} from '@jyotish/shared';

// Export backend-specific validators
export * from './query.validators';
export * from './horoscope.validators';
export * from './notification.validators';
export * from './appointment.validators';
