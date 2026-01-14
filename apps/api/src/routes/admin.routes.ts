/**
 * Admin Routes - All routes require ADMIN role
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit-logger';
import { validateBody } from '../middleware/validate';
import { adminAddCoinsSchema } from '../validators/coin.validators';
import { AuditAction } from '@jyotish/database';
import { UserRole } from '@jyotish/shared';
import { adminController, adminAppointmentController, pricingController } from '../controllers';
import { asyncHandler } from '../utils';

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
router.get('/astrologers', adminController.listAstrologers);

router.post(
  '/astrologers',
  auditLogger(AuditAction.ASTROLOGER_CREATE, 'Astrologer'),
  adminController.createAstrologer
);

router.get('/astrologers/:id', adminController.getAstrologer);

router.patch(
  '/astrologers/:id',
  auditLogger(AuditAction.ASTROLOGER_UPDATE, 'Astrologer'),
  adminController.updateAstrologer
);

router.delete(
  '/astrologers/:id',
  auditLogger(AuditAction.ASTROLOGER_DELETE, 'Astrologer'),
  adminController.deleteAstrologer
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
