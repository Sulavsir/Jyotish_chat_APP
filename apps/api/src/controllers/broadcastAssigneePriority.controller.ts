import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils';
import * as broadcastAssigneePriorityService from '../services/broadcastAssigneePriority.service';
import type {
  CreateBroadcastAssigneePriorityBody,
  UpdateBroadcastAssigneePriorityBody,
} from '@jyotish/shared';

export async function createBroadcastAssigneePriority(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const body = req.body as CreateBroadcastAssigneePriorityBody;
    const row = await broadcastAssigneePriorityService.createBroadcastAssigneePriority(
      body.astrologerId,
      body.priority
    );
    return sendSuccess(res, { assigneePriority: row }, 201);
  } catch (error) {
    next(error);
  }
}

export async function updateBroadcastAssigneePriority(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const body = req.body as UpdateBroadcastAssigneePriorityBody;
    const row = await broadcastAssigneePriorityService.updateBroadcastAssigneePriority(id, {
      astrologerId: body.astrologerId,
      priority: body.priority,
    });
    return sendSuccess(res, { assigneePriority: row });
  } catch (error) {
    next(error);
  }
}

export async function deleteBroadcastAssigneePriority(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    await broadcastAssigneePriorityService.deleteBroadcastAssigneePriority(id);
    return sendSuccess(res, { success: true });
  } catch (error) {
    next(error);
  }
}
