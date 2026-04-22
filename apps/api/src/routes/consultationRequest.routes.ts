/**
 * Consultation Request Routes
 * Routes for ride-sharing style consultation requests
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/async-handler';
import { consultationRequestController } from '../controllers/consultationRequestController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/consultation-requests:
 *   post:
 *     summary: Create a new consultation request
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [CHAT, VOICE, VIDEO]
 *               description:
 *                 type: string
 *               preferredTime:
 *                 type: string
 *                 format: date-time
 *               duration:
 *                 type: number
 *                 default: 30
 *     responses:
 *       201:
 *         description: Consultation request created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/',
  asyncHandler(consultationRequestController.createRequest.bind(consultationRequestController))
);

/**
 * @swagger
 * /api/v1/consultation-requests/pending:
 *   get:
 *     summary: Get all pending consultation requests (for astrologers)
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending consultation requests
 */
router.get(
  '/pending',
  asyncHandler(consultationRequestController.getPendingRequests.bind(consultationRequestController))
);

/**
 * @swagger
 * /api/v1/consultation-requests/my-requests:
 *   get:
 *     summary: Get client's own consultation requests
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of client's consultation requests
 */
router.get(
  '/my-requests',
  asyncHandler(consultationRequestController.getMyRequests.bind(consultationRequestController))
);

/**
 * @swagger
 * /api/v1/consultation-requests/check-active:
 *   get:
 *     summary: Check if astrologer has active consultation
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns whether astrologer has active consultation
 */
router.get(
  '/check-active',
  asyncHandler(
    consultationRequestController.checkActiveConsultation.bind(consultationRequestController)
  )
);

/**
 * @swagger
 * /api/v1/consultation-requests/statistics:
 *   get:
 *     summary: Get consultation request statistics
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Consultation request statistics
 */
router.get(
  '/statistics',
  asyncHandler(consultationRequestController.getStatistics.bind(consultationRequestController))
);

/**
 * @swagger
 * /api/v1/consultation-requests/{id}:
 *   get:
 *     summary: Get a single consultation request by ID
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consultation request details
 *       404:
 *         description: Consultation request not found
 */
router.get(
  '/:id',
  asyncHandler(consultationRequestController.getRequestById.bind(consultationRequestController))
);

/**
 * @swagger
 * /api/v1/consultation-requests/{id}/accept:
 *   post:
 *     summary: Accept a consultation request (astrologer only)
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consultation request accepted successfully
 *       403:
 *         description: Only astrologers can accept
 *       409:
 *         description: Astrologer has active consultation or request already accepted
 *       410:
 *         description: Request has expired
 */
router.post(
  '/:id/accept',
  asyncHandler(consultationRequestController.acceptRequest.bind(consultationRequestController))
);

/**
 * @swagger
 * /api/v1/consultation-requests/{id}/cancel:
 *   post:
 *     summary: Cancel a consultation request (client only)
 *     tags: [Consultation Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Consultation request cancelled successfully
 *       403:
 *         description: Unauthorized
 *       400:
 *         description: Can only cancel pending requests
 */
router.post(
  '/:id/cancel',
  asyncHandler(consultationRequestController.cancelRequest.bind(consultationRequestController))
);

export default router;
