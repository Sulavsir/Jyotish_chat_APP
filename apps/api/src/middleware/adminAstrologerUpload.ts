/**
 * Admin Astrologer Creation File Upload Middleware
 * Handles uploading proof of astrology certificates/documents when admin creates astrologer
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'astrologer-registrations');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const prefix = file.fieldname === 'profilePhoto' ? 'admin-profile' : 'admin-proof';
    cb(null, `${prefix}-${uniqueSuffix}-${baseName}${ext}`);
  },
});

// File filter - profilePhoto: images only; proofOfAstrology: images and PDFs
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (file.fieldname === 'profilePhoto') {
    if (imageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Profile photo must be an image (JPEG, PNG, GIF, or WebP).'));
    }
    return;
  }

  const allowedTypes = [...imageTypes, 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type "${file.mimetype}". Only JPEG, PNG, GIF, WebP images and PDF documents are allowed.`
      )
    );
  }
};

// Configure multer for admin-created astrologer proof uploads
export const adminAstrologerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});
