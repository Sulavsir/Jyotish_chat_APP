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
import astrologerRoutes from './astrologer.routes';
import adminRoutes from './admin.routes';
import pricingRoutes from './pricing.routes';
import appointmentRoutes from './appointment.routes';
import complaintRoutes from './complaint.routes';
import publicRoutes from './public.routes';
import ratingRoutes from './rating.routes';
import coinRoutes from './coin.routes';
import adminChatRoutes from './adminChat.routes';
import jyotishBookingRoutes from './jyotishBooking.routes';

const router = Router();

// Public routes (no auth required)
router.use('/public', publicRoutes);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);
router.use('/consultations', consultationRoutes);
router.use('/consultation-requests', consultationRequestRoutes); // Future feature
router.use('/instant-chat', instantChatRoutes); // Active instant chat feature
router.use('/broadcast-messages', broadcastMessageRoutes); // "Everyone Jyotish" broadcast chat
router.use('/appointments', appointmentRoutes); // Appointment booking
router.use('/horoscopes', horoscopeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notification-settings', notificationSettingsRoutes);
router.use('/pricing', pricingRoutes); // Pricing plans
router.use('/complaints', complaintRoutes); // User complaints
router.use('/ratings', ratingRoutes); // Astrologer ratings
router.use('/coins', coinRoutes); // Coin management
router.use('/admin-chat', adminChatRoutes); // Admin chat support widget
router.use('/jyotish-bookings', jyotishBookingRoutes); // Pandit/Vaastu booking requests

// Astrologer routes
router.use('/astrologer', astrologerRoutes);

// Admin routes
router.use('/admin', adminRoutes);

export default router;

