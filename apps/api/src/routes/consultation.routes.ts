import { Router } from 'express';
import { prisma } from '@jyotish/database';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';
import { createConsultationSchema, updateConsultationSchema, UserRole } from '@jyotish/shared';

const router = Router();

// Create consultation
router.post('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const validatedData = createConsultationSchema.parse(req.body);

    // Verify astrologer exists
    const astrologer = await prisma.user.findUnique({
      where: { id: validatedData.astrologerId },
    });

    if (!astrologer || astrologer.role !== UserRole.ASTROLOGER) {
      throw new HttpError(404, 'Astrologer not found', 'ASTROLOGER_NOT_FOUND');
    }

    // Create consultation
    const consultation = await prisma.consultation.create({
      data: {
        clientId: req.user!.id,
        astrologerId: validatedData.astrologerId,
        scheduledAt: new Date(validatedData.scheduledAt),
        duration: validatedData.duration,
        type: validatedData.type,
        amount: calculateAmount(validatedData.duration, validatedData.type),
        notes: validatedData.notes,
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        astrologer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
});

// Get user's consultations
router.get('/my', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const consultations = await prisma.consultation.findMany({
      where: {
        OR: [
          { clientId: req.user!.id },
          { astrologerId: req.user!.id },
        ],
      },
      include: {
        client: {
          select: { id: true, name: true, email: true, image: true },
        },
        astrologer: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json({ success: true, data: consultations });
  } catch (error) {
    next(error);
  }
});

// Update consultation
router.patch('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const validatedData = updateConsultationSchema.parse(req.body);

    // Check if consultation exists and user has permission
    const existing = await prisma.consultation.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new HttpError(404, 'Consultation not found', 'CONSULTATION_NOT_FOUND');
    }

    if (existing.clientId !== req.user!.id && existing.astrologerId !== req.user!.id) {
      throw new HttpError(403, 'Unauthorized', 'UNAUTHORIZED');
    }

    const consultation = await prisma.consultation.update({
      where: { id },
      data: {
        ...(validatedData.scheduledAt && { scheduledAt: new Date(validatedData.scheduledAt) }),
        ...(validatedData.duration && { duration: validatedData.duration }),
        ...(validatedData.status && { status: validatedData.status }),
        ...(validatedData.notes && { notes: validatedData.notes }),
      },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        astrologer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json({ success: true, data: consultation });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate consultation amount
function calculateAmount(duration: number, type: string): number {
  const baseRate = type === 'VIDEO' ? 50 : type === 'VOICE' ? 30 : 20;
  return (duration / 15) * baseRate; // Price per 15 minutes
}

export default router;

