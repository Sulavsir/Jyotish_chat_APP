/**
 * Complaint Routes
 * User complaints against astrologers
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadComplaintAttachment } from '../middleware/complaintUpload';
import { asyncHandler } from '@/utils';
import * as complaintController from '../controllers/complaintController';

const router = Router();

// User complaint routes (requires authentication)
router.post(
  '/',
  authenticate,
  uploadComplaintAttachment,
  asyncHandler(complaintController.createComplaint)
);
router.get('/', authenticate, asyncHandler(complaintController.getUserComplaints));
router.get('/:id', authenticate, asyncHandler(complaintController.getComplaintById));

export default router;

