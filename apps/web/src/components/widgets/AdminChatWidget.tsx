/**
 * Admin Chat Widget
 * Floating chat widget with predefined Q&A and admin chat
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MessageCircle, X, Send, HelpCircle, MessageSquare, Paperclip } from 'lucide-react';
import { Button, Input, Badge } from '@jyotish/ui';
import { adminChatService, type AdminChat, type AdminChatMessage } from '@/services/adminChat.service';
import { CLIENT_FAQS, ADMIN_FAQS, CLIENT_FAQ_CATEGORIES, ADMIN_FAQ_CATEGORIES, type FAQItem } from '@/constants/adminChat.constants';
import { useSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/auth-store';
import { UserRole } from '@/types/user.types';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/constants';

type ViewMode = 'faq' | 'chat';

const ACTIVE_CHAT_STORAGE_KEY = 'admin_chat_active_chat';
const SESSION_MESSAGE_TTL_MS = 30 * 60 * 1000; // 30 minutes of inactivity
const MAX_SESSION_MESSAGES = 15;

function getMessagesStorageKey(chatId: string) {
  return `admin_chat_messages:${chatId}`;
}

function getLastActivityStorageKey(chatId: string) {
  return `admin_chat_last_activity:${chatId}`;
}

export function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('faq');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [message, setMessage] = useState('');
  const [activeChat, setActiveChat] = useState<AdminChat | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket, isConnected } = useSocket();
  const user = useAuthStore((state) => state.user);

  // Clear any persisted chat when user logs out (prevents stale chat IDs across sessions)
  useEffect(() => {
    if (user) return;
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    setActiveChat(null);
    setMessages([]);
  }, [user]);

  // Get FAQs and categories based on user role - no FAQ for astrologers
  const faqs: FAQItem[] = user?.role === UserRole.ADMIN ? ADMIN_FAQS : user?.role === UserRole.ASTROLOGER ? [] : CLIENT_FAQS;
  const faqCategories = user?.role === UserRole.ADMIN ? ADMIN_FAQ_CATEGORIES : user?.role === UserRole.ASTROLOGER ? [] : CLIENT_FAQ_CATEGORIES;
  const showFAQ = user?.role !== UserRole.ASTROLOGER; // Hide FAQ for astrologers

  // Load active chat from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!user) {
        sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
        return;
      }
      const storedChat = sessionStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
      if (storedChat) {
        try {
          const parsedChat = JSON.parse(storedChat) as AdminChat;
          setActiveChat(parsedChat);
          // Auto-switch to chat view if active chat exists
          setViewMode('chat');
        } catch (error) {
          console.error('Error parsing stored chat:', error);
          sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
        }
      }
      // For astrologers, always start in chat mode
      if (user?.role === UserRole.ASTROLOGER) {
        setViewMode('chat');
      }
    }
  }, [user?.role]);

  // Load chat + message history from API (DB-backed), so history persists across logouts/sessions.
  useEffect(() => {
    if (!isOpen) return;
    if (!user) return;
    if (!activeChat?.id) return;

    let cancelled = false;
    const chatId = activeChat.id;

    (async () => {
      try {
        const [{ chat }, msgs] = await Promise.all([
          adminChatService.getChatById(chatId),
          adminChatService.getChatMessages(chatId, { page: 1, limit: MAX_SESSION_MESSAGES }),
        ]);
        if (cancelled) return;
        setActiveChat(chat);
        setMessages(msgs.messages.slice(-MAX_SESSION_MESSAGES));
        // Mark as read so unread badges stay correct
        await adminChatService.markAsRead(chatId);
      } catch (err) {
        if (cancelled) return;
        // Stale or invalid chat ID (e.g., after logout/login) → clear local state
        sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
        setActiveChat(null);
        setMessages([]);
        toast.error(err instanceof Error ? err.message : 'Chat not found');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, user, activeChat?.id]);

  // Save active chat to sessionStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (activeChat) {
        sessionStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, JSON.stringify(activeChat));
      } else {
        sessionStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
      }
    }
  }, [activeChat]);

  // Load cached messages for this chat (session persistence with inactivity TTL)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!activeChat?.id) return;

    const chatId = activeChat.id;
    const lastActivityRaw = sessionStorage.getItem(getLastActivityStorageKey(chatId));
    const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : 0;

    // Clear stale cache on inactivity
    if (lastActivity && Date.now() - lastActivity > SESSION_MESSAGE_TTL_MS) {
      sessionStorage.removeItem(getMessagesStorageKey(chatId));
      sessionStorage.removeItem(getLastActivityStorageKey(chatId));
      setMessages([]);
      return;
    }

    const cached = sessionStorage.getItem(getMessagesStorageKey(chatId));
    if (!cached) return;
    try {
      const parsed = JSON.parse(cached) as AdminChatMessage[];
      setMessages(parsed.slice(-MAX_SESSION_MESSAGES));
    } catch {
      sessionStorage.removeItem(getMessagesStorageKey(chatId));
    }
  }, [activeChat?.id]);

  // Persist messages + update activity timestamp (only client-side cache)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!activeChat?.id) return;
    const trimmed = messages.slice(-MAX_SESSION_MESSAGES);
    sessionStorage.setItem(getMessagesStorageKey(activeChat.id), JSON.stringify(trimmed));
    // only update activity when we actually have messages
    if (trimmed.length > 0) {
      sessionStorage.setItem(getLastActivityStorageKey(activeChat.id), String(Date.now()));
    }
  }, [messages, activeChat?.id]);

  // We still keep a light session cache for snappy UX, but the source of truth is the API (database).

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected || !isOpen || !activeChat?.id) return;

    const handleMessage = (data: { message: AdminChatMessage; chat: AdminChat }) => {
      if (data.chat.id === activeChat.id) {
        setMessages((prev) => [...prev, data.message].slice(-MAX_SESSION_MESSAGES));
        setActiveChat(data.chat);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(getLastActivityStorageKey(activeChat.id), String(Date.now()));
        }
        // No need to invalidate queries - we don't fetch chats via API
      }
    };

    const handleTyping = (data: { userId: string; userName: string; isTyping: boolean }) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping);
      }
    };

    const handleJoined = (data: { chatId: string }) => {
      if (data.chatId === activeChat.id) {
        // Messages are received via socket, no need to refetch
      }
    };

    const handleError = (data: { message: string }) => {
      toast.error(data.message || 'Support chat error');
    };

    socket.emit('admin-chat:join', { chatId: activeChat.id });

    socket.on('admin-chat:message', handleMessage);
    socket.on('admin-chat:typing', handleTyping);
    socket.on('admin-chat:joined', handleJoined);
    socket.on('admin-chat:error', handleError);

    return () => {
      socket.off('admin-chat:message', handleMessage);
      socket.off('admin-chat:typing', handleTyping);
      socket.off('admin-chat:joined', handleJoined);
      socket.off('admin-chat:error', handleError);
    };
  }, [socket, isConnected, isOpen, activeChat?.id, user?.id]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create chat mutation - only called when user sends first message
  // If active chat exists, reuse it instead of creating new one
  const createChatMutation = useMutation({
    mutationFn: async (initialMessage: string) => {
      // If we already have an active chat, just send the message
      if (activeChat) {
        // Prefer socket to avoid duplicating messages (socket is the source of truth for real-time)
        if (socket && isConnected) {
          socket.emit('admin-chat:send', {
            chatId: activeChat.id,
            content: initialMessage,
            type: 'TEXT',
          });
          return { chat: activeChat };
        }

        // Fallback to API only when socket is not connected
        return adminChatService
          .sendMessage({
            chatId: activeChat.id,
            content: initialMessage,
            type: 'TEXT',
          })
          .then(() => ({ chat: activeChat }));
      }
      // Otherwise create new chat
      return adminChatService.createChat({ initialMessage });
    },
    onSuccess: (data) => {
      if (data.chat) {
        setActiveChat(data.chat);
        setViewMode('chat');
        setMessages([]); // Start with empty messages - only receive via socket
        if (socket && isConnected) {
          socket.emit('admin-chat:join', { chatId: data.chat.id });
        }
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start chat');
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => {
      if (!activeChat) throw new Error('No active chat');
      return adminChatService.sendMessage({
        chatId: activeChat.id,
        content,
        type: 'TEXT',
      });
    },
    onSuccess: () => {
      setMessage('');
      // Messages will be received via socket, no need to refetch
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send message');
    },
  });


  const handleStartChat = () => {
    if (!message.trim()) {
      toast.error('Please enter a message to start the chat');
      return;
    }
    if (activeChat?.id && typeof window !== 'undefined') {
      sessionStorage.setItem(getLastActivityStorageKey(activeChat.id), String(Date.now()));
    }
    createChatMutation.mutate(message.trim());
  };

  const handleSendMessage = () => {
    if ((!message.trim() && !attachment) || !activeChat) return;
    // Prefer socket to avoid duplicate messages. Fall back to API only if socket is not connected.
    if (socket && isConnected) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(getLastActivityStorageKey(activeChat.id), String(Date.now()));
      }
      if (attachment) {
        setIsUploading(true);
        adminChatService
          .uploadFile(attachment)
          .then((file) => {
            socket.emit('admin-chat:send', {
              chatId: activeChat.id,
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
          .catch((err: Error) => toast.error(err.message || 'Failed to upload file'))
          .finally(() => setIsUploading(false));
        return;
      }

      socket.emit('admin-chat:send', {
        chatId: activeChat.id,
        content: message.trim(),
        type: 'TEXT',
      });
      setMessage('');
      return;
    }

    if (attachment) {
      toast.error('File upload requires an active socket connection.');
      return;
    }
    // REST fallback: optimistically add the message to local session
    const content = message.trim();
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        chatId: activeChat.id,
        senderId: user?.id || '',
        senderType: 'USER',
        content,
        type: 'TEXT',
        metadata: null,
        isRead: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
    setMessage('');
    sendMessageMutation.mutate(content);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    e.target.value = '';
  };

  const handleTypingStart = () => {
    if (!activeChat || !socket || !isConnected) return;
    socket.emit('admin-chat:typing', { chatId: activeChat.id, isTyping: true });
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('admin-chat:typing', { chatId: activeChat.id, isTyping: false });
    }, 3000);
  };

  const handleQuestionClick = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleUseQuestion = (faq: FAQItem) => {
    setMessage(faq.question);
    setViewMode('chat');
    if (!activeChat) {
      createChatMutation.mutate(faq.question);
    } else {
      handleSendMessage();
    }
  };

  const filteredFAQs = selectedCategory === 'All'
    ? faqs
    : faqs.filter((faq) => faq.category === selectedCategory);

  // Marking as read is handled server-side on `admin-chat:join`.

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
        aria-label="Open support chat"
      >
        <MessageCircle className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
        {activeChat && !activeChat.userRead && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md h-[600px] bg-white rounded-t-2xl shadow-2xl flex flex-col pointer-events-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <h3 className="font-semibold">Support</h3>
              </div>
              <div className="flex items-center gap-2">
                {viewMode === 'chat' && activeChat && (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    {activeChat.adminId ? 'Admin Online' : 'Waiting for admin'}
                  </Badge>
                )}
                <button
                  onClick={() => {
                    // Don't clear messages on close; keep session cache
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Tabs - only show if FAQ is available (not for jyotish) */}
            {showFAQ && (
              <div className="flex border-b bg-gray-50">
                <button
                  onClick={() => setViewMode('faq')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'faq'
                      ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <HelpCircle className="h-4 w-4 inline mr-2" />
                  FAQ
                </button>
                <button
                  onClick={() => setViewMode('chat')}
                  className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'chat'
                      ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  Chat with Admin
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {showFAQ && viewMode === 'faq' ? (
                <div className="h-full flex flex-col">
                  {/* Category Filter */}
                  <div className="p-3 border-b bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto">
                      {faqCategories.map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                            selectedCategory === category
                              ? 'bg-purple-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FAQ List */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="p-4 space-y-3">
                      {filteredFAQs.map((faq, index) => {
                        const isExpanded = expandedFAQ === index;
                        return (
                          <div
                            key={index}
                            className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                          >
                            <div
                              className="cursor-pointer"
                              onClick={() => handleQuestionClick(index)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-semibold text-gray-900 flex-1">{faq.question}</h4>
                                <span className="text-xs text-gray-500 mt-1">
                                  {isExpanded ? 'Show Less' : 'Show More'}
                                </span>
                              </div>
                            </div>
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-sm text-gray-600 mb-3">{faq.answer}</p>
                                <Button
                                  size="sm"
                                  onClick={() => handleUseQuestion(faq)}
                                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs"
                                >
                                  Use this question
                                </Button>
                              </div>
                            )}
                            {!isExpanded && (
                              <p className="text-sm text-gray-600 line-clamp-2 mt-2">{faq.answer}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
                    <div className="space-y-4">
                      {messages.length === 0 && !activeChat ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm">Start a conversation with our support team</p>
                        </div>
                      ) : (
                        <>
                          {messages.map((msg) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.senderType === 'USER' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                  msg.senderType === 'USER'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-200 text-gray-900'
                                }`}
                              >
                                {(() => {
                                  const metadata = msg.metadata as any;
                                  const hasFile = !!metadata?.fileUrl;
                                  const fileUrl = hasFile ? `${API_BASE_URL}${metadata.fileUrl}` : null;
                                  const isImage =
                                    msg.type === 'IMAGE' ||
                                    (metadata?.mimeType && String(metadata.mimeType).startsWith('image/'));

                                  if (fileUrl && isImage) {
                                    return (
                                      <div className="space-y-2">
                                        {msg.content ? <p className="text-sm">{msg.content}</p> : null}
                                        <a href={fileUrl} target="_blank" rel="noreferrer">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={fileUrl}
                                            alt={metadata?.fileName || 'Image'}
                                            className="max-h-64 rounded-md border border-black/10"
                                          />
                                        </a>
                                        <a
                                          href={fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-xs underline opacity-80"
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
                                <p className="text-xs mt-1 opacity-70">
                                  {new Date(msg.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          ))}
                          {isTyping && (
                            <div className="flex justify-start">
                              <div className="bg-gray-200 rounded-lg px-4 py-2">
                                <div className="flex gap-1">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
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
                  <div className="p-4 border-t bg-gray-50">
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    {!activeChat ? (
                      <div className="flex gap-2">
                        <Input
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleStartChat();
                            }
                          }}
                          placeholder="Type your message to start chat..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleStartChat}
                          disabled={!message.trim() || createChatMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="border-gray-300"
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
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={(!message.trim() && !attachment) || sendMessageMutation.isPending || isUploading}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {attachment && (
                      <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                        <span className="truncate">Attached: {attachment.name}</span>
                        <button
                          type="button"
                          className="text-gray-700 hover:text-gray-900 underline"
                          onClick={() => setAttachment(null)}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
