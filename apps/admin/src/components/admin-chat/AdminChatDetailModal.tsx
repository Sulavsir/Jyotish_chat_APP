/**
 * Admin Chat Detail Modal
 * View and respond to admin chat conversations
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, User, CheckCircle2, MessageSquare, Paperclip } from 'lucide-react';
import { Button, Input, Badge } from '@jyotish/ui';
import { adminApi, type AdminChat, type AdminChatMessage } from '@/lib/admin-api';
import { ADMIN_QUERY_KEYS } from '@/constants';
import { useAdminSocket } from '@/hooks';
import { toast } from 'sonner';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import { API_BASE_URL } from '@/constants/api.constants';

interface AdminChatDetailModalProps {
  chat: AdminChat | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminChatDetailModal({
  chat,
  isOpen,
  onClose,
}: AdminChatDetailModalProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { socket, isConnected } = useAdminSocket();

  // Fetch chat messages
  const { data: messagesData, refetch: refetchMessages } = useQuery({
    queryKey: chat?.id ? ADMIN_QUERY_KEYS.ADMIN_CHAT.MESSAGES(chat.id) : ['admin-chat', 'messages', 'disabled'],
    queryFn: () => {
      if (!chat?.id) return null;
      return adminApi.adminChat.getMessages(chat.id);
    },
    enabled: isOpen && !!chat?.id,
  });

  // Update messages from query
  useEffect(() => {
    if (messagesData?.messages) {
      setMessages(messagesData.messages);
    }
  }, [messagesData]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !isOpen || !chat?.id) return;

    const participantId = chat.user?.id || chat.userId || chat.astrologer?.id || chat.astrologerId || '';

    const handleMessage = (data: { message: AdminChatMessage; chat: AdminChat }) => {
      if (data.chat.id === chat.id) {
        setMessages((prev) => [...prev, data.message]);
        queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.ALL });
      }
    };

    const handleTyping = (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (!participantId || data.userId !== participantId) return;
      setIsTyping(data.isTyping);
    };

    const handleError = (data: { message: string }) => {
      toast.error(data.message || 'Admin chat error');
    };

    socket.emit(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.JOIN, { chatId: chat.id });

    socket.on(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.MESSAGE, handleMessage);
    socket.on(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.TYPING, handleTyping);
    socket.on(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.ERROR, handleError);
    // No need to refetch on join; initial query already loads messages

    return () => {
      socket.off(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.MESSAGE, handleMessage);
      socket.off(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.TYPING, handleTyping);
      socket.off(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.ERROR, handleError);
    };
  }, [socket, isConnected, isOpen, chat?.id, chat?.userId, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (chatId: string) => adminApi.adminChat.markAsRead(chatId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.UNREAD_COUNT() });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!chat) throw new Error('No chat selected');
      return adminApi.adminChat.sendMessage(chat.id, { content, type: 'TEXT' });
    },
    onSuccess: () => {
      setMessage('');
      refetchMessages();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'RESOLVED' | 'CLOSED') => {
      if (!chat) throw new Error('No chat selected');
      return adminApi.adminChat.updateStatus(chat.id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.ALL });
      toast.success('Chat status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update status');
    },
  });

  // Mark-as-read is handled server-side on `admin-chat:join`.

  const handleSendMessage = () => {
    if ((!message.trim() && !attachment) || !chat) return;

    // Prefer socket for real-time. Fall back to API only if socket is not connected.
    if (socket && isConnected) {
      // If attachment exists, upload first then send metadata via socket
      if (attachment) {
        setIsUploading(true);
        adminApi.adminChat
          .uploadFile(attachment)
          .then((file) => {
            socket.emit(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.SEND, {
              chatId: chat.id,
              content: message.trim(),
              type: file.type,
              metadata: {
                fileUrl: file.url,
                fileName: file.originalName,
                mimeType: file.mimeType,
                fileSize: file.size,
              },
            });
            setMessage('');
            setAttachment(null);
          })
          .catch((err: Error) => {
            toast.error(err.message || 'Failed to upload file');
          })
          .finally(() => setIsUploading(false));
        return;
      }

      socket.emit(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.SEND, {
        chatId: chat.id,
        content: message.trim(),
        type: 'TEXT',
      });
      setMessage('');
      return;
    }

    sendMessageMutation.mutate(message.trim());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    e.target.value = '';
  };

  const handleTypingStart = () => {
    if (!chat || !socket || !isConnected) return;
    socket.emit(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.TYPING, { chatId: chat.id, isTyping: true });
    setTimeout(() => {
      socket.emit(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.TYPING, { chatId: chat.id, isTyping: false });
    }, 3000);
  };

  if (!chat) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-4xl h-[80vh] bg-slate-900 rounded-xl shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <User className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">
                {chat.user?.name ||
                  chat.user?.phone ||
                  chat.astrologer?.name ||
                  chat.astrologer?.phone ||
                  'Unknown Participant'}
              </h3>
              <p className="text-xs text-white/80">
                {chat.user?.email ||
                  chat.user?.phone ||
                  chat.astrologer?.email ||
                  chat.astrologer?.phone ||
                  ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`${
                chat.status === 'ACTIVE'
                  ? 'bg-green-500/20 text-white border-green-500/50'
                  : chat.status === 'RESOLVED'
                    ? 'bg-blue-500/20 text-white border-blue-500/50'
                    : 'bg-slate-500/20 text-white border-slate-500/50'
              }`}
            >
              {chat.status}
            </Badge>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Actions */}
        <div className="p-3 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
          <span className="text-sm text-slate-400">Status:</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={chat.status === 'ACTIVE' ? 'default' : 'outline'}
              onClick={() => updateStatusMutation.mutate('ACTIVE')}
              disabled={updateStatusMutation.isPending}
              className="text-xs"
            >
              Active
            </Button>
            <Button
              size="sm"
              variant={chat.status === 'RESOLVED' ? 'default' : 'outline'}
              onClick={() => updateStatusMutation.mutate('RESOLVED')}
              disabled={updateStatusMutation.isPending}
              className="text-xs"
            >
              Resolved
            </Button>
            <Button
              size="sm"
              variant={chat.status === 'CLOSED' ? 'default' : 'outline'}
              onClick={() => updateStatusMutation.mutate('CLOSED')}
              disabled={updateStatusMutation.isPending}
              className="text-xs"
            >
              Closed
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-600" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderType === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 ${
                        msg.senderType === 'ADMIN'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-100'
                      }`}
                    >
                      {(() => {
                        const metadata = msg.metadata as any;
                        const hasFile = !!metadata?.fileUrl;
                        const fileUrl = hasFile ? `${API_BASE_URL}${metadata.fileUrl}` : null;
                        const isImage =
                          msg.type === 'IMAGE' || (metadata?.mimeType && String(metadata.mimeType).startsWith('image/'));

                        if (fileUrl && isImage) {
                          return (
                            <div className="space-y-2">
                              {msg.content ? <p className="text-sm">{msg.content}</p> : null}
                              <a href={fileUrl} target="_blank" rel="noreferrer">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={fileUrl}
                                  alt={metadata?.fileName || 'Image'}
                                  className="max-h-64 rounded-md border border-white/20"
                                />
                              </a>
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs underline opacity-90"
                              >
                                {metadata?.fileName || 'Open image'}
                              </a>
                            </div>
                          );
                        }

                        if (fileUrl) {
                          return (
                            <div className="space-y-2">
                              {msg.content ? <p className="text-sm">{msg.content}</p> : null}
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm underline"
                              >
                                {metadata?.fileName || 'Download file'}
                              </a>
                            </div>
                          );
                        }

                        return <p className="text-sm">{msg.content}</p>;
                      })()}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs opacity-70">
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        {msg.isRead && msg.senderType === 'ADMIN' && (
                          <CheckCircle2 className="h-3 w-3 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-lg px-4 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="border-slate-600 text-white"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTypingStart();
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className="flex-1 bg-slate-700 border-slate-600 text-white"
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && !attachment) || sendMessageMutation.isPending || isUploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {attachment && (
            <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
              <span className="truncate">Attached: {attachment.name}</span>
              <button
                type="button"
                className="text-slate-300 hover:text-white underline"
                onClick={() => setAttachment(null)}
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
