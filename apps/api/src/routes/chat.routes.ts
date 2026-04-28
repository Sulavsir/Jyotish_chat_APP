/**
 * Chat Routes
 * Routes for chat/messaging functionality
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateParams, validateBody } from '../middleware/validate';
import { chatUploadSingle } from '../middleware/chatUpload';
import { chatIdParamSchema } from '../validators/query.validators';
import * as chatController from '../controllers/chatController';
import { sendDirectQuestionBundleBodySchema } from '../validators/broadcastQuestion.validators';
import { postChatChatsBodySchema } from '../validators/chat.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations for the user
router.get('/conversations', chatController.getConversations);

// Get or create a chat with another user
router.post('/chats', validateBody(postChatChatsBodySchema), chatController.getOrCreateChat);

// Get chat by ID
router.get('/chats/:chatId', validateParams(chatIdParamSchema), chatController.getChatById);

// Get chat history with a specific user
router.get('/history/:otherUserId', chatController.getChatHistory);

// Send a message (HTTP fallback, WebSocket is preferred)
router.post('/messages', chatController.sendMessage);

// Direct chat: multi-question bundle (tiered pricing like broadcast prepare)
router.post(
  '/send-direct-question-bundle',
  validateBody(sendDirectQuestionBundleBodySchema),
  chatController.sendDirectQuestionBundle
);

// Upload file for chat
router.post('/upload-file', chatUploadSingle('file'), chatController.uploadChatFile);

// Mark messages as read
router.put('/chats/:chatId/read', validateParams(chatIdParamSchema), chatController.markAsRead);

// Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);

// Get unread message count
router.get('/unread-count', chatController.getUnreadCount);

// Search messages
router.get('/search', chatController.searchMessages);

// End a chat
router.put('/chats/:chatId/end', validateParams(chatIdParamSchema), chatController.endChat);

// Get active chat for current user
router.get('/active-chat', chatController.getActiveChat);

export default router;
