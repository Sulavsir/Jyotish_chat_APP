/**
 * Chat File Upload Middleware using Multer
 * Handles images, documents, and files for chat messages
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure uploads directories exist
const chatFilesDir = path.join(process.cwd(), 'uploads', 'chat', 'files');
const chatImagesDir = path.join(process.cwd(), 'uploads', 'chat', 'images');

if (!fs.existsSync(chatFilesDir)) {
  fs.mkdirSync(chatFilesDir, { recursive: true });
}
if (!fs.existsSync(chatImagesDir)) {
  fs.mkdirSync(chatImagesDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Separate images from other files
    const isImage = file.mimetype.startsWith('image/');
    const destinationDir = isImage ? chatImagesDir : chatFilesDir;
    cb(null, destinationDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId-timestamp-originalname
    const userId = (req as any).user?.id || 'unknown';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${userId}-${uniqueSuffix}-${baseName}${ext}`);
  },
});

// File filter - accept images, PDFs, docs, and common file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Text
    'text/plain',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`));
  }
};

// Configure multer for chat files
export const chatUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB max file size
  },
});

// Single file upload middleware
export const chatUploadSingle = (fieldName: string = 'file') => chatUpload.single(fieldName);
