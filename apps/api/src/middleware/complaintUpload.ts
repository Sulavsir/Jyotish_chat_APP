/**
 * Complaint File Upload Middleware
 * Handles uploading evidence/screenshots for complaints
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure complaints uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'complaints');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp-originalname
    const userId = (req as any).user?.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/\s/g, '-');
    cb(null, `complaint-${userId}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only accept images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// Configure multer
export const complaintUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size for screenshots
  },
});

// Single file upload middleware
export const uploadComplaintAttachment = complaintUpload.single('attachment');

