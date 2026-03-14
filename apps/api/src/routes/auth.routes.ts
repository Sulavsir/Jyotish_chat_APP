import { Router } from 'express';
import { authController } from '../controllers';
import * as googleOAuthController from '../controllers/google-oauth.controller';
import { validateBody } from '../middleware/validate';
import { asyncHandler } from '../utils';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import {
  checkPhoneSchema,
  sendOTPSchema,
  verifyOTPSchema,
  setPasswordSchema,
  changePasswordSchema,
  userLoginSchema,
  loginWithOTPRequestSchema,
  verifyLoginOTPSchema,
  forgotPasswordSchema,
  resetPasswordWithTokenSchema,
  resetPasswordWithOtpSchema,
  verifyPasswordResetOtpSchema,
  googleMobileLoginSchema,
} from '../validators';

const router = Router();

// ─── Google OAuth ───────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/google/login:
 *   get:
 *     summary: Initiate Google OAuth login (redirects to Google)
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google authorization URL
 */
router.get('/google/login', asyncHandler(googleOAuthController.googleLogin));

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback (handles redirect from Google)
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with auth cookies set
 */
router.get('/google/callback', asyncHandler(googleOAuthController.googleCallback));

/**
 * @swagger
 * /api/v1/auth/google/verify-token:
 *   post:
 *     summary: Google Sign-In for mobile apps (Flutter) - Verify ID token
 *     tags: [Auth]
 *     description: |
 *       Accepts a Google ID token from native sign-in (google_sign_in package),
 *       verifies it with Google, finds or creates the user, and returns app session tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token JWT from native sign-in
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     user:
 *                       type: object
 *                     isNewUser:
 *                       type: boolean
 *       400:
 *         description: Validation error (missing or invalid token format)
 *       401:
 *         description: Invalid or expired Google ID token
 */
router.post(
  '/google/verify-token',
  validateBody(googleMobileLoginSchema),
  asyncHandler(googleOAuthController.googleMobileLogin)
);

// Alias for backwards compatibility (if any other clients use /google/mobile)
router.post(
  '/google/mobile',
  validateBody(googleMobileLoginSchema),
  asyncHandler(googleOAuthController.googleMobileLogin)
);

// ─── Phone / Password Auth ──────────────────────────────────────────

/**
 * @swagger
 * /api/v1/auth/check-phone:
 *   post:
 *     summary: Check if phone number exists in system
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: 10-digit phone number
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Phone check successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                     message:
 *                       type: string
 */
router.post(
  '/check-phone',
  validateBody(checkPhoneSchema),
  asyncHandler(authController.checkPhone)
);

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number (for new users)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessionId:
 *                       type: string
 *                     message:
 *                       type: string
 */
router.post('/send-otp', validateBody(sendOTPSchema), asyncHandler(authController.sendOTP));

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *               - sessionId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "1234567890"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post('/verify-otp', validateBody(verifyOTPSchema), asyncHandler(authController.verifyOTP));

/**
 * @swagger
 * /api/v1/auth/set-password:
 *   post:
 *     summary: Set password for new user (after OTP verification)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tempToken
 *               - password
 *               - confirmPassword
 *             properties:
 *               tempToken:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       201:
 *         description: Password set and account created
 */
router.post(
  '/set-password',
  validateBody(setPasswordSchema),
  asyncHandler(authController.setPassword)
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login with email/phone and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *                 example: "user@example.com or 1234567890"
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', validateBody(userLoginSchema), asyncHandler(authController.login));

/**
 * @swagger
 * /api/v1/auth/login-with-otp:
 *   post:
 *     summary: Request OTP for passwordless login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post(
  '/login-with-otp',
  validateBody(loginWithOTPRequestSchema),
  asyncHandler(authController.requestLoginOTP)
);

/**
 * @swagger
 * /api/v1/auth/verify-login-otp:
 *   post:
 *     summary: Verify OTP and login (passwordless)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *               - sessionId
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *               sessionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post(
  '/verify-login-otp',
  validateBody(verifyLoginOTPSchema),
  asyncHandler(authController.verifyLoginOTP)
);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Legacy register endpoint (deprecated)
 *     deprecated: true
 *     tags: [Auth]
 *     responses:
 *       410:
 *         description: Endpoint deprecated
 */
router.post('/register', asyncHandler(authController.register));

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset via email or phone OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone number
 *     responses:
 *       200:
 *         description: Reset instructions sent (if account exists)
 */
router.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  asyncHandler(authController.requestPasswordReset)
);

/**
 * @swagger
 * /api/v1/auth/reset-password-token:
 *   post:
 *     summary: Reset password using email token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/reset-password-token',
  validateBody(resetPasswordWithTokenSchema),
  asyncHandler(authController.resetPasswordWithToken)
);

/**
 * @swagger
 * /api/v1/auth/reset-password-otp:
 *   post:
 *     summary: Reset password using phone OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *               - sessionId
 *               - password
 *               - confirmPassword
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *               sessionId:
 *                 type: string
 *               password:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post(
  '/reset-password-otp',
  validateBody(resetPasswordWithOtpSchema),
  asyncHandler(authController.resetPasswordWithOTP)
);

router.post(
  '/verify-password-reset-otp',
  validateBody(verifyPasswordResetOtpSchema),
  asyncHandler(authController.verifyPasswordResetOtp)
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, and number)
 *               confirmPassword:
 *                 type: string
 *                 description: Confirm new password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password incorrect or unauthorized
 */
router.post(
  '/change-password',
  authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

/**
 * @swagger
 * /api/v1/auth/set-password-existing:
 *   post:
 *     summary: Set password for existing user who doesn't have one
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: New password (min 8 chars, must contain uppercase, lowercase, and number)
 *     responses:
 *       200:
 *         description: Password set successfully
 *       400:
 *         description: Password already set
 */
router.post(
  '/set-password-existing',
  authenticate,
  validateBody(z.object({ password: z.string().min(8) })),
  asyncHandler(authController.setPasswordForExistingUser)
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Refresh token required
 *       401:
 *         description: Invalid or expired refresh token
 */
// Refresh endpoint - no validation needed, token comes from httpOnly cookie
router.post('/refresh', asyncHandler(authController.refreshToken));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user and revoke refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to revoke
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Invalid request
 */
// Logout endpoint - no validation needed, token comes from httpOnly cookie
router.post('/logout', asyncHandler(authController.logout));

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout-all', authenticate, asyncHandler(authController.logoutAll));

export default router;
