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
}) => {
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
    <form onSubmit={handleSubmit} className="border-t border-gray-200 bg-white p-4">
      {/* Attachment Preview */}
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
              <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center border border-indigo-200">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
            )}
          </div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{attachment.file.name}</p>
            <p className="text-xs text-gray-500">{(attachment.file.size / 1024).toFixed(1)} KB</p>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={handleRemoveAttachment}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || !!attachment}
          className="flex-shrink-0 p-2.5 text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed mb-px"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none rounded-lg border border-gray-300 px-4 py-2.5 pr-12 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-gray-50 disabled:cursor-not-allowed max-h-32 overflow-y-auto text-sm leading-relaxed"
          />

          {/* Emoji picker */}
          <div className="absolute right-3 bottom-2.5">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled} />
          </div>
        </div>

        {/* Send button */}
        <Button
          type="submit"
          disabled={(!message.trim() && !attachment) || disabled}
          className="flex-shrink-0 p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors mb-px"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={FILE_UPLOAD.ACCEPT_STRING}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Helper text */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400">Press Enter to send, Shift + Enter for new line</p>
        {attachment && (
          <p className="text-xs text-gray-500">Max size: {FILE_UPLOAD.MAX_SIZE_LABEL}</p>
        )}
      </div>
    </form>
  );
};
