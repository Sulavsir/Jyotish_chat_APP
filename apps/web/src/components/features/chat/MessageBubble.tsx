/**
 * MessageBubble Component
 * Displays a single chat message with support for text and file attachments
 */

import React from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarImage, AvatarFallback } from '@jyotish/ui';
import { CheckCheck, Check, FileText, Download } from 'lucide-react';
import { MessageBubbleProps } from '@/types/chat';
import { getImageUrl } from '@/utils/image.utils';
import { API_BASE_URL } from '@/constants';

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar = true,
  showTimestamp = true,
}) => {
  // Check if message has file attachment
  const metadata = message.metadata as any;
  const hasFile = metadata?.fileUrl;
  const isImage = message.type === 'IMAGE' || metadata?.mimeType?.startsWith('image/');
  const fileUrl = hasFile ? `${API_BASE_URL}${metadata.fileUrl}` : null;

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
            {message.sender?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Spacer for alignment when no avatar */}
      {!isOwn && !showAvatar && <div className="w-8 mr-2 flex-shrink-0" />}

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
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
              {isImage ? (
                // Image Preview
                <div className="relative group">
                  <Image
                    src={fileUrl!}
                    alt={metadata.fileName || 'Image'}
                    width={300}
                    height={200}
                    className="rounded-lg max-w-full h-auto"
                    unoptimized
                  />
                  <a
                    href={fileUrl!}
                    download={metadata.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download image"
                  >
                    <Download className="h-4 w-4 text-white" />
                  </a>
                </div>
              ) : (
                // Document/File Link
                <a
                  href={fileUrl!}
                  download={metadata.fileName}
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
                    <FileText className={`h-5 w-5 ${isOwn ? 'text-white' : 'text-indigo-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-gray-900'}`}
                    >
                      {metadata.fileName || 'File'}
                    </p>
                    <p className={`text-xs ${isOwn ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {metadata.fileSize
                        ? `${(metadata.fileSize / 1024).toFixed(1)} KB`
                        : 'Download'}
                    </p>
                  </div>
                  <Download
                    className={`h-4 w-4 flex-shrink-0 ${isOwn ? 'text-indigo-200' : 'text-gray-400'}`}
                  />
                </a>
              )}
            </div>
          )}

          {/* Message Text */}
          {message.content && message.content.trim() && (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

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
