/**
 * ChatInput Component
 * Input area for typing and sending messages with file attachments
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { Button } from '@jyotish/ui';
import { ChatInputProps, FileAttachment } from '@/types/chat';
import { FILE_UPLOAD } from '@/constants/file-upload.constants';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { toast } from 'sonner';

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  onFocus,
  disabled = false,
  placeholder = 'Type a message...',
  variant = 'default',
}) => {
  const isJyotish = variant === 'jyotish';
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > FILE_UPLOAD.MAX_SIZE) {
      toast.error(`File size must be less than ${FILE_UPLOAD.MAX_SIZE_LABEL}`);
      return;
    }

    // Validate file type
    if (!Object.keys(FILE_UPLOAD.ALLOWED_TYPES).includes(file.type)) {
      toast.error(`File type not supported. Allowed: ${FILE_UPLOAD.ALLOWED_TYPES_LABEL}`);
      return;
    }

    // Determine file type category
    let fileType: 'image' | 'document' | 'file' = 'file';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (
      file.type.includes('pdf') ||
      file.type.includes('document') ||
      file.type.includes('msword')
    ) {
      fileType = 'document';
    }

    // Create preview for images
    let preview: string | undefined;
    if (fileType === 'image') {
      preview = URL.createObjectURL(file);
    }

    setAttachment({ file, preview, type: fileType });

    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = () => {
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = message.trim();

    // Must have either message or attachment
    if ((trimmedMessage || attachment) && !disabled) {
      // If only attachment, send empty message (the UI will show the file)
      onSendMessage(trimmedMessage || '', attachment || undefined);
      setMessage('');
      setIsTyping(false);
      onTyping?.(false);

      // Clean up attachment
      if (attachment) {
        handleRemoveAttachment();
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  // Cleanup preview on unmount
  useEffect(() => {
    return () => {
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
    };
  }, [attachment]);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFocus = () => {
    onFocus?.();
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);

    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isJyotish
          ? 'border-t border-white/[0.06] bg-white/[0.03] p-4'
          : 'border-t border-gray-200 bg-white p-4'
      }
    >
      {attachment && (
        <div
          className={
            isJyotish
              ? 'mb-3 flex items-center gap-3 p-3 bg-white/[0.06] rounded-xl border border-white/[0.08]'
              : 'mb-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200'
          }
        >
          {/* Preview */}
          <div className="flex-shrink-0">
            {attachment.type === 'image' && attachment.preview ? (
              <div
                className={`w-16 h-16 rounded-lg overflow-hidden border ${
                  isJyotish ? 'border-white/[0.1]' : 'border-gray-300'
                }`}
              >
                <Image
                  src={attachment.preview}
                  alt="Preview"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className={`w-16 h-16 rounded-lg flex items-center justify-center border ${
                  isJyotish ? 'bg-amber-500/20 border-amber-500/30' : 'bg-indigo-100 border-indigo-200'
                }`}
              >
                <FileText className={`h-8 w-8 ${isJyotish ? 'text-amber-400' : 'text-indigo-600'}`} />
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isJyotish ? 'text-[#fafaf9]' : 'text-gray-900'}`}>
              {attachment.file.name}
            </p>
            <p className={`text-xs ${isJyotish ? 'text-[#78716c]' : 'text-gray-500'}`}>
              {(attachment.file.size / 1024).toFixed(1)} KB
            </p>
          </div>

          <button
            type="button"
            onClick={handleRemoveAttachment}
            className={`flex-shrink-0 p-1 transition-colors rounded ${
              isJyotish ? 'text-[#78716c] hover:text-red-400' : 'text-gray-400 hover:text-red-600'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 min-h-[42px]">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || !!attachment}
          className={
            isJyotish
              ? 'flex-shrink-0 h-10 w-10 flex items-center justify-center text-[#78716c] hover:text-amber-400 rounded-lg hover:bg-white/[0.06] disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              : 'flex-shrink-0 h-10 w-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          }
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="flex-1 relative flex items-center min-h-[42px]">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={
              isJyotish
                ? 'w-full resize-none rounded-xl border border-white/[0.08] px-4 py-2.5 pr-12 bg-white/[0.04] text-[#fafaf9] placeholder:text-[#78716c] focus:border-amber-500/40 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto text-sm leading-relaxed min-h-[42px]'
                : 'w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 pr-12 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto text-sm leading-relaxed min-h-[42px]'
            }
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
          </div>
        </div>

        <Button
          type="submit"
          disabled={(!message.trim() && !attachment) || disabled}
          className={
            isJyotish
              ? 'flex-shrink-0 h-10 w-10 p-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#0f0e14] disabled:bg-white/10 disabled:text-[#78716c] disabled:cursor-not-allowed transition-colors flex items-center justify-center'
              : 'flex-shrink-0 h-10 w-10 p-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center'
          }
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_UPLOAD.ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between mt-2">
        <p className={`text-xs ${isJyotish ? 'text-[#78716c]' : 'text-gray-400'}`}>
          Press Enter to send, Shift + Enter for new line
        </p>
        {attachment && (
          <p className={`text-xs ${isJyotish ? 'text-[#78716c]' : 'text-gray-500'}`}>
            Max size: {FILE_UPLOAD.MAX_SIZE_LABEL}
          </p>
        )}
      </div>
    </form>
  );
};
