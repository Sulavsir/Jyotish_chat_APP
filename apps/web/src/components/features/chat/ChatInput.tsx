/**
 * ChatInput Component
 * Input area for typing and sending messages with file attachments
 */

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Send, Paperclip, X, FileText } from 'lucide-react';
import { Button } from '@jyotish/ui';
import { ChatInputProps, FileAttachment } from '@/types/chat';
import { CHAT_MESSAGE_MAX_LENGTH_CLIENT } from '@jyotish/shared';
import { FILE_UPLOAD } from '@/constants/file-upload.constants';
import { EmojiPicker } from '@/components/ui/EmojiPicker';
import { Tooltip } from '@/components/ui/Tooltip';
import { QuickPrompts, JYOTISH_QUICK_PROMPTS } from './QuickPrompts';
import { toast } from 'sonner';

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTyping,
  onFocus,
  disabled = false,
  placeholder = 'Type a message...',
  variant = 'default',
  initialValue = '',
  onChangeMessage,
  quickPrompts = [],
  maxMessageLength = CHAT_MESSAGE_MAX_LENGTH_CLIENT,
}) => {
  const isJyotish = variant === 'jyotish';
  const prompts: readonly string[] =
    quickPrompts.length > 0 ? quickPrompts : isJyotish ? JYOTISH_QUICK_PROMPTS : [];
  const [message, setMessage] = useState(initialValue);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Keep local state in sync when initialValue changes (e.g. switching chats, restoring drafts)
  useEffect(() => {
    setMessage(initialValue);
  }, [initialValue]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.slice(0, maxMessageLength);
    setMessage(value);
    onChangeMessage?.(value);

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
      onChangeMessage?.('');
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
    setMessage((prev) => (prev + emoji).slice(0, maxMessageLength));

    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleQuickPrompt = (text: string) => {
    if (disabled) return;
    onSendMessage(text);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-gray-200 bg-white p-4"
    >
      {prompts.length > 0 && (
        <QuickPrompts
          prompts={prompts}
          onSelect={handleQuickPrompt}
          disabled={disabled}
          variant={variant}
        />
      )}
      {attachment && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
          {/* Preview */}
          <div className="flex-shrink-0">
            {attachment.type === 'image' && attachment.preview ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
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
              <div className="w-16 h-16 rounded-lg flex items-center justify-center border bg-indigo-100 border-indigo-200">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-gray-900">
              {attachment.file.name}
            </p>
            <p className="text-xs text-gray-500">
              {(attachment.file.size / 1024).toFixed(1)} KB
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemoveAttachment}
            className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-red-600"
            aria-label="Remove attachment"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      <div className="flex items-center gap-2 min-h-[42px]">
        <Tooltip content="Attach files">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || !!attachment}
            className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md text-gray-600 hover:text-indigo-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Attach files"
          >
            <Paperclip className="h-5 w-5 shrink-0" />
          </button>
        </Tooltip>

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
            maxLength={maxMessageLength}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 pr-12 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto text-sm leading-relaxed min-h-[42px]"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
          </div>
        </div>

        <Button
          type="submit"
          disabled={(!message.trim() && !attachment) || disabled}
          className="flex-shrink-0 h-10 w-10 p-0 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
        <p className="text-xs text-gray-400">
          Press Enter to send, Shift + Enter for new line
        </p>
        <div className="flex items-center gap-2">
          {attachment && (
            <p className="text-xs text-gray-500">
              Max size: {FILE_UPLOAD.MAX_SIZE_LABEL}
            </p>
          )}
          {message.length > maxMessageLength * 0.8 && (
            <p
              className={`text-xs ${message.length >= maxMessageLength ? 'text-red-400' : 'text-gray-400'}`}
            >
              {message.length}/{maxMessageLength}
            </p>
          )}
        </div>
      </div>
    </form>
  );
};
