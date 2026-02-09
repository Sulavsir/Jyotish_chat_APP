/**
 * Admin Routes - All routes require ADMIN role
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit-logger';
import { validateBody, validateParams, validateQuery } from '../middleware/validate';
import { adminAddCoinsSchema } from '../validators/coin.validators';
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
} from '../validators';
import {
  createQuestionCategorySchema,
  updateQuestionCategorySchema,
  listQuestionCategoriesQuerySchema,
} from '@jyotish/shared';
import { jyotishBookingController } from '../controllers';

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
  asyncHandler(adminController.deleteAstrologer)
);

router.post(
  '/astrologers/:id/toggle-status',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  adminController.toggleAstrologerStatus
);

router.post(
  '/astrologers/:id/toggle-verify',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  adminController.toggleAstrologerVerified
);

router.get('/astrologers/:id/earnings', adminController.getAstrologerEarnings);

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

// ==================== User Management ====================
router.get('/users', adminController.listUsers);

router.get('/users/:id', adminController.getUser);

router.post(
  '/users/:id/toggle-status',
  auditLogger(AuditAction.USER_UPDATE, 'User'),
  adminController.toggleUserStatus
);

router.post(
  '/users/:id/add-coins',
  auditLogger(AuditAction.ADMIN_ACTION, 'User'),
  validateBody(adminAddCoinsSchema),
  asyncHandler(adminController.addCoinsToUser)
);

router.delete(
  '/users/:id',
  auditLogger(AuditAction.USER_DELETE, 'User'),
  adminController.deleteUser
);

// ==================== Audit Logs ====================
router.get('/audit-logs', adminController.listAuditLogs);

router.get('/audit-logs/:id', adminController.getAuditLog);

router.get('/audit-logs/user/:userId', adminController.getUserAuditLogs);

router.get('/audit-logs/astrologer/:astrologerId', adminController.getAstrologerAuditLogs);

// ==================== Chat Monitoring ====================
router.get('/chats', adminController.listChats);

router.get('/chats/:id', adminController.getChat);

router.get('/chats/:id/messages', adminController.getChatMessages);

router.post('/chats/:chatId/abandon', adminController.abandonChat);

router.post('/chats/:chatId/unblock', adminController.unblockChat);

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

// ==================== Earnings Management ====================
router.get('/earnings', adminController.listEarnings);

router.post(
  '/earnings/:id/approve',
  auditLogger(AuditAction.ADMIN_ACTION, 'Earnings'),
  adminController.approveEarning
);

router.post(
  '/earnings/:id/reject',
  auditLogger(AuditAction.ADMIN_ACTION, 'Earnings'),
  adminController.rejectEarning
);

router.post(
  '/earnings/:id/mark-paid',
  auditLogger(AuditAction.ADMIN_ACTION, 'Earnings'),
  adminController.markEarningPaid
);

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

router.get('/appointments', adminAppointmentController.getAllAppointments);
router.get('/appointments/stats', adminAppointmentController.getAppointmentStats);

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

// ==================== Complaint Management Routes ====================
router.get('/complaints', asyncHandler(adminController.getComplaints));
router.get('/complaints/stats', asyncHandler(adminController.getComplaintStats));
router.patch('/complaints/:id/status', asyncHandler(adminController.updateComplaintStatus));
router.post('/complaints/:id/resolve', asyncHandler(adminController.resolveComplaint));
router.post('/complaints/:id/dismiss', asyncHandler(adminController.dismissComplaint));

export default router;
