 'use client';

import { useState } from 'react';
import { Eye, FileText } from 'lucide-react';
import { Button } from '@jyotish/ui';
import { getImageUrl } from '@/utils/helpers';

interface AttachmentPreviewProps {
  attachmentUrl: string | null | undefined;
  onView?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AttachmentPreview({
  attachmentUrl,
  onView,
  size = 'md',
}: AttachmentPreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!attachmentUrl) {
    return <span className="text-slate-500 text-sm">N/A</span>;
  }

  // Handle JSON array string (multiple files) or single file string
  let fileUrls: string[] = [];
  try {
    const parsed = JSON.parse(attachmentUrl);
    fileUrls = Array.isArray(parsed) ? parsed : [attachmentUrl];
  } catch {
    // Not JSON, treat as single file URL
    fileUrls = [attachmentUrl];
  }

  // Use first file for preview
  const firstFileUrl = fileUrls[0];
  const fullUrl = getImageUrl(firstFileUrl);
  if (!fullUrl) {
    return <span className="text-slate-500 text-sm">N/A</span>;
  }

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(firstFileUrl);
  const isPdf = /\.pdf$/i.test(firstFileUrl);
  const hasMultipleFiles = fileUrls.length > 1;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (onView) {
      // Let parent (e.g. modal opener) handle viewing all files (images or docs)
      onView();
      return;
    }

    // Fallback: open the file directly in a new tab
    window.open(fullUrl, '_blank');
  };

  return (
    <div
      className={`relative ${sizeClasses[size]} rounded-lg overflow-hidden border border-slate-700 group cursor-pointer`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={hasMultipleFiles ? `${fileUrls.length} files` : firstFileUrl.split('/').pop() || 'Attachment'}
      onClick={handleView}
    >
      {hasMultipleFiles && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-bl-lg z-10">
          +{fileUrls.length}
        </div>
      )}

      {isImage && !imageError ? (
        <>
          <img
            src={fullUrl}
            alt="Attachment preview"
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </>
      ) : (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
          <FileText className={`w-8 h-8 ${isPdf ? 'text-red-400' : 'text-blue-400'}`} />
        </div>
      )}

      {/* Unified hover overlay: always shows a View button */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            className="text-white hover:text-white hover:bg-white/10"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
        </div>
      )}
    </div>
  );
}
