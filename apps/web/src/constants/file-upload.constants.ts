/**
 * File Upload Constants
 * Defines restrictions and allowed file types for uploads
 */

export const FILE_UPLOAD = {
  // Maximum file size in bytes (1MB)
  MAX_SIZE: 1 * 1024 * 1024, // 1MB
  
  // Maximum file size label for display
  MAX_SIZE_LABEL: '1MB',

  // Allowed MIME types
  ALLOWED_TYPES: {
    // Images
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    
    // Documents
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    
    // Text files
    'text/plain': ['.txt'],
    
    // Other
    'application/zip': ['.zip'],
  },

  // Accept string for input element
  ACCEPT_STRING: 'image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip',

  // Human-readable allowed types
  ALLOWED_TYPES_LABEL: 'Images (JPG, PNG, GIF, WebP), PDF, DOC, DOCX, TXT, ZIP',
} as const;

export type AllowedFileType = keyof typeof FILE_UPLOAD.ALLOWED_TYPES;

