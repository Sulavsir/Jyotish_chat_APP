/**
 * ImagePreview Component
 * A reusable full-screen image preview modal with ESC key and click-to-close support
 */

import * as React from 'react';
import { Button } from './button';
import { XIcon } from './icons';
import { cn } from './utils';

export interface ImagePreviewProps {
  /** URL of the image to preview */
  imageUrl: string | null;
  /** Alt text for the image */
  alt?: string;
  /** Callback when the preview is closed */
  onClose: () => void;
  /** Show ESC hint at the bottom (default: true) */
  showEscHint?: boolean;
  /** Additional CSS class for the container */
  className?: string;
}

export function ImagePreview({
  imageUrl,
  alt = 'Image preview',
  onClose,
  showEscHint = true,
  className,
}: ImagePreviewProps) {
  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && imageUrl) {
        onClose();
      }
    };

    if (imageUrl) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [imageUrl, onClose]);

  // Don't render if no image URL
  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm',
        className
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="relative h-[700px] flex items-center justify-center p-4 border border-white/10 rounded-lg">
        {/* Close Button */}
        <div className="absolute top-4 right-4 z-10 ">
          <Button
            onClick={onClose}
            variant="outline"
            color="neutral"
            size="icon"
            aria-label="Close preview"
            type="button"
          >
            <XIcon className="w-6 h-6" />
          </Button>
        </div>

        {/* Image */}
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />

        {/* ESC Hint */}
        {showEscHint && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-800/80 px-4 py-2 rounded-full text-white text-sm">
            Press <kbd className="px-2 py-1 bg-slate-700 rounded">ESC</kbd> to close
          </div>
        )}
      </div>
    </div>
  );
}
