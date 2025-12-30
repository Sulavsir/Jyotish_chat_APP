import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import consultationRoutes from './consultation.routes';
import consultationRequestRoutes from './consultationRequest.routes';
import instantChatRoutes from './instantChat.routes';
import broadcastMessageRoutes from './broadcastMessage.routes';
import horoscopeRoutes from './horoscope.routes';
import notificationRoutes from './notification.routes';
import notificationSettingsRoutes from './notificationSettings.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/consultations', consultationRoutes);
router.use('/consultation-requests', consultationRequestRoutes); // Future feature
router.use('/instant-chat', instantChatRoutes); // Active instant chat feature
router.use('/broadcast-messages', broadcastMessageRoutes); // "Everyone Jyotish" broadcast chat
router.use('/horoscopes', horoscopeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notification-settings', notificationSettingsRoutes);

export default router;

