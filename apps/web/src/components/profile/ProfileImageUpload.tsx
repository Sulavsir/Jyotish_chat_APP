/**
 * Profile Image Upload Component
 * Handles profile photo upload with plus icon and dropdown menu for change/remove
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/utils/image.utils';
import { API_BASE_URL } from '@/constants';
import { Button } from '@jyotish/ui';

interface ProfileImageUploadProps {
  currentImage?: string | null;
  userName?: string;
  onUpload: (file: File) => void;
  onRemove: () => void;
  isUploading?: boolean;
  isEditing?: boolean;
}

export function ProfileImageUpload({
  currentImage,
  userName,
  onUpload,
  onRemove,
  isUploading = false,
  isEditing = false,
}: ProfileImageUploadProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Update dropdown position when opening and on scroll
  useEffect(() => {
    const updatePosition = () => {
      if (showDropdown && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          left: rect.left,
        });
      }
    };

    updatePosition();

    if (showDropdown) {
      // Update position on scroll
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      onUpload(file);
      setShowDropdown(false);
    }
    // Reset input value to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
    setShowDropdown(false);
  };

  const handleChangeClick = () => {
    fileInputRef.current?.click();
    setShowDropdown(false);
  };

  const handleRemoveClick = () => {
    onRemove();
    setShowDropdown(false);
  };

  const imageUrl = getImageUrl(currentImage);

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div className="relative">
        {imageUrl ? (
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 relative">
            <Image
              src={imageUrl}
              alt={userName || 'Profile'}
              width={128}
              height={128}
              className="w-full h-full object-cover"
              unoptimized={imageUrl.includes(API_BASE_URL)}
            />
          </div>
        ) : (
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold text-4xl border-4 border-white/10">
            {userName ? userName.charAt(0).toUpperCase() : '👤'}
          </div>
        )}

        {/* Upload/Edit Button - Always visible */}
        <div className="absolute bottom-0 right-0 z-[60]" ref={dropdownRef}>
          {!currentImage ? (
            // Plus icon for upload when no image
            <button
              onClick={handleUploadClick}
              disabled={isUploading}
              className={cn(
                'w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center text-white transition-colors shadow-lg',
                isUploading && 'opacity-50 cursor-not-allowed'
              )}
              title="Upload photo"
            >
              {isUploading ? (
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          ) : (
            // Dropdown icon when image exists
            <>
              <button
                ref={buttonRef}
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={isUploading}
                className={cn(
                  'w-10 h-10 rounded-full bg-orange-600 hover:bg-orange-700 flex items-center justify-center text-white transition-colors shadow-lg',
                  isUploading && 'opacity-50 cursor-not-allowed'
                )}
                title="Photo options"
              >
                {isUploading ? (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Dropdown Menu - Rendered via Portal */}
      {showDropdown &&
        !isUploading &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-48 rounded-lg bg-gray-900 border border-white/10 shadow-xl overflow-hidden z-[9999]"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
            }}
          >
            <button
              onClick={handleChangeClick}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Change Photo
            </button>

            <button
              onClick={handleRemoveClick}
              className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-3"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Remove Photo
            </button>
          </div>,
          document.body
        )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
