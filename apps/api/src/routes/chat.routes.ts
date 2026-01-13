/**
 * Chat Routes
 * Routes for chat/messaging functionality
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { chatUploadSingle } from '../middleware/chatUpload';
import * as chatController from '../controllers/chatController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all conversations for the user
router.get('/conversations', chatController.getConversations);

// Get or create a chat with another user
router.post('/chats', chatController.getOrCreateChat);

// Get chat by ID
router.get('/chats/:chatId', chatController.getChatById);

// Get chat history with a specific user
router.get('/history/:otherUserId', chatController.getChatHistory);

// Send a message (HTTP fallback, WebSocket is preferred)
router.post('/messages', chatController.sendMessage);

// Upload file for chat
router.post('/upload-file', chatUploadSingle('file'), chatController.uploadChatFile);

// Mark messages as read
router.put('/chats/:chatId/read', chatController.markAsRead);

// Delete a message
router.delete('/messages/:messageId', chatController.deleteMessage);

// Get unread message count
router.get('/unread-count', chatController.getUnreadCount);

// Search messages
router.get('/search', chatController.searchMessages);

// End a chat
router.put('/chats/:chatId/end', chatController.endChat);

// Get active chat for current user
router.get('/active-chat', chatController.getActiveChat);

export default router;