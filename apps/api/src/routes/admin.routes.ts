/**
 * Admin Routes - All routes require ADMIN role
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { auditLogger } from '../middleware/audit-logger';
import { AuditAction } from '@jyotish/database';
import * as adminController from '../controllers/adminController';

const router = Router();

// ==================== Admin Authentication ====================
// These routes don't require authentication
router.post('/auth/login', adminController.adminLogin);

// Protected admin routes
router.use(authenticate);
router.use(authorize('ADMIN')); // All routes below require ADMIN role

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

export default router;


