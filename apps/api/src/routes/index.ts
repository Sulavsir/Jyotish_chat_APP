import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import chatRoutes from './chat.routes';
import consultationRoutes from './consultation.routes';
import horoscopeRoutes from './horoscope.routes';
import notificationRoutes from './notification.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/consultations', consultationRoutes);
router.use('/horoscopes', horoscopeRoutes);
router.use('/notifications', notificationRoutes);

export default router;

