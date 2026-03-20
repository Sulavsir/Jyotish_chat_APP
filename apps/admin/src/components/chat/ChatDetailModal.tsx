'use client';

import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { ADMIN_QUERY_KEYS } from '@/constants';
import type { Chat, Message } from '@/types';
import { Button, Avatar, AvatarImage, AvatarFallback, Spinner } from '@jyotish/ui';
import { LoadingButton, ConfirmDialog } from '@/components/ui';
import {
  X,
  Download,
  FileText,
  Image as ImageIcon,
  Mic,
  Ban,
  Unlock,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ChatDetailModalProps {
  chat: Chat | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatDetailModal({ chat, isOpen, onClose }: ChatDetailModalProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [showReopenConfirm, setShowReopenConfirm] = useState(false);
  const [abandonReason, setAbandonReason] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // TanStack Query mutation for abandoning chat
  const abandonChatMutation = useMutation({
    mutationFn: async (data: { chatId: string; reason?: string }) => {
      return await adminApi.chats.abandon(data.chatId, data.reason);
    },
    onSuccess: () => {
      toast.success('Chat abandoned successfully. Both parties have been notified.');
      // Invalidate and refetch chat list
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      setShowAbandonConfirm(false);
      setAbandonReason('');
      onClose(); // Close modal after abandoning
    },
    onError: (error: any) => {
      console.error('Failed to abandon chat:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to abandon chat');
    },
  });

  // TanStack Query mutation for unblocking chat
  const unblockChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return await adminApi.chats.unblock(chatId);
    },
    onSuccess: () => {
      toast.success('Chat unblocked successfully. Both parties can now resume conversation.');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      setShowUnblockConfirm(false);
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to unblock chat:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to unblock chat');
    },
  });

  // TanStack Query mutation for reopening chat (ended/locked)
  const reopenChatMutation = useMutation({
    mutationFn: async (chatId: string) => {
      return await adminApi.chats.reopen(chatId);
    },
    onSuccess: () => {
      toast.success('Chat reopened successfully. Both parties can now send messages.');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      setShowReopenConfirm(false);
      onClose();
    },
    onError: (error: any) => {
      console.error('Failed to reopen chat:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to reopen chat');
    },
  });

  useEffect(() => {
    if (isOpen && chat) {
      loadMessages(1);
    } else {
      // Reset state when modal closes
      setMessages([]);
      setPage(1);
      setHasMore(true);
    }
  }, [isOpen, chat]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages.length]);

  const loadMessages = async (pageNum: number) => {
    if (!chat) return;

    try {
      pageNum === 1 ? setLoading(true) : setLoadingMore(true);

      const response: any = await adminApi.chats.getMessages(chat.id, {
        page: pageNum,
        limit: 50,
      });

      const newMessages = response?.messages || [];
      const pagination = response?.pagination;

      if (pageNum === 1) {
        setMessages(newMessages);
      } else {
        setMessages((prev) => [...prev, ...newMessages]);
      }

      setPage(pageNum);
      setHasMore(pagination ? pageNum < pagination.totalPages : false);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadMessages(page + 1);
    }
  };

  const handleAbandonChat = () => {
    if (!chat || abandonChatMutation.isPending) return;
    abandonChatMutation.mutate({ chatId: chat.id, reason: abandonReason || undefined });
  };

  const handleUnblockChat = () => {
    if (!chat || unblockChatMutation.isPending) return;
    unblockChatMutation.mutate(chat.id);
  };

  const handleReopenChat = () => {
    if (!chat || reopenChatMutation.isPending) return;
    reopenChatMutation.mutate(chat.id);
  };

  const getImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${url}`;
  };

  const isImageUrl = (url: string) => {
    if (!url) return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    return imageExtensions.test(url) || url.includes('/uploads/chat/images/');
  };

  const renderMessageContent = (message: Message) => {
    // Get file URL from metadata first, fallback to content
    const metadata = message.metadata as any;
    const fileUrl = metadata?.fileUrl || message.content;

    // Check if content is an image URL (even if type is TEXT)
    if (message.content && isImageUrl(message.content)) {
      return (
        <div className="mt-2">
          <img
            src={getImageUrl(message.content) || ''}
            alt="Image"
            className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(getImageUrl(message.content) || '', '_blank')}
          />
        </div>
      );
    }

    switch (message.type) {
      case 'IMAGE':
        return (
          <div className="mt-2">
            {fileUrl ? (
              <img
                src={getImageUrl(fileUrl) || ''}
                alt="Attachment"
                className="max-w-sm rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(getImageUrl(fileUrl) || '', '_blank')}
              />
            ) : (
              <p className="text-sm text-slate-400 italic">Image not available</p>
            )}
          </div>
        );

      case 'FILE':
        const fileName = metadata?.fileName || 'File';
        const fileSize = metadata?.fileSize ? `${(metadata.fileSize / 1024).toFixed(2)} KB` : '';
        return (
          <div className="mt-2 flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <FileText className="w-8 h-8 text-purple-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{fileName}</p>
              {fileSize && <p className="text-xs text-slate-400">{fileSize}</p>}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => window.open(getImageUrl(fileUrl) || '', '_blank')}
              className="flex-shrink-0"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        );

      case 'AUDIO':
        return (
          <div className="mt-2 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-purple-400" />
              <audio
                controls
                src={getImageUrl(fileUrl) || ''}
                className="flex-1 h-8"
                style={{ maxWidth: '300px' }}
              />
            </div>
          </div>
        );

      case 'TEXT':
      default:
        return message.content ? (
          <p className="text-sm text-slate-200 whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : null;
    }
  };

  const getSenderName = (message: Message) => {
    if (!chat) return 'Unknown';

    if (message.senderType === 'CLIENT') {
      return chat.clientParticipant?.name || 'Client';
    } else {
      return chat.astrologerParticipant?.name || 'Astrologer';
    }
  };

  const getSenderAvatar = (message: Message) => {
    if (!chat) return null;

    if (message.senderType === 'CLIENT') {
      return chat.clientParticipant?.profilePhoto || null;
    } else {
      return chat.astrologerParticipant?.profilePhoto || null;
    }
  };

  if (!chat || !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 z-50 animate-in fade-in duration-200 rounded-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-800 rounded-lg shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">Chat Conversation</h2>
              <p className="text-sm text-slate-400 mt-1">
                {chat.clientParticipant?.name || 'Unknown User'} ↔{' '}
                {chat.astrologerParticipant?.name}
              </p>
              {chat.isAbandonedByAdmin && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    <Ban className="h-3 w-3" />
                    Abandoned by Admin
                  </span>
                  {chat.abandonReason && (
                    <span className="text-xs text-slate-400">Reason: {chat.abandonReason}</span>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {chat.isAbandonedByAdmin ? (
                <LoadingButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnblockConfirm(true)}
                  className="flex items-center gap-2 text-white"
                >
                  <Unlock className="h-4 w-4" />
                  Unblock Chat
                </LoadingButton>
              ) : (
                <>
                  {(chat.status === 'ENDED' || chat.isLocked) && (
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReopenConfirm(true)}
                      isLoading={reopenChatMutation.isPending}
                      className="flex items-center gap-2 text-green-200 border-green-500/30"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reopen Chat
                    </LoadingButton>
                  )}
                  <LoadingButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAbandonConfirm(true)}
                    isLoading={abandonChatMutation.isPending}
                    className="flex items-center gap-2 text-red-200 border-red-500/30"
                  >
                    <Ban className="h-4 w-4" />
                    Abandon Conversation
                  </LoadingButton>
                </>
              )}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 ml-4">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages Content */}
        <div className="overflow-y-auto space-y-4 p-6 max-h-[calc(85vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner className="w-8 h-8" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p>No messages in this conversation yet</p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const senderName = getSenderName(message);
                const senderAvatar = getSenderAvatar(message);
                const isClient = message.senderType === 'CLIENT';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isClient ? 'flex-row' : 'flex-row-reverse'}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      {senderAvatar ? (
                        <AvatarImage
                          src={getImageUrl(senderAvatar) || undefined}
                          alt={senderName}
                        />
                      ) : null}
                      <AvatarFallback
                        className={`font-bold ${isClient ? 'bg-blue-600' : 'bg-purple-600'} text-white`}
                      >
                        {senderName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className={`flex flex-col ${isClient ? 'items-start' : 'items-end'} flex-1`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-slate-300">{senderName}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div
                        className={`rounded-lg p-3 max-w-lg ${
                          isClient
                            ? 'bg-blue-600/20 border border-blue-500/30'
                            : 'bg-purple-600/20 border border-purple-500/30'
                        }`}
                      >
                        {renderMessageContent(message)}

                        {message.isDeleted && (
                          <p className="text-xs text-slate-500 italic mt-1">
                            This message was deleted
                          </p>
                        )}
                      </div>

                      {(message.type !== 'TEXT' || isImageUrl(message.content || '')) && (
                        <div className="flex items-center gap-1 mt-1">
                          {(message.type === 'IMAGE' || isImageUrl(message.content || '')) && (
                            <ImageIcon className="w-3 h-3 text-slate-500" />
                          )}
                          {message.type === 'FILE' && (
                            <FileText className="w-3 h-3 text-slate-500" />
                          )}
                          {message.type === 'AUDIO' && <Mic className="w-3 h-3 text-slate-500" />}
                          <span className="text-xs text-slate-500 capitalize">
                            {isImageUrl(message.content || '') ? 'IMAGE' : message.type}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />

              {hasMore && (
                <div className="flex justify-center py-4">
                  <LoadingButton
                    variant="outline"
                    onClick={handleLoadMore}
                    isLoading={loadingMore}
                    loadingText="Loading..."
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    Load More Messages
                  </LoadingButton>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-slate-800">
          <div className="text-sm text-slate-400">
            <span className="font-medium">{messages.length}</span> messages loaded
            {chat._count?.messages && chat._count.messages > messages.length && (
              <span> • {chat._count.messages - messages.length} more available</span>
            )}
          </div>
          <div className="flex gap-2">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                chat.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}
            >
              {chat.status}
            </span>
          </div>
        </div>
      </div>

      {/* Abandon Confirmation Dialog */}
      {showAbandonConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/90 z-[60] animate-in fade-in duration-200"
            onClick={() => setShowAbandonConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-full max-w-md bg-slate-900 border border-slate-800 rounded-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20">
                  <Ban className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Abandon Conversation</h3>
                  <p className="text-sm text-slate-400">This action will block both parties</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-4">
                Both the client and astrologer will be unable to send messages. They will see a
                message stating they don't have authority to continue the conversation.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={abandonReason}
                  onChange={(e) => setAbandonReason(e.target.value)}
                  placeholder="Enter reason for abandoning this conversation..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <LoadingButton
                  variant="outline"
                  onClick={() => {
                    setShowAbandonConfirm(false);
                    setAbandonReason('');
                  }}
                  className="flex-1"
                  isLoading={abandonChatMutation.isPending}
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  onClick={handleAbandonChat}
                  isLoading={abandonChatMutation.isPending}
                  loadingText="Abandoning..."
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Abandon Chat
                </LoadingButton>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Unblock Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showUnblockConfirm}
        onClose={() => setShowUnblockConfirm(false)}
        onConfirm={handleUnblockChat}
        title="Unblock Conversation"
        description="Are you sure you want to unblock this conversation?"
        confirmText="Yes, Unblock"
        cancelText="Cancel"
        isDestructive={false}
        isLoading={unblockChatMutation.isPending}
        icon={<Unlock className="w-6 h-6 text-green-400" />}
      >
        <p className="text-sm text-slate-300 mb-2">
          Both the client and astrologer will be able to send messages again. They will be notified
          that the conversation has been reopened.
        </p>
      </ConfirmDialog>

      {/* Reopen Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showReopenConfirm}
        onClose={() => setShowReopenConfirm(false)}
        onConfirm={handleReopenChat}
        title="Reopen Conversation"
        description="Are you sure you want to reopen this conversation?"
        confirmText="Yes, Reopen"
        cancelText="Cancel"
        isDestructive={false}
        isLoading={reopenChatMutation.isPending}
        icon={<RotateCcw className="w-6 h-6 text-green-400" />}
      >
        <p className="text-sm text-slate-300 mb-2">
          Both the client and astrologer will be able to send messages again. They will receive a
          real-time notification that the conversation has been reopened.
        </p>
      </ConfirmDialog>
    </>
  );
}
