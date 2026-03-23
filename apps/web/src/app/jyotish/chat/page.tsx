/**
 * Jyotish Chat Page - Chat interface for astrologers
 */

'use client';

import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES, ROUTE_BUILDERS } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LoadingScreenWithBackground } from '@/components/ui';
import { ChatList, ChatWindow } from '@/components/features/chat';
import { useSocket } from '@/hooks/useSocket';
import { useStore } from '@/store';
import chatService from '@/services/chat.service';
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import { Chat, Message, FileAttachment } from '@/types/chat';

export default function JyotishChatPage() {
  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams?.get('chatId');

  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });

  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalChats, setTotalChats] = useState(0);
  const initializedRef = useRef(false);
  const currentOtherUserId = useRef<string | null>(null);
  const [chatDrafts, setChatDrafts] = useState<Record<string, string>>({});

  const { sendMessage, sendTypingIndicator, isConnected, socket } = useSocket();
  const chatMessages = useStore((state) => state.messages);

  const lastUrlSelectionKeyRef = useRef<string | null>(null);

  // Real-time conversation updates from socket
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Listen for broadcast acceptance (when astrologer accepts a broadcast)
    const handleBroadcastAccepted = async (result: any) => {
      console.log('📢 [JYOTISH] Broadcast accepted, opening chat:', result);

      try {
        // Small delay to ensure backend has finished creating messages
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Navigate to the chat - the URL watcher will handle reloading conversations and opening the chat
        if (result.chat && result.chat.id) {
          console.log('📂 Navigating to chat:', result.chat.id);
          router.push(ROUTE_BUILDERS.JYOTISH_CHAT_WITH_ID(result.chat.id));
        }
      } catch (error) {
        console.error('❌ Error in handleBroadcastAccepted:', error);
        toast.error('Failed to open chat. Please refresh the page.');
      }
    };

    const handleNewMessage = async (message: any) => {
      // DON'T add message here - it's already added by useSocket hook to Zustand store
      // The useEffect watching chatMessages will handle adding it to the active chat
      // This prevents duplicate messages!

      // Only update conversation list with new message
      setChats((prevChats) => {
        // Find the chat this message belongs to
        const chatIndex = prevChats.findIndex(
          (chat) =>
            chat.id === message.chatId ||
            (chat.clientParticipant.id === message.senderId &&
              chat.astrologerParticipant.id === message.receiverId) ||
            (chat.clientParticipant.id === message.receiverId &&
              chat.astrologerParticipant.id === message.senderId)
        );

        if (chatIndex === -1) {
          // Chat not in list, reload conversations to fetch the new chat
          // This happens when receiving first message from a new user
          console.log('📩 New chat detected, reloading conversations...');
          loadConversations();
          return prevChats;
        }

        const updatedChats = [...prevChats];
        const chat = updatedChats[chatIndex];

        // Update chat with new message details
        const lastMessageText = message.content?.trim()
          ? message.content.substring(0, 100)
          : message.metadata
            ? '📎 Sent an attachment'
            : message.content?.substring(0, 100) || '';

        updatedChats[chatIndex] = {
          ...chat,
          lastMessageText,
          lastMessageAt: new Date(message.createdAt),
          // Increment unread count only if message is from someone else AND this chat is not active
          unreadCount:
            message.senderId !== user.id && activeChatId !== chat.id
              ? (chat.unreadCount || 0) + 1
              : chat.unreadCount || 0,
        };

        // Sort by most recent message - CRITICAL for showing new messages at top
        updatedChats.sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });

        return updatedChats;
      });
    };

    // Handle chat ended event
    const handleChatEnded = (data: {
      chatId: string;
      status: string;
      isLocked: boolean;
      endedBy: string;
      endedAt: string;
    }) => {
      console.log('🔒 Chat ended:', data);

      // Update active chat if this is the current chat
      if (activeChatId === data.chatId) {
        setActiveChat((prev) =>
          prev
            ? {
                ...prev,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
              }
            : null
        );
      }

      // Update chat in list
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === data.chatId
            ? {
                ...chat,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
              }
            : chat
        )
      );
    };

    // Handle chat reopened event
    const handleChatReopened = (data: {
      chatId: string;
      status: string;
      isLocked: boolean;
      chat: Chat;
    }) => {
      console.log('🔓 Chat reopened:', data);

      // Show toast notification
      if (activeChatId === data.chatId) {
        toast.success('Chat session reopened! You can now send messages.', {
          duration: 3000,
        });
      }

      // Update active chat if this is the current chat
      if (activeChatId === data.chatId) {
        setActiveChat((prev) =>
          prev
            ? {
                ...prev,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
              }
            : null
        );
      }

      // Update chat in list
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === data.chatId
            ? {
                ...chat,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
              }
            : chat
        )
      );
    };

    // Handle chat abandoned by admin
    const handleChatAbandoned = (data: {
      chatId: string;
      isAbandonedByAdmin: boolean;
      abandonedAt: Date;
      abandonReason: string;
      isLocked: boolean;
      status: string;
    }) => {
      console.log('🚫 Chat abandoned by admin:', data);

      // Show toast notification
      if (activeChatId === data.chatId) {
        toast.error('This conversation has been ended by administration.', {
          duration: 5000,
        });
      }

      // Update active chat
      if (activeChatId === data.chatId) {
        setActiveChat((prev) =>
          prev
            ? ({
                ...prev,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
                isAbandonedByAdmin: data.isAbandonedByAdmin,
                abandonReason: data.abandonReason,
              } as any)
            : null
        );
      }

      // Update chat in list - include ALL abandoned fields
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === data.chatId
            ? ({
                ...chat,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
                isAbandonedByAdmin: data.isAbandonedByAdmin,
                abandonReason: data.abandonReason,
              } as any)
            : chat
        )
      );
    };

    // Handle chat unblocked by admin
    const handleChatUnblocked = (data: {
      chatId: string;
      isAbandonedByAdmin: boolean;
      isLocked: boolean;
      status: string;
    }) => {
      console.log('✅ Chat unblocked by admin:', data);

      // Show toast notification
      if (activeChatId === data.chatId) {
        toast.success(
          'This conversation has been unblocked by administration. You can now send messages.',
          {
            duration: 5000,
          }
        );
      }

      // Update active chat
      if (activeChatId === data.chatId) {
        setActiveChat((prev) =>
          prev
            ? ({
                ...prev,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
                isAbandonedByAdmin: data.isAbandonedByAdmin,
                abandonReason: null, // Clear the abandon reason when unblocked
              } as any)
            : null
        );
      }

      // Update chat in list - include ALL fields
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === data.chatId
            ? ({
                ...chat,
                status: data.status as 'ACTIVE' | 'ENDED',
                isLocked: data.isLocked,
                isAbandonedByAdmin: data.isAbandonedByAdmin,
                abandonReason: null, // Clear the abandon reason when unblocked
              } as any)
            : chat
        )
      );
    };

    // Listen to both receive and sent events
    socket.on('chat:receive', handleNewMessage);
    socket.on('chat:sent', handleNewMessage);
    socket.on('chat:ended', handleChatEnded);
    socket.on('chat:reopened', handleChatReopened);
    socket.on('chat:abandoned', handleChatAbandoned);
    socket.on('chat:unblocked', handleChatUnblocked);
    socket.on('broadcast:messageAccepted', handleBroadcastAccepted); // ✅ Listen for broadcast acceptance

    return () => {
      socket.off('chat:receive', handleNewMessage);
      socket.off('chat:sent', handleNewMessage);
      socket.off('chat:ended', handleChatEnded);
      socket.off('chat:reopened', handleChatReopened);
      socket.off('chat:abandoned', handleChatAbandoned);
      socket.off('chat:unblocked', handleChatUnblocked);
      socket.off('broadcast:messageAccepted', handleBroadcastAccepted);
    };
  }, [socket, isConnected, user, activeChatId, router]);

  const loadConversations = async () => {
    try {
      setIsLoadingChats(true);
      const conversations = await chatService.getConversations();
      const conversationsList = Array.isArray(conversations) ? conversations : [];

      console.log('📥 Raw conversations:', conversationsList.length);

      // Filter: Only show chats with messages OR status ACTIVE (for newly created chats)
      const chatsWithMessages = conversationsList.filter(
        (chat) => chat.lastMessageAt !== null || chat.lastMessageText || chat.status === 'ACTIVE'
      );

      console.log('✅ Chats with messages:', chatsWithMessages.length);

      // Deduplicate by ID
      const uniqueConversations = chatsWithMessages.filter(
        (chat, index, self) => index === self.findIndex((c) => c.id === chat.id)
      );

      setChats(uniqueConversations);
      setTotalChats(uniqueConversations.length);
      console.log('📋 Final conversations:', uniqueConversations.length);
      return uniqueConversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
      setChats([]);
      return [];
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Load and select a specific chat from URL
  const loadAndSelectChatFromUrl = async (chatId: string, loadedChats?: any[]) => {
    if (!chatId || !user) {
      console.log('No chatId or user, skipping');
      return;
    }

    try {
      console.log('🔍 Looking for chat:', chatId);

      // Use passed chats or current state
      const chatList = loadedChats || chats;
      let chat = chatList.find((c: any) => c.id === chatId);

      // If not found, fetch it directly by ID
      if (!chat) {
        console.log('📥 Chat not in list, fetching...');
        chat = await chatService.getChatById(chatId);
        console.log('✅ Fetched:', chat);

        // Reload conversations to get the complete list including this chat
        const freshConversations = await loadConversations();

        // Find the chat in the fresh list
        chat = freshConversations.find((c: any) => c.id === chatId) || chat;
      }

      // Validate chat has required properties
      if (!chat || !chat.clientParticipant || !chat.astrologerParticipant) {
        console.warn('❌ Invalid chat data:', chat);
        toast.error('Invalid chat data');
        return;
      }

      // Get the other user (for astrologers, the other user is the client)
      const otherUser = chat.clientParticipant;

      if (!otherUser || !otherUser.id) {
        console.warn('❌ Other user not found');
        return;
      }

      console.log('👤 Opening chat with:', otherUser.name);

      // Clear messages first to prevent duplicates from store merge
      setMessages([]);

      // Set the active chat FIRST (this triggers ChatWindow to prepare for new chat)
      setActiveChat(chat);
      setActiveChatId(chat.id);

      // Small delay to ensure state updates propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Load messages
      console.log('📨 Loading messages for:', otherUser.id);
      await loadMessages(otherUser.id, true, chat.id);

      console.log('✅ Chat opened successfully');
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Failed to open chat');
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await chatService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadMessages = async (otherUserId: string, reset = true, chatIdForMerge?: string | null) => {
    try {
      setIsLoadingMessages(true);
      if (reset) {
        setMessageOffset(0);
        setHasMore(true);
        currentOtherUserId.current = otherUserId;
      }

      const { messages: chatMessages, total } = await chatService.getChatHistory({
        otherUserId,
        limit: 30, // Load 30 messages at a time (WhatsApp-like)
        offset: 0,
      });

      // Merge with socket-received messages that might have arrived during the API fetch.
      // Prevents “new message only appears after refresh”.
      const chatIdToUse = chatIdForMerge ?? activeChatId;
      type SocketMessageLike = {
        id?: unknown;
        chatId?: unknown;
        senderId?: unknown;
        receiverId?: unknown;
        senderType?: unknown;
        receiverType?: unknown;
        content?: unknown;
        type?: unknown;
        metadata?: unknown;
        createdAt?: unknown;
        updatedAt?: unknown;
        isRead?: unknown;
        isDeleted?: unknown;
        sender?: unknown;
      };

      const storeMessages = chatIdToUse ? useStore.getState().messages[chatIdToUse] : undefined;
      const toTime = (v: unknown) => {
        if (v instanceof Date) return v.getTime();
        if (typeof v === 'string' || typeof v === 'number') {
          const d = new Date(v);
          return Number.isNaN(d.getTime()) ? 0 : d.getTime();
        }
        return 0;
      };

      const byId = new Map<string, Message>();
      for (const m of chatMessages as Message[]) {
        byId.set(m.id, m);
      }

      if (Array.isArray(storeMessages) && storeMessages.length > 0) {
        for (const raw of storeMessages) {
          const m = raw as SocketMessageLike;
          if (typeof m?.id !== 'string') continue;
          // Convert store message shape into the local `Message` shape we render.
          const parseDate = (v: unknown): Date => {
            if (v instanceof Date) return v;
            if (typeof v === 'string' || typeof v === 'number') {
              const d = new Date(v);
              return Number.isNaN(d.getTime()) ? new Date(0) : d;
            }
            return new Date(0);
          };

          const parseBool = (v: unknown, fallback: boolean) => {
            if (typeof v === 'boolean') return v;
            return fallback;
          };

          const senderLike = m.sender as
            | {
                id?: unknown;
                name?: unknown;
                profilePhoto?: unknown;
                role?: unknown;
                dateOfBirth?: unknown;
                timeOfBirth?: unknown;
                placeOfBirth?: unknown;
              }
            | undefined;
          const senderId = typeof senderLike?.id === 'string' ? senderLike.id : '';
          const senderName = typeof senderLike?.name === 'string' ? senderLike.name : 'Unknown';
          const senderProfilePhoto =
            typeof senderLike?.profilePhoto === 'string' ? senderLike.profilePhoto : undefined;
          const senderRole =
            typeof senderLike?.role === 'string' ? senderLike.role : undefined;
          const senderDateOfBirth = senderLike?.dateOfBirth ?? undefined;
          const senderTimeOfBirth =
            typeof senderLike?.timeOfBirth === 'string' ? senderLike.timeOfBirth : undefined;
          const senderPlaceOfBirth =
            typeof senderLike?.placeOfBirth === 'string' ? senderLike.placeOfBirth : undefined;

          const existingMsg = byId.get(m.id) as Message | undefined;
          const mergedSender: Message['sender'] = {
            id: senderId,
            name: senderName,
            profilePhoto: senderProfilePhoto,
            ...(senderRole && { role: senderRole as 'CLIENT' | 'ASTROLOGER' }),
            ...(senderDateOfBirth != null && {
              dateOfBirth:
                senderDateOfBirth instanceof Date
                  ? senderDateOfBirth
                  : typeof senderDateOfBirth === 'string'
                    ? senderDateOfBirth
                    : existingMsg?.sender?.dateOfBirth,
            }),
            ...(senderTimeOfBirth && { timeOfBirth: senderTimeOfBirth }),
            ...(senderPlaceOfBirth && { placeOfBirth: senderPlaceOfBirth }),
          };
          if (!mergedSender.dateOfBirth && existingMsg?.sender?.dateOfBirth) {
            mergedSender.dateOfBirth = existingMsg.sender.dateOfBirth;
          }
          if (!mergedSender.timeOfBirth && existingMsg?.sender?.timeOfBirth) {
            mergedSender.timeOfBirth = existingMsg.sender.timeOfBirth;
          }
          if (!mergedSender.placeOfBirth && existingMsg?.sender?.placeOfBirth) {
            mergedSender.placeOfBirth = existingMsg.sender.placeOfBirth;
          }

          byId.set(m.id, {
            id: m.id,
            chatId: typeof m.chatId === 'string' ? m.chatId : chatIdToUse || '',
            senderId: typeof m.senderId === 'string' ? m.senderId : '',
            receiverId: typeof m.receiverId === 'string' ? m.receiverId : '',
            content: typeof m.content === 'string' ? m.content : '',
            type: (typeof m.type === 'string' ? m.type : 'TEXT') as Message['type'],
            metadata: m.metadata as unknown,
            createdAt: parseDate(m.createdAt),
            updatedAt: parseDate(m.updatedAt ?? m.createdAt),
            isRead: parseBool(m.isRead, false),
            isDeleted: parseBool(m.isDeleted, false),
            sender: mergedSender,
          } as Message);
        }
      }

      const merged = Array.from(byId.values()).sort(
        (a, b) => toTime(a.createdAt) - toTime(b.createdAt)
      );

      setMessages(merged);
      setMessageOffset(30);
      setHasMore(total > 30 || chatMessages.length === 30);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!currentOtherUserId.current || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const { messages: olderMessages } = await chatService.getChatHistory({
        otherUserId: currentOtherUserId.current,
        limit: 30,
        offset: messageOffset,
      });

      if (olderMessages.length === 0) {
        setHasMore(false);
        return;
      }

      // Prepend older messages to the beginning
      setMessages((prev) => [...olderMessages, ...prev]);
      setMessageOffset((prev) => prev + olderMessages.length);
      setHasMore(olderMessages.length === 30);
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Failed to load older messages');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSelectChat = async (chatId: string, otherUserId: string) => {
    if (!chatId || !otherUserId) {
      console.warn('Missing chatId or otherUserId');
      return;
    }

    const selectedChat = chats.find((c) => c.id === chatId);
    if (!selectedChat) {
      console.warn('Chat not found:', chatId);
      return;
    }

    setActiveChat(selectedChat);
    setActiveChatId(chatId);
    await loadMessages(otherUserId, true, chatId);

    // Mark messages as read
    try {
      await chatService.markMessagesAsRead(chatId);
      setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)));
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Load conversations on initial mount
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeChat = async () => {
      if (!user) return;

      console.log('🚀 Initializing chat...');

      // Load all conversations
      const loadedChats = await loadConversations();
      await loadUnreadCount();

      const urlKey = chatIdFromUrl ? `chat:${chatIdFromUrl}` : 'none';
      lastUrlSelectionKeyRef.current = urlKey;

      // If we have a chatId in URL, try to select it
      if (chatIdFromUrl) {
        await loadAndSelectChatFromUrl(chatIdFromUrl, loadedChats);
      }
    };

    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only run on user change, not chatIdFromUrl

  // Watch for URL changes and load the specified chat
  useEffect(() => {
    // Skip if still loading initial data or no user
    if (!user || !initializedRef.current) return;

    const urlKey = chatIdFromUrl ? `chat:${chatIdFromUrl}` : 'none';
    if (lastUrlSelectionKeyRef.current === urlKey) return;
    lastUrlSelectionKeyRef.current = urlKey;

    // If chatId in URL changes, load that chat
    if (chatIdFromUrl) {
      console.log('🔄 URL changed, loading chat:', chatIdFromUrl);

      // Check if chat exists in current list, if not reload conversations first
      const chatExists = chats.find((c) => c.id === chatIdFromUrl);
      if (!chatExists) {
        console.log('💫 Chat not in list, reloading conversations first...');
        loadConversations().then((freshChats) => {
          loadAndSelectChatFromUrl(chatIdFromUrl, freshChats);
        });
      } else {
        // Chat exists, load it directly
        loadAndSelectChatFromUrl(chatIdFromUrl);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdFromUrl]); // Run whenever chatIdFromUrl changes

  // Update active chat messages when new messages arrive
  useEffect(() => {
    if (chatMessages && activeChatId && chatMessages[activeChatId]) {
      // Merge with existing messages to avoid duplicates
      setMessages((prevMessages) => {
        const newMessages = chatMessages[activeChatId];
        const messageIds = new Set(prevMessages.map((m: any) => m.id));
        const uniqueNewMessages = newMessages
          .filter((m: any) => !messageIds.has(m.id))
          .map(
            (m: any) =>
              ({
                id: m.id,
                chatId: m.chatId || activeChatId,
                senderId: m.senderId,
                receiverId: m.receiverId,
                senderType: m.senderType,
                receiverType: m.receiverType,
                content: m.content,
                type: m.type, // ✅ Include message type (TEXT, IMAGE, FILE, AUDIO)
                metadata: m.metadata, // ✅ Include attachment metadata
                createdAt: m.createdAt,
                updatedAt: m.updatedAt || m.createdAt, // ✅ Add updatedAt
                isRead: m.isRead,
                isDeleted: m.isDeleted || false, // ✅ Add isDeleted
                sender: m.sender || {
                  id: m.senderId,
                  name: 'Unknown',
                  profilePhoto: undefined,
                },
              }) as Message
          );
        return [...prevMessages, ...uniqueNewMessages];
      });
    }
  }, [chatMessages, activeChatId]);

  // Reload conversations when specific chat gets new messages (debounced)
  useEffect(() => {
    if (!activeChatId || !chatMessages || !chatMessages[activeChatId]) return;

    // Only reload if there are actually new messages
    const currentMessages = chatMessages[activeChatId];
    if (currentMessages.length === 0) return;

    // Debounce conversation reload to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      loadConversations();
    }, 2000); // Wait 2 seconds after last message

    return () => clearTimeout(timeoutId);
  }, [activeChatId, chatMessages]);

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  const handleSendMessage = async (content: string, attachment?: FileAttachment) => {
    if (!activeChat || !user) return;

    // For astrologers, the other user is always the client
    const otherUser = activeChat.clientParticipant;

    // Handle file upload if attachment exists
    if (attachment) {
      try {
        toast.loading('Uploading file...');

        // Upload file first
        const fileData = await chatService.uploadChatFile(attachment.file);

        toast.dismiss();
        toast.success('File uploaded!');

        // Send message with file URL - if no text, send empty string (UI will show file)
        const messageContent = content || '';
        const success = sendMessage(otherUser.id, messageContent, fileData.type, {
          fileUrl: fileData.url,
          fileName: fileData.originalName,
          fileSize: fileData.size,
          mimeType: fileData.mimeType,
        });

        if (!success) {
          toast.error('Failed to send message. Please check your connection.');
        }
      } catch (error) {
        toast.dismiss();
        toast.error('Failed to upload file. Please try again.');
        console.error('File upload error:', error);
      }
      return;
    }

    const success = sendMessage(otherUser.id, content);

    if (!success) {
      toast.error('Failed to send message. Please check your connection.');
    } else if (activeChat.id) {
      // Clear draft for this chat after successful send
      setChatDrafts((prev) => {
        const next = { ...prev };
        delete next[activeChat.id];
        return next;
      });
    }

    // Don't add optimistically - let WebSocket handle it
    // This prevents duplicate messages
  };

  const handleTyping = (isTyping: boolean) => {
    if (!activeChat || !user) return;

    // For astrologers, the other user is always the client
    const otherUser = activeChat.clientParticipant;

    sendTypingIndicator(otherUser.id, isTyping);
  };

  const getDraftForChat = (chatId: string | null): string =>
    chatId && chatDrafts[chatId] ? chatDrafts[chatId] : '';

  const handleDraftChange = (value: string) => {
    if (!activeChatId) return;
    setChatDrafts((prev) => {
      if (!value.trim()) {
        const next = { ...prev };
        delete next[activeChatId];
        return next;
      }
      return { ...prev, [activeChatId]: value };
    });
  };

  // Handle input focus - mark messages as read
  const handleInputFocus = async () => {
    if (!activeChatId) return;

    try {
      await chatService.markMessagesAsRead(activeChatId);
      // Update unread count in chat list
      setChats((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c)));
      console.log('✅ Messages marked as read on input focus');
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle chat ended
  const handleChatEnded = async () => {
    // Reload conversations to update status
    await loadConversations();

    // Clear active chat
    setActiveChat(null);
    setActiveChatId(null);
    setMessages([]);

    toast.success('Chat ended. You can now accept new requests');
  };

  return (
    <JyotishLayout>
      <div className="space-y-6">
        <div className="space-y-1 flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-amber-400 flex-shrink-0" aria-hidden />
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#fafaf9] tracking-tight">
              Chats
            </h1>
            <p className="text-sm text-[#78716c]">
              Communicate with your clients in real-time
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-black/50 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-white/90">Chats</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/30 text-amber-300">
                <MessageSquare className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white tracking-tight">{totalChats}</div>
              <p className="text-xs text-white/70 mt-1">
                {chats.filter((c) => c.status === 'ACTIVE').length} active · {chats.filter((c) => c.status === 'ENDED').length} ended
              </p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-white/90">Unread</CardTitle>
              <div className="p-2 rounded-lg bg-violet-500/40 text-violet-200">
                <MessageSquare className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white tracking-tight">{unreadCount}</div>
              <p className="text-xs text-white/70 mt-1">Across all conversations</p>
            </CardContent>
          </Card>
          <Card className="bg-black/50 backdrop-blur-md border border-white/20 rounded-xl overflow-hidden shadow-lg">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-sm font-medium text-white/90">Status</CardTitle>
              <div className={`p-2 rounded-lg ${isConnected ? 'bg-emerald-500/40 text-emerald-200' : 'bg-white/20 text-white/80'}`}>
                <span className="text-lg leading-none">{isConnected ? '●' : '○'}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-white tracking-tight">
                {isConnected ? 'Online' : 'Connecting…'}
              </div>
              <p className="text-xs text-white/70 mt-1">
                {isConnected ? 'Ready for messages' : 'Reconnecting…'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-black/30 backdrop-blur-sm border border-white/15 rounded-xl overflow-hidden">
          <div className="flex h-[580px] min-h-0">
            <div className="w-72 sm:w-80 flex-shrink-0 border-r border-white/10 flex flex-col bg-black/20">
              <div className="flex-1 min-h-0 overflow-hidden">
                <ChatList
                  chats={chats}
                  activeChat={activeChatId}
                  currentUserId={user?.id || ''}
                  onSelectChat={handleSelectChat}
                  isLoading={isLoadingChats}
                  variant="jyotish"
                  showStatusFilter
                />
              </div>
            </div>
            <div className={`flex-1 min-w-0 flex flex-col ${activeChat ? 'bg-white' : 'bg-transparent'}`}>
              <ChatWindow
                key={activeChat?.id || 'no-chat'}
                chat={activeChat}
                messages={messages}
                currentUserId={user?.id || ''}
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onInputFocus={handleInputFocus}
                onLoadMore={loadMoreMessages}
                onChatEnded={handleChatEnded}
                isLoading={isLoadingMessages}
                isLoadingMore={isLoadingMore}
                hasMore={hasMore}
                isConnected={isConnected}
                variant="jyotish"
                emptyStateTheme="dark"
                draftValue={getDraftForChat(activeChatId)}
                onDraftChange={handleDraftChange}
              />
            </div>
          </div>
        </Card>
      </div>
    </JyotishLayout>
  );
}
