/**
 * Client Profile Controller
 * CRUD for family/friend profiles (for asking questions on behalf of someone)
 */

import type { Response } from 'express';
import * as clientProfileService from '../services/clientProfile.service';
import type { AuthRequest } from '../types';

export async function list(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const profiles = await clientProfileService.listByUserId(userId);
  res.json({
    success: true,
    data: { profiles },
  });
}

export async function create(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { name, relationship, dateOfBirth, timeOfBirth, placeOfBirth, gender } = req.body;
  const profile = await clientProfileService.create(userId, {
    name,
    relationship,
    dateOfBirth,
    timeOfBirth,
    placeOfBirth,
    gender,
  });
  res.status(201).json({
    success: true,
    data: { profile },
  });
}

export async function update(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;
  const { name, relationship, dateOfBirth, timeOfBirth, placeOfBirth, gender } = req.body;
  const profile = await clientProfileService.update(id, userId, {
    name,
    relationship,
    dateOfBirth,
    timeOfBirth,
    placeOfBirth,
    gender,
  });
  res.json({
    success: true,
    data: { profile },
  });
}

export async function remove(req: AuthRequest, res: Response) {
  const userId = req.user!.id;
  const { id } = req.params;
  await clientProfileService.remove(id, userId);
  res.json({
    success: true,
    data: { message: 'Profile deleted successfully' },
  });
}
