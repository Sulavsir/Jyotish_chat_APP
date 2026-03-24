/**
 * Client Profile Service
 * Manages family/friend profiles for clients (for asking questions on behalf of someone)
 */

import { prisma } from '@jyotish/database';
import { AppError } from '../middleware/error-handler';
import { HTTP_STATUS, ERROR_CODES } from '../constants';

async function composeNepalPlaceOfBirthString(
  pradeshId: string,
  districtId: string,
  location: string | null | undefined
): Promise<string | null> {
  const [pradesh, district] = await Promise.all([
    prisma.nepalGeography.findUnique({ where: { id: pradeshId }, select: { nameEn: true } }),
    prisma.nepalGeography.findUnique({ where: { id: districtId }, select: { nameEn: true } }),
  ]);
  const loc = location?.trim() || '';
  const parts = [pradesh?.nameEn, district?.nameEn, loc].filter((p) => p && String(p).trim());
  return parts.length ? parts.join(', ') : null;
}

export async function listByUserId(userId: string) {
  const profiles = await prisma.clientProfile.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return profiles;
}

export async function create(
  userId: string,
  data: {
    name: string;
    relationship: string;
    dateOfBirth?: Date | string | null;
    timeOfBirth?: string | null;
    placeOfBirth?: string | null;
    placeOfBirthType?: 'NEPAL' | 'OUTSIDE_NEPAL' | null;
    placeOfBirthPradeshId?: string | null;
    placeOfBirthDistrictId?: string | null;
    placeOfBirthLocation?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  }
) {
  const dateOfBirth =
    data.dateOfBirth instanceof Date
      ? data.dateOfBirth
      : typeof data.dateOfBirth === 'string' && data.dateOfBirth.trim()
        ? new Date(data.dateOfBirth)
        : null;
  const timeOfBirth =
    data.timeOfBirth && String(data.timeOfBirth).trim() ? String(data.timeOfBirth).trim() : null;
  let placeOfBirth =
    data.placeOfBirth && String(data.placeOfBirth).trim() ? String(data.placeOfBirth).trim() : null;
  if (
    !placeOfBirth &&
    data.placeOfBirthType === 'NEPAL' &&
    data.placeOfBirthPradeshId &&
    data.placeOfBirthDistrictId
  ) {
    placeOfBirth = await composeNepalPlaceOfBirthString(
      data.placeOfBirthPradeshId,
      data.placeOfBirthDistrictId,
      data.placeOfBirthLocation
    );
  }

  const profile = await prisma.clientProfile.create({
    data: {
      userId,
      name: data.name.trim(),
      relationship: data.relationship.trim(),
      dateOfBirth,
      timeOfBirth,
      placeOfBirth,
      placeOfBirthType: data.placeOfBirthType ?? null,
      placeOfBirthPradeshId: data.placeOfBirthPradeshId ?? null,
      placeOfBirthDistrictId: data.placeOfBirthDistrictId ?? null,
      placeOfBirthLocation: data.placeOfBirthLocation ?? null,
      gender: data.gender ?? null,
    },
  });
  return profile;
}

export async function update(
  id: string,
  userId: string,
  data: {
    name?: string;
    relationship?: string;
    dateOfBirth?: Date | string | null;
    timeOfBirth?: string | null;
    placeOfBirth?: string | null;
    placeOfBirthType?: 'NEPAL' | 'OUTSIDE_NEPAL' | null;
    placeOfBirthPradeshId?: string | null;
    placeOfBirthDistrictId?: string | null;
    placeOfBirthLocation?: string | null;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | null;
  }
) {
  const existing = await prisma.clientProfile.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new AppError('Profile not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }

  const dateOfBirth =
    data.dateOfBirth !== undefined
      ? data.dateOfBirth instanceof Date
        ? data.dateOfBirth
        : typeof data.dateOfBirth === 'string' && data.dateOfBirth.trim()
          ? new Date(data.dateOfBirth)
          : null
      : undefined;
  const timeOfBirth =
    data.timeOfBirth !== undefined
      ? data.timeOfBirth && String(data.timeOfBirth).trim()
        ? String(data.timeOfBirth).trim()
        : null
      : undefined;
  const mergedType = data.placeOfBirthType !== undefined ? data.placeOfBirthType : existing.placeOfBirthType;
  const mergedPradesh =
    data.placeOfBirthPradeshId !== undefined ? data.placeOfBirthPradeshId : existing.placeOfBirthPradeshId;
  const mergedDistrict =
    data.placeOfBirthDistrictId !== undefined ? data.placeOfBirthDistrictId : existing.placeOfBirthDistrictId;
  const mergedLocation =
    data.placeOfBirthLocation !== undefined ? data.placeOfBirthLocation : existing.placeOfBirthLocation;

  let placeOfBirth: string | null | undefined = undefined;
  if (data.placeOfBirth !== undefined) {
    placeOfBirth = data.placeOfBirth && String(data.placeOfBirth).trim() ? String(data.placeOfBirth).trim() : null;
  } else if (mergedType === 'NEPAL' && mergedPradesh && mergedDistrict) {
    placeOfBirth = await composeNepalPlaceOfBirthString(mergedPradesh, mergedDistrict, mergedLocation);
  }

  const profile = await prisma.clientProfile.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.relationship !== undefined && { relationship: data.relationship.trim() }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(timeOfBirth !== undefined && { timeOfBirth }),
      ...(placeOfBirth !== undefined && { placeOfBirth }),
      ...(data.placeOfBirthType !== undefined && { placeOfBirthType: data.placeOfBirthType }),
      ...(data.placeOfBirthPradeshId !== undefined && { placeOfBirthPradeshId: data.placeOfBirthPradeshId }),
      ...(data.placeOfBirthDistrictId !== undefined && { placeOfBirthDistrictId: data.placeOfBirthDistrictId }),
      ...(data.placeOfBirthLocation !== undefined && { placeOfBirthLocation: data.placeOfBirthLocation }),
      ...(data.gender !== undefined && { gender: data.gender }),
    },
  });
  return profile;
}

export async function remove(id: string, userId: string) {
  const existing = await prisma.clientProfile.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new AppError('Profile not found', HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND);
  }
  await prisma.clientProfile.delete({ where: { id } });
}
