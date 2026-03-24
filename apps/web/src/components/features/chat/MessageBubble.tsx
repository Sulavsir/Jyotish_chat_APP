/**
 * MessageBubble Component
 * Displays a single chat message with support for text and file attachments
 */

import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback, Badge } from '@jyotish/ui';
import { CheckCheck, Check, FileText, Download, User } from 'lucide-react';
import { MessageBubbleProps } from '@/types/chat';
import { getImageUrl } from '@/utils/image.utils';
import { API_BASE_URL } from '@/constants';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/user.types';
import { QUESTION_CATEGORIES } from '@/constants/questionCategories.constants';
import { ProfileBirthDetails } from './ProfileBirthDetails';

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
  showBirthDetails: showBirthDetailsProp,
  variant = 'default',
  onViewProfile,
  nepaliBatch,
}) => {
  const user = useAuthStore((state) => state.user);
  const isAstrologerViewingClient =
    user?.role === UserRole.ASTROLOGER && !isOwn && message.sender?.role === UserRole.CLIENT;
  const clientId = message.senderId || message.sender?.id;
  const showClientIconFallback =
    message.sender?.role === UserRole.CLIENT &&
    !message.sender?.profilePhoto &&
    !message.sender?.name;

  // Birth details: prefer message metadata (selected profile) when present, else sender (user profile)
  const metaBirth = message.metadata as Record<string, unknown> | undefined;
  const metaBirthDetails = metaBirth?.birthDetails;
  const birthDetailsFromMeta =
    metaBirthDetails && typeof metaBirthDetails === 'object'
      ? (metaBirthDetails as { dateOfBirth?: string; timeOfBirth?: string; placeOfBirth?: string })
      : null;

  const birthDetails = {
    dateOfBirth: birthDetailsFromMeta?.dateOfBirth ?? message.sender?.dateOfBirth,
    timeOfBirth: birthDetailsFromMeta?.timeOfBirth ?? message.sender?.timeOfBirth,
    placeOfBirth: birthDetailsFromMeta?.placeOfBirth ?? message.sender?.placeOfBirth,
  };

  const hasBirthDetails =
    (showBirthDetailsProp !== false) &&
    isAstrologerViewingClient &&
    (birthDetails.dateOfBirth || birthDetails.timeOfBirth || birthDetails.placeOfBirth);

  // Check if message has file attachment
  const metadata = message.metadata as Record<string, unknown> | undefined;
  const hasFile = !!metadata?.fileUrl;
  const mimeType = typeof metadata?.mimeType === 'string' ? metadata.mimeType : '';
  const isImage = message.type === 'IMAGE' || mimeType.startsWith('image/');
  const fileUrl =
    hasFile && typeof metadata?.fileUrl === 'string' ? `${API_BASE_URL}${metadata.fileUrl}` : null;

  // Extract file metadata with proper type checking
  const fileName = typeof metadata?.fileName === 'string' ? metadata.fileName : 'File';
  const fileSize = typeof metadata?.fileSize === 'number' ? metadata.fileSize : null;

  // Check if message has question category (only for client messages)
  const questionCategoryId =
    typeof metadata?.questionCategory === 'string' ? metadata.questionCategory : undefined;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start items-end'} mb-1`}>
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8 flex-shrink-0 mr-2">
          {message.sender?.profilePhoto ? (
            <AvatarImage
              src={getImageUrl(message.sender.profilePhoto) || undefined}
              alt={message.sender.name || 'User'}
            />
          ) : null}
          <AvatarFallback className="font-bold bg-purple-600 text-white">
            {showClientIconFallback ? (
              <User className="h-4 w-4" />
            ) : (
              message.sender?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer for alignment when no avatar */}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Category Badge - Only show for client messages with category */}
        {isOwn && questionCategoryId && (
          <div className="mb-1">
            {(() => {
              const category = QUESTION_CATEGORIES.find((c) => c.id === questionCategoryId);
              if (!category) return null;
              return (
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 border-purple-200 text-purple-700"
                >
                  {category.emoji} {category.name}
                </Badge>
              );
            })()}
          </div>
        )}
        <div
          className={`rounded-2xl overflow-hidden ${
            hasFile && isImage ? 'p-1' : hasFile && !message.content?.trim() ? 'p-2' : 'px-4 py-2'
          } ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          {/* File Attachment */}
          {hasFile && (
            <div className={message.content?.trim() ? 'mb-2' : ''}>
              {isImage && fileUrl ? (
                // Image Preview
                <div className="relative group">
                  <Image
                    src={fileUrl}
                    alt={fileName}
                    width={300}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                    unoptimized
                  />
                  <a
                    href={fileUrl}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download image"
                  >
                    <Download className="h-4 w-4 text-white" />
                  </a>
                </div>
              ) : fileUrl ? (
                // Document/File Link
                <a
                  href={fileUrl}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isOwn
                      ? 'bg-indigo-700 hover:bg-indigo-800'
                      : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      isOwn ? 'bg-indigo-800' : 'bg-indigo-100'
                    }`}
                  >
                    <FileText
                      className={`h-5 w-5 ${isOwn ? 'text-white' : 'text-indigo-600'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isOwn ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {fileName}
                    </p>
                    <p
                      className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}
                    >
                      {fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : 'Download'}
                    </p>
                  </div>
                  <Download
                    className={`h-4 w-4 flex-shrink-0 ${
                      isOwn ? 'text-indigo-200' : 'text-gray-400'
                    }`}
                  />
                </a>
              ) : null}
            </div>
          )}

          {/* Message Text */}
          {message.content && message.content.trim() && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Birth Details - only for astrologers viewing client messages (English + Nepali DOB) */}
        {hasBirthDetails && (
          <ProfileBirthDetails
            birthDetails={birthDetails}
            variant={variant}
            nepaliBatch={nepaliBatch}
          />
        )}

        {showTimestamp && (
          <div
            className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(new Date(message.createdAt), {
                addSuffix: true,
              })}
            </span>
            {isOwn && (
              <span className="text-indigo-600">
                {message.isRead ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
