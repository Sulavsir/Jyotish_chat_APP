/**
 * Admin Routes - All routes require ADMIN role
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { requireFullAdmin } from '../middleware/adminPermissions.middleware';
import { auditLogger } from '../middleware/audit-logger';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import {
  adminAddCoinsSchema,
  updatePlatformCoinRatesSchema,
  listAstrologersWithCoinEarningsQuerySchema,
} from '../validators/coin.validators';
import {
  approveAstrologerRegistrationSchema,
  rejectAstrologerRegistrationSchema,
} from '@jyotish/shared';
import { AuditAction } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import {
  adminController,
  adminAppointmentController,
  pricingController,
  dashboardRotatingCopyController,
  questionnaireController,
} from '../controllers';
import * as broadcastQuestionPricingController from '../controllers/broadcastQuestionPricing.controller';
import { cancelAppointmentSchema } from '../validators/appointment.validators';
import {
  queryPaginationSchema,
  chatIdParamSchema,
} from '../validators/query.validators';
import {
  abandonChatBodySchema,
  listAdminMonitorChatsQuerySchema,
} from '../validators/adminChat.validators';
import { asyncHandler } from '../utils';
import { adminAstrologerUpload } from '../middleware/adminAstrologerUpload';
import {
  createDashboardRotatingCopySchema,
  updateDashboardRotatingCopySchema,
  uuidParamSchema,
  adminUpdateJyotishBookingStatusSchema,
  listAdminAstrologersQuerySchema,
  listAdminJyotishBookingsQuerySchema,
  listAdminDashboardRotatingCopyQuerySchema,
  updateAstrologerSchema,
  deleteAstrologerBodySchema,
  verifyEditPasswordBodySchema,
} from '../validators';
import {
  listAdminPlatformPaymentQuerySchema,
  listAdminUsersQuerySchema,
} from '../validators';
import {
  createQuestionCategorySchema,
  updateQuestionCategorySchema,
  listQuestionCategoriesQuerySchema,
} from '@jyotish/shared';
import { updateBroadcastQuestionPricingBodySchema } from '../validators/broadcastQuestionPricing.validators';
import { jyotishBookingController, adminCoinRatesController, tipController, subhaSahitController } from '../controllers';
import * as kundaliMatchController from '../controllers/kundaliMatch.controller';
import {
  listAdminKundaliMatchQuerySchema,
  submitKundaliMatchReviewSchema,
} from '../validators/kundaliMatch.validators';
import { adminHoroscopeController } from '../controllers';
import {
  createHoroscopesBodySchema,
  updateHoroscopeBodySchema,
  listHoroscopesQuerySchema,
} from '../validators/horoscope.validators';
import {
  createTipsBodySchema,
  listTipsQuerySchema,
  updateTipBodySchema,
} from '../validators/tip.validators';
import {
  createSubhaSahitDatesBodySchema,
  listSubhaSahitDatesQuerySchema,
  updateSubhaSahitDateBodySchema,
  createSubhaSahitOccasionBodySchema,
  updateSubhaSahitOccasionMetaBodySchema,
  getSubhaSahitOccasionsQuerySchema,
  deleteSubhaSahitOccasionBodySchema,
} from '../validators/subha-sahit.validators';
import { toggleAstrologerOnlineBodySchema } from '../validators/adminAstrologer.validators';
import {
  assignPendingBroadcastBodySchema,
  updateAdminBroadcastSettingsBodySchema,
} from '../validators/adminBroadcastSettings.validators';
import {
  createBroadcastAssigneePriorityBodySchema,
  updateBroadcastAssigneePriorityBodySchema,
} from '@jyotish/shared';
import * as broadcastAssigneePriorityController from '../controllers/broadcastAssigneePriority.controller';

const router = Router();

// ==================== Admin Authentication ====================
// These routes don't require authentication
router.post('/auth/login', adminController.adminLogin);
router.post('/auth/refresh', adminController.adminRefreshToken); // Add refresh route

// Protected admin routes
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

router.post('/auth/logout', adminController.adminLogout);
router.get('/auth/me', adminController.getAdminProfile);

// ==================== User Management (FULL + USER_SUPPORT) ====================
router.get(
  '/users',
  validateQuery(listAdminUsersQuerySchema),
  asyncHandler(adminController.listUsers)
);

router.get('/users/:id', adminController.getUser);

router.post(
  '/users/:id/toggle-status',
  auditLogger(AuditAction.USER_UPDATE, 'User'),
  adminController.toggleUserStatus
);

router.delete(
  '/users/:id',
  auditLogger(AuditAction.USER_DELETE, 'User'),
  adminController.deleteUser
);

// ==================== User Management (financial — full admins only) ====================
router.post(
  '/users/:id/add-coins',
  requireFullAdmin,
  auditLogger(AuditAction.ADMIN_ACTION, 'User'),
  validateBody(adminAddCoinsSchema),
  asyncHandler(adminController.addCoinsToUser)
);

// ==================== Astrologer Management ====================
router.get(
  '/astrologers',
  validateQuery(listAdminAstrologersQuerySchema),
  asyncHandler(adminController.listAstrologers)
);

router.post(
  '/astrologers',
  auditLogger(AuditAction.ASTROLOGER_CREATE, 'Astrologer'),
  adminAstrologerUpload.fields([
    { name: 'proofOfAstrology', maxCount: 10 },
    { name: 'profilePhoto', maxCount: 1 },
  ]),
  adminController.createAstrologer
);

// ==================== Astrologer Registration Requests ====================
router.get(
  '/astrologers/registration-requests',
  adminController.getRegistrationRequests
);

router.post(
  '/astrologers/verify-edit-password',
  validateBody(verifyEditPasswordBodySchema),
  asyncHandler(adminController.verifyAstrologerEditPassword)
);

router.get('/astrologers/:id', adminController.getAstrologer);

router.post(
  '/astrologers/:id/proof-upload',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  adminAstrologerUpload.single('proofOfAstrology'),
  asyncHandler(adminController.uploadAstrologerProof)
);

router.post(
  '/astrologers/:id/profile-photo',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  adminAstrologerUpload.single('profilePhoto'),
  asyncHandler(adminController.uploadAstrologerProfilePhoto)
);

router.patch(
  '/astrologers/:id',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  validateBody(updateAstrologerSchema),
  asyncHandler(adminController.updateAstrologer)
);

router.delete(
  '/astrologers/:id',
  auditLogger(AuditAction.ASTROLOGER_DELETE, 'Astrologer'),
  validateParams(uuidParamSchema),
  validateBody(deleteAstrologerBodySchema),
  asyncHandler(adminController.deleteAstrologer)
);

router.post(
  '/astrologers/:id/toggle-status',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  adminController.toggleAstrologerStatus
);
router.post(
  '/astrologers/:id/toggle-online',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  validateBody(toggleAstrologerOnlineBodySchema),
  asyncHandler(adminController.toggleAstrologerOnlineStatus)
);

router.post(
  '/astrologers/:id/toggle-verify',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  adminController.toggleAstrologerVerified
);

router.get(
  '/astrologers/:id/earnings',
  requireFullAdmin,
  adminController.getAstrologerEarnings
);

router.post(
  '/astrologers/:id/approve-registration',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  validateBody(approveAstrologerRegistrationSchema),
  asyncHandler(adminController.approveRegistration)
);

router.post(
  '/astrologers/:id/reject-registration',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  validateBody(rejectAstrologerRegistrationSchema),
  asyncHandler(adminController.rejectRegistration)
);

// ==================== Audit Logs ====================
router.get('/audit-logs', adminController.listAuditLogs);

router.get('/audit-logs/:id', adminController.getAuditLog);

router.get('/audit-logs/user/:userId', adminController.getUserAuditLogs);

router.get('/audit-logs/astrologer/:astrologerId', adminController.getAstrologerAuditLogs);

// ==================== Chat Monitoring ====================
router.get(
  '/chats',
  validateQuery(listAdminMonitorChatsQuerySchema),
  asyncHandler(adminController.listChats)
);

router.get('/chats/:id', adminController.getChat);

router.get('/chats/:id/messages', adminController.getChatMessages);

router.post(
  '/chats/:chatId/abandon',
  validateParams(chatIdParamSchema),
  validateBody(abandonChatBodySchema),
  asyncHandler(adminController.abandonChat)
);
router.post(
  '/chats/:chatId/unblock',
  validateParams(chatIdParamSchema),
  asyncHandler(adminController.unblockChat)
);
router.post(
  '/chats/:chatId/reopen',
  validateParams(chatIdParamSchema),
  asyncHandler(adminController.reopenChat)
);

router.post(
  '/chats/messages/:messageId/flag',
  auditLogger(AuditAction.MESSAGE_FLAG, 'Message'),
  adminController.flagMessage
);

router.post(
  '/chats/:id/note',
  auditLogger(AuditAction.ADMIN_ACTION, 'Chat'),
  adminController.addChatNote
);

// Cleanup stuck chats
router.post(
  '/chats/cleanup-stuck',
  auditLogger(AuditAction.ADMIN_ACTION, 'Chat'),
  adminController.cleanupStuckChats
);

// ==================== Earnings Management (full admins only) ====================
router.get(
  '/earnings/astrologers-with-coins',
  requireFullAdmin,
  validateQuery(listAstrologersWithCoinEarningsQuerySchema),
  asyncHandler(adminController.listAstrologersWithCoinEarnings)
);
router.get('/earnings', requireFullAdmin, adminController.listEarnings);

router.post(
  '/earnings/:id/approve',
  requireFullAdmin,
  auditLogger(AuditAction.ADMIN_ACTION, 'Earnings'),
  adminController.approveEarning
);

router.post(
  '/earnings/:id/reject',
  requireFullAdmin,
  auditLogger(AuditAction.ADMIN_ACTION, 'Earnings'),
  adminController.rejectEarning
);

router.post(
  '/earnings/:id/mark-paid',
  requireFullAdmin,
  auditLogger(AuditAction.ADMIN_ACTION, 'Earnings'),
  adminController.markEarningPaid
);

// ==================== Platform Coin Transactions (payment history — full admins only) ====================
router.get(
  '/coin-transactions',
  requireFullAdmin,
  validateQuery(listAdminPlatformPaymentQuerySchema),
  asyncHandler(adminController.getPlatformTransactions)
);

// ==================== Sidebar Counts (for badges) ====================
router.get('/sidebar-counts', asyncHandler(adminController.getSidebarCounts));

// ==================== Dashboard ====================
router.get('/dashboard/stats', adminController.getDashboardStats);

router.get('/dashboard/recent-activities', adminController.getRecentActivities);

// Dashboard rotating copy (managed by admin)
router.get(
  '/dashboard/rotating-copy',
  validateQuery(listAdminDashboardRotatingCopyQuerySchema),
  asyncHandler(dashboardRotatingCopyController.listAdmin)
);
router.post(
  '/dashboard/rotating-copy',
  auditLogger(AuditAction.ADMIN_ACTION, 'DashboardRotatingCopy'),
  validateBody(createDashboardRotatingCopySchema),
  asyncHandler(dashboardRotatingCopyController.create)
);
router.patch(
  '/dashboard/rotating-copy/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'DashboardRotatingCopy'),
  validateParams(uuidParamSchema),
  validateBody(updateDashboardRotatingCopySchema),
  asyncHandler(dashboardRotatingCopyController.update)
);
router.patch(
  '/dashboard/rotating-copy/:id/toggle',
  auditLogger(AuditAction.ADMIN_ACTION, 'DashboardRotatingCopy'),
  validateParams(uuidParamSchema),
  asyncHandler(dashboardRotatingCopyController.toggle)
);
router.delete(
  '/dashboard/rotating-copy/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'DashboardRotatingCopy'),
  validateParams(uuidParamSchema),
  asyncHandler(dashboardRotatingCopyController.remove)
);

// ==================== Questionnaires (Question Categories & Questions) ====================
router.get(
  '/questionnaires',
  validateQuery(listQuestionCategoriesQuerySchema),
  asyncHandler(questionnaireController.listAdminQuestionnaires)
);

router.post(
  '/questionnaires',
  auditLogger(AuditAction.ADMIN_ACTION, 'QuestionCategory'),
  validateBody(createQuestionCategorySchema),
  asyncHandler(questionnaireController.createQuestionCategory)
);

router.patch(
  '/questionnaires/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'QuestionCategory'),
  validateParams(uuidParamSchema),
  validateBody(updateQuestionCategorySchema),
  asyncHandler(questionnaireController.updateQuestionCategory)
);

router.delete(
  '/questionnaires/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'QuestionCategory'),
  validateParams(uuidParamSchema),
  asyncHandler(questionnaireController.removeQuestionCategory)
);

// ==================== Broadcast Question Pricing (NRs per question count) ====================
router.get(
  '/broadcast-question-pricing',
  asyncHandler(broadcastQuestionPricingController.getPricing)
);
router.put(
  '/broadcast-question-pricing',
  auditLogger(AuditAction.ADMIN_ACTION, 'BroadcastQuestionPricing'),
  validateBody(updateBroadcastQuestionPricingBodySchema),
  asyncHandler(broadcastQuestionPricingController.updatePricing)
);
router.get('/broadcast-settings', asyncHandler(adminController.getBroadcastSettings));
router.put(
  '/broadcast-settings',
  validateBody(updateAdminBroadcastSettingsBodySchema),
  asyncHandler(adminController.updateBroadcastSettings)
);
router.post(
  '/broadcast/pending/:id/assign',
  validateParams(uuidParamSchema),
  validateBody(assignPendingBroadcastBodySchema),
  asyncHandler(adminController.assignPendingBroadcast)
);
router.post(
  '/broadcast-settings/assignee-priorities',
  auditLogger(AuditAction.ADMIN_ACTION, 'BroadcastAssigneePriority'),
  validateBody(createBroadcastAssigneePriorityBodySchema),
  asyncHandler(broadcastAssigneePriorityController.createBroadcastAssigneePriority)
);
router.patch(
  '/broadcast-settings/assignee-priorities/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'BroadcastAssigneePriority'),
  validateParams(uuidParamSchema),
  validateBody(updateBroadcastAssigneePriorityBodySchema),
  asyncHandler(broadcastAssigneePriorityController.updateBroadcastAssigneePriority)
);
router.delete(
  '/broadcast-settings/assignee-priorities/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'BroadcastAssigneePriority'),
  validateParams(uuidParamSchema),
  asyncHandler(broadcastAssigneePriorityController.deleteBroadcastAssigneePriority)
);

// ==================== Jyotish Bookings (Pandit/Vaastu) ====================
router.get(
  '/jyotish-bookings',
  validateQuery(listAdminJyotishBookingsQuerySchema),
  asyncHandler(jyotishBookingController.listAdmin)
);
router.patch(
  '/jyotish-bookings/:id/status',
  auditLogger(AuditAction.ADMIN_ACTION, 'JyotishBookingRequest'),
  validateParams(uuidParamSchema),
  validateBody(adminUpdateJyotishBookingStatusSchema),
  asyncHandler(jyotishBookingController.updateStatusAdmin)
);

// ==================== Chat Audit ====================
router.get('/chat-audit', adminController.getChatAudit);

router.get('/chat-audit/stats', adminController.getChatAuditStats);

// ==================== Appointment Management ====================

router.get(
  '/appointments',
  validateQuery(queryPaginationSchema),
  adminAppointmentController.getAllAppointments
);
router.get('/appointments/stats', adminAppointmentController.getAppointmentStats);
router.post(
  '/appointments/:id/cancel',
  auditLogger(AuditAction.ADMIN_ACTION, 'Appointment'),
  validateParams(uuidParamSchema),
  validateBody(cancelAppointmentSchema),
  asyncHandler(adminAppointmentController.cancelAppointment)
);

// ==================== Pricing Management ====================

router.get('/pricing', pricingController.getAllPlansAdmin);

router.get('/pricing/:id', pricingController.getPlanById);

router.post(
  '/pricing',
  auditLogger(AuditAction.ADMIN_ACTION, 'PricingPlan'),
  pricingController.createPlan
);

router.put(
  '/pricing/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'PricingPlan'),
  pricingController.updatePlan
);

router.delete(
  '/pricing/:id',
  auditLogger(AuditAction.ADMIN_ACTION, 'PricingPlan'),
  pricingController.deletePlan
);

router.patch(
  '/pricing/:id/toggle',
  auditLogger(AuditAction.ADMIN_ACTION, 'PricingPlan'),
  pricingController.togglePlanStatus
);

// ==================== Kundali Match ====================
router.get(
  '/kundali-match',
  validateQuery(listAdminKundaliMatchQuerySchema),
  asyncHandler(kundaliMatchController.listAdmin)
);
router.get(
  '/kundali-match/:id',
  validateParams(uuidParamSchema),
  asyncHandler(kundaliMatchController.getByIdAdmin)
);
router.post(
  '/kundali-match/:id/review',
  auditLogger(AuditAction.ADMIN_ACTION, 'KundaliMatchRequest'),
  validateParams(uuidParamSchema),
  validateBody(submitKundaliMatchReviewSchema),
  asyncHandler(kundaliMatchController.submitReview)
);

// ==================== Platform Coin Rates (admin-configurable) ====================
router.get('/coin-rates', asyncHandler(adminCoinRatesController.getCoinRates));
router.put(
  '/coin-rates',
  validateBody(updatePlatformCoinRatesSchema),
  asyncHandler(adminCoinRatesController.updateCoinRates)
);

// ==================== Daily Tips (admin-managed) ====================
router.get(
  '/tips',
  validateQuery(listTipsQuerySchema),
  asyncHandler(tipController.listTips)
);
router.post(
  '/tips',
  validateBody(createTipsBodySchema),
  asyncHandler(tipController.createTips)
);
router.get('/tips/:id', validateParams(uuidParamSchema), asyncHandler(tipController.getTipById));
router.patch(
  '/tips/:id',
  validateParams(uuidParamSchema),
  validateBody(updateTipBodySchema),
  asyncHandler(tipController.updateTip)
);
router.delete('/tips/:id', validateParams(uuidParamSchema), asyncHandler(tipController.deleteTip));

// ==================== Horoscope Management (admin) ====================
router.get(
  '/horoscopes',
  validateQuery(listHoroscopesQuerySchema),
  asyncHandler(adminHoroscopeController.listHoroscopes)
);
router.get(
  '/horoscopes/:id',
  validateParams(uuidParamSchema),
  asyncHandler(adminHoroscopeController.getHoroscopeById)
);
router.post(
  '/horoscopes/bulk',
  validateBody(createHoroscopesBodySchema),
  asyncHandler(adminHoroscopeController.createHoroscopes)
);
router.patch(
  '/horoscopes/:id',
  validateParams(uuidParamSchema),
  validateBody(updateHoroscopeBodySchema),
  asyncHandler(adminHoroscopeController.updateHoroscope)
);
router.delete(
  '/horoscopes/:id',
  validateParams(uuidParamSchema),
  asyncHandler(adminHoroscopeController.deleteHoroscope)
);

// ==================== Subha Sahit Management (admin) ====================
router.get(
  '/subha-sahit',
  validateQuery(listSubhaSahitDatesQuerySchema),
  asyncHandler(subhaSahitController.listDates)
);
router.get(
  '/subha-sahit/occasions',
  validateQuery(getSubhaSahitOccasionsQuerySchema),
  asyncHandler(subhaSahitController.getOccasions)
);
router.get(
  '/subha-sahit/:id',
  validateParams(uuidParamSchema),
  asyncHandler(subhaSahitController.getDate)
);
router.post(
  '/subha-sahit/occasions',
  validateBody(createSubhaSahitOccasionBodySchema),
  asyncHandler(subhaSahitController.createOccasion)
);
router.put(
  '/subha-sahit/occasion-meta',
  validateBody(updateSubhaSahitOccasionMetaBodySchema),
  asyncHandler(subhaSahitController.updateOccasionMeta)
);
router.delete(
  '/subha-sahit/occasions',
  validateBody(deleteSubhaSahitOccasionBodySchema),
  asyncHandler(subhaSahitController.deleteOccasion)
);
router.post(
  '/subha-sahit',
  validateBody(createSubhaSahitDatesBodySchema),
  asyncHandler(subhaSahitController.createDates)
);
router.put(
  '/subha-sahit/:id',
  validateParams(uuidParamSchema),
  validateBody(updateSubhaSahitDateBodySchema),
  asyncHandler(subhaSahitController.updateDate)
);
router.delete(
  '/subha-sahit/:id',
  validateParams(uuidParamSchema),
  asyncHandler(subhaSahitController.deleteDate)
);

// ==================== Complaint Management Routes ====================
router.get('/complaints', asyncHandler(adminController.getComplaints));
router.get('/complaints/stats', asyncHandler(adminController.getComplaintStats));
router.patch('/complaints/:id/status', asyncHandler(adminController.updateComplaintStatus));
router.post('/complaints/:id/resolve', asyncHandler(adminController.resolveComplaint));
router.post('/complaints/:id/dismiss', asyncHandler(adminController.dismissComplaint));

export default router;
