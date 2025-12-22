import { Router } from 'express';
import { prisma } from '@jyotish/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { HttpError } from '../middleware/errorHandler';

const router = Router();

// Get chat history with a user
router.get('/history/:userId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user!.id, receiverId: userId },
          { senderId: userId, receiverId: req.user!.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    const total = await prisma.message.count({
      where: {
        OR: [
          { senderId: req.user!.id, receiverId: userId },
          { senderId: userId, receiverId: req.user!.id },
        ],
      },
    });

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all conversations
router.get('/conversations', authenticate, async (req: AuthRequest, res, next) => {
  try {
    // Get unique users the current user has chatted with
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT ON (other_user_id)
        other_user_id,
        u.name,
        u.email,
        u.image,
        m.content as last_message,
        m."createdAt" as last_message_time,
        m."isRead" as is_read
      FROM (
        SELECT 
          CASE 
            WHEN "senderId" = ${req.user!.id} THEN "receiverId"
            ELSE "senderId"
          END as other_user_id,
          id,
          content,
          "createdAt",
          "isRead"
        FROM "Message"
        WHERE "senderId" = ${req.user!.id} OR "receiverId" = ${req.user!.id}
      ) m
      JOIN "User" u ON u.id = m.other_user_id
      ORDER BY other_user_id, m."createdAt" DESC
    `;

    res.json({ success: true, data: conversations });
  } catch (error) {
    next(error);
  }
});

export default router;

