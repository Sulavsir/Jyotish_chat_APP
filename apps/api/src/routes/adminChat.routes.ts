/**
 * Admin Chat Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import { chatUploadSingle } from '../middleware/chatUpload';
import {
  createAdminChatSchema,
  sendAdminChatMessageSchema,
  updateAdminChatStatusSchema,
  assignAdminToChatSchema,
  listAdminSupportChatsQuerySchema,
} from '../validators/adminChat.validators';
import adminChatController from '../controllers/adminChatController';

const router = Router();

// User routes
router.post('/', authenticate, validate(createAdminChatSchema), adminChatController.createChat);
router.get('/my', authenticate, adminChatController.getUserChats);
router.get('/:id', authenticate, adminChatController.getChatById);
router.get('/:id/messages', authenticate, adminChatController.getChatMessages);
router.post('/:id/messages', authenticate, validate(sendAdminChatMessageSchema), adminChatController.sendMessage);
router.patch('/:id/read', authenticate, adminChatController.markAsRead);
router.post('/upload-file', authenticate, chatUploadSingle('file'), adminChatController.uploadAdminChatFile);

// Admin routes
router.get(
  '/admin/all',
  authenticate,
  validateQuery(listAdminSupportChatsQuerySchema),
  adminChatController.getAllChats
);
router.get('/admin/unread-count', authenticate, adminChatController.getUnreadCount);
router.patch('/admin/:id/status', authenticate, validate(updateAdminChatStatusSchema), adminChatController.updateChatStatus);
router.patch('/admin/:id/assign', authenticate, validate(assignAdminToChatSchema), adminChatController.assignAdmin);

export default router;
