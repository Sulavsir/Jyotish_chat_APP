/**
 * Chat Page (Client)
 * Real-time chat interface for clients to communicate with astrologers
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card } from '@jyotish/ui';
import { useStore } from '@/store';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { useSocket } from '@/hooks/useSocket';
import { ChatList, ChatWindow, OnlineUsers } from '@/components/features/chat';
import { BroadcastChatWindow } from '@/components/features/broadcast-chat/BroadcastChatWindow';
import chatService from '@/services/chat.service';
import astrologerService from '@/services/astrologer.service';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ProfileIncompleteDialog } from '@/components/ui/ProfileIncompleteDialog';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import { Chat, Message, FileAttachment } from '@/types/chat';
import { CoinPurchaseModal } from '@/components/modals';
import { ERROR_CODES, QUERY_KEYS } from '@/constants';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/user.types';
import { clientProfileService } from '@/services/clientProfile.service';
import { getBirthDetailsForProfile } from '@/utils/birth-details.utils';
import { useChatProfileStore } from '@/store/chat-profile.store';

export default function ChatPage() {
  // Require CLIENT role to access this page
  useRequireAuth({ requiredRole: USER_ROLES.CLIENT });

  const searchParams = useSearchParams();
  const router = useRouter();
  const chatIdFromUrl = searchParams?.get('chatId');
  const otherUserIdFromUrl = searchParams?.get('otherUserId');
  const profileIdFromUrl = searchParams?.get('profileId');

  const user = useAuthStore((state) => state.user);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isBroadcastChatActive, setIsBroadcastChatActive] = useState(false);
  const [showProfileIncompleteDialog, setShowProfileIncompleteDialog] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);
  const [showCoinPurchaseModal, setShowCoinPurchaseModal] = useState(false);
  const [requiredCoins, setRequiredCoins] = useState(1);
  const initializedRef = useRef(false);
  const currentOtherUserId = useRef<string | null>(null);
  const pendingMessageSentRef = useRef<string | null>(null);

  const { sendMessage, sendTypingIndicator, isConnected, socket } = useSocket();
  const typingUsers = useStore((state) => state.typingUsers);
  const chatMessages = useStore((state) => state.messages);
  const queryClient = useQueryClient();

  const { data: profilesData } = useQuery({
    queryKey: QUERY_KEYS.USERS.PROFILES,
    queryFn: () => clientProfileService.list(),
    enabled: !!user?.id,
  });
  const familyProfiles = profilesData?.profiles ?? [];

  const setSelectedProfileForChat = useChatProfileStore((s) => s.setSelectedProfileForChat);
  const getSelectedProfileForChat = useChatProfileStore((s) => s.getSelectedProfileForChat);
  const getBirthDetailsForChat = useChatProfileStore((s) => s.getBirthDetailsForChat);
  const setBirthDetailsForChat = useChatProfileStore((s) => s.setBirthDetailsForChat);
  const migrateSelectionToChatId = useChatProfileStore((s) => s.migrateSelectionToChatId);
  const selectedProfileByChatKey = useChatProfileStore((s) => s.selectedProfileByChatKey) ?? {};
  const selectedProfileForActiveChat =
    activeChatId != null ? (selectedProfileByChatKey[activeChatId] ?? 'me') : 'me';

  // Load conversations on initial mount
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeChat = async () => {
      if (!user) return;

      // Load all conversations first
      const loadedChats = await loadConversations();

      // If we have a chatId in URL, try to select it
      if (chatIdFromUrl) {
        await loadAndSelectChatFromUrl(chatIdFromUrl, loadedChats);
      } else if (otherUserIdFromUrl) {
        // No chat yet: open "new conversation" with this astrologer (chat is created on first message)
        await loadAndSelectChatByOtherUserId(otherUserIdFromUrl);
      }
    };

    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Restore selected profile from URL when navigating from dashboard (Chat with specific Jyotish)
  useEffect(() => {
    if (!profileIdFromUrl?.trim()) return;
    const chatKey = chatIdFromUrl || (otherUserIdFromUrl ? `new-${otherUserIdFromUrl}` : '');
    if (chatKey) {
      setSelectedProfileForChat(chatKey, profileIdFromUrl.trim());
    }
  }, [profileIdFromUrl, chatIdFromUrl, otherUserIdFromUrl, setSelectedProfileForChat]);

  // Handle URL changes after initial mount (when chatId or otherUserId query param changes)
  useEffect(() => {
    if (!initializedRef.current || !user) return;

    if (chatIdFromUrl) {
      if (activeChatId === chatIdFromUrl && !isBroadcastChatActive) return;
      if (isBroadcastChatActive) {
        setIsBroadcastChatActive(false);
        loadAndSelectChatFromUrl(chatIdFromUrl, chats, true);
        return;
      }
      loadAndSelectChatFromUrl(chatIdFromUrl, chats);
      return;
    }

    if (otherUserIdFromUrl) {
      const newChatId = `new-${otherUserIdFromUrl}`;
      if (activeChatId === newChatId) return;
      pendingMessageSentRef.current = null;
      loadAndSelectChatByOtherUserId(otherUserIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdFromUrl, otherUserIdFromUrl]);

  // Send pending initial message when opening "new conversation" from dashboard (e.g. Ask Questions → specific Jyotish)
  useEffect(() => {
    if (
      !otherUserIdFromUrl ||
      !activeChatId ||
      activeChatId !== `new-${otherUserIdFromUrl}` ||
      !isConnected ||
      !user
    ) {
      return;
    }
    if (pendingMessageSentRef.current === otherUserIdFromUrl) return;

    try {
      const raw =
        typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('pendingChatMessage') : null;
      if (!raw) return;

      const parsed = JSON.parse(raw) as {
        otherUserId: string;
        content: string;
        categoryId?: string;
        birthDetails?: Record<string, string>;
        selectedProfileId?: string;
      };
      if (parsed.otherUserId !== otherUserIdFromUrl || !parsed.content?.trim()) return;

      pendingMessageSentRef.current = otherUserIdFromUrl;
      sessionStorage.removeItem('pendingChatMessage');

      if (parsed.selectedProfileId && parsed.selectedProfileId !== 'me') {
        setSelectedProfileForChat(activeChatId, parsed.selectedProfileId);
      }
      if (parsed.birthDetails && Object.keys(parsed.birthDetails).length > 0) {
        setBirthDetailsForChat(activeChatId, parsed.birthDetails as Record<string, string>);
      }

      const metadata = {
        ...(parsed.categoryId && { questionCategory: parsed.categoryId }),
        ...(parsed.birthDetails &&
          Object.keys(parsed.birthDetails).length > 0 && { birthDetails: parsed.birthDetails }),
      };
      const sent = sendMessage(
        otherUserIdFromUrl,
        parsed.content.trim(),
        'TEXT',
        Object.keys(metadata).length > 0 ? metadata : undefined
      );
      if (!sent) {
        pendingMessageSentRef.current = null;
        toast.error('Failed to send message. Please try again.');
      }
    } catch {
      // Ignore parse errors or missing storage
    }
  }, [otherUserIdFromUrl, activeChatId, isConnected, user, sendMessage]);

  // Real-time conversation updates from socket
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Listen for broadcast acceptance (when your broadcast is accepted by an astrologer)
    const handleYourBroadcastAccepted = async (data: any) => {
      console.log('📢 Your broadcast accepted, opening chat:', data);

      // Reload conversations to get the new chat
      const freshConversations = await loadConversations();

      // Auto-open the chat that was just created
      if (data.chat && data.chat.id) {
        // Close broadcast chat window
        setIsBroadcastChatActive(false);

        // Open the new chat
        setTimeout(() => {
          loadAndSelectChatFromUrl(data.chat.id, freshConversations);
        }, 500);
      }
    };

    const handleNewMessage = async (message: any) => {
      // Invalidate coin balance query to reflect real-time deduction
      if (user?.role === UserRole.CLIENT) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COINS.BALANCE });
      }

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
        toast.success('Chat session reopened! You can now send messages.');
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

    // Handle chat errors (e.g., insufficient coins)
    const handleChatError = (data: { message: string; code?: string; requiredCoins?: number }) => {
      console.error('Chat error:', data);

      if (
        data.code === ERROR_CODES.INSUFFICIENT_COINS ||
        data.message?.toLowerCase().includes('insufficient coins')
      ) {
        const coins = data.requiredCoins || extractRequiredCoins(data.message);
        toast.error(data.message || 'Insufficient coins to send message');
        setRequiredCoins(coins);
        setShowCoinPurchaseModal(true);
      } else {
        toast.error(data.message || 'Failed to send message');
      }
    };

    // Extract required coins from error message
    const extractRequiredCoins = (errorMessage: string): number => {
      const match = errorMessage.match(/Required:\s*(\d+)/i);
      return match ? parseInt(match[1], 10) : 1;
    };

    // Listen to both receive and sent events
    socket.on('chat:receive', handleNewMessage);
    socket.on('chat:sent', handleNewMessage);
    // When we were in "new conversation" mode and our first message created the chat, switch to real chat
    const handleSentInNewMode = async (message: any) => {
      if (
        activeChatId?.startsWith('new-') &&
        message.chatId &&
        message.senderId === user?.id &&
        message.receiverId === activeChatId.replace('new-', '')
      ) {
        const realChatId = message.chatId;
        migrateSelectionToChatId(activeChatId, realChatId);
        const profileIdToKeep = getSelectedProfileForChat(realChatId);
        const profileQuery =
          profileIdToKeep && profileIdToKeep !== 'me'
            ? `&profileId=${encodeURIComponent(profileIdToKeep)}`
            : '';
        router.replace(`/chat?chatId=${realChatId}${profileQuery}`);
        const freshConversations = await loadConversations();
        await loadAndSelectChatFromUrl(realChatId, freshConversations);
      } else {
        handleNewMessage(message);
      }
    };

    socket.on('chat:ended', handleChatEnded);
    socket.on('chat:reopened', handleChatReopened);
    socket.on('chat:abandoned', handleChatAbandoned);
    socket.on('chat:unblocked', handleChatUnblocked);
    socket.on('chat:error', handleChatError);
    socket.on('broadcast:yourMessageAccepted', handleYourBroadcastAccepted);
    socket.on('chat:sent', handleSentInNewMode);
    socket.on('chat:receive', handleNewMessage);

    return () => {
      socket.off('chat:receive', handleNewMessage);
      socket.off('chat:sent', handleSentInNewMode);
      socket.off('chat:ended', handleChatEnded);
      socket.off('chat:reopened', handleChatReopened);
      socket.off('chat:abandoned', handleChatAbandoned);
      socket.off('chat:unblocked', handleChatUnblocked);
      socket.off('chat:error', handleChatError);
      socket.off('broadcast:yourMessageAccepted', handleYourBroadcastAccepted);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, user, activeChatId]);

  const loadConversations = async () => {
    try {
      setIsLoadingChats(true);
      const conversations = await chatService.getConversations();
      const conversationsList = Array.isArray(conversations) ? conversations : [];

      // Filter: Only show chats with messages
      const chatsWithMessages = conversationsList.filter(
        (chat) => chat.lastMessageAt !== null || chat.lastMessageText
      );

      // Deduplicate by ID
      const uniqueConversations = chatsWithMessages.filter(
        (chat, index, self) => index === self.findIndex((c) => c.id === chat.id)
      );

      setChats(uniqueConversations);
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
  const loadAndSelectChatFromUrl = async (
    chatId: string,
    loadedChats?: any[],
    skipMobileToggle = false
  ) => {
    if (!chatId || !user) return;

    try {
      // Use passed chats or current state
      const chatList = loadedChats || chats;
      let chat = chatList.find((c: any) => c.id === chatId);

      // If not found, fetch it directly by ID
      if (!chat) {
        chat = await chatService.getChatById(chatId);

        // Reload conversations to get the complete list including this chat
        const freshConversations = await loadConversations();

        // Find the chat in the fresh list
        chat = freshConversations.find((c: any) => c.id === chatId) || chat;
      }

      // Validate chat has required properties
      if (!chat || !chat.clientParticipant || !chat.astrologerParticipant) {
        toast.error('Invalid chat data');
        return;
      }

      // Get the other user (for clients, the other user is the astrologer)
      const otherUser = chat.astrologerParticipant;

      if (!otherUser || !otherUser.id) {
        return;
      }

      // Clear messages first to prevent duplicates from store merge
      setMessages([]);

      // Set the active chat FIRST (this triggers ChatWindow to prepare for new chat)
      setActiveChat(chat);
      setActiveChatId(chat.id);

      // ✅ Only toggle mobile chat if not skipping (prevents layout shift)
      if (!skipMobileToggle) {
        setShowMobileChat(true);
      }

      // Small delay to ensure state updates propagate
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Load messages
      await loadMessages(otherUser.id);
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Failed to open chat');
    }
  };

  // Open "new conversation" with astrologer (no chat row yet; chat is created when first message is sent)
  const loadAndSelectChatByOtherUserId = async (astrologerId: string) => {
    if (!user) return;
    try {
      const { astrologer } = await astrologerService.getPublicProfile(astrologerId);
      const syntheticChatId = `new-${astrologerId}`;
      const now = new Date();
      const syntheticChat: Chat = {
        id: syntheticChatId,
        participant1Id: user.id,
        participant2Id: astrologer.id,

        status: 'ACTIVE',
        isLocked: false,
        // No messages yet, both sides are "read"
        participant1Read: true,
        participant2Read: true,
        createdAt: now,
        updatedAt: now,
        clientParticipant: {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          phone: user.phone ?? undefined,
          profilePhoto: user.profilePhoto ?? undefined,
          role: 'CLIENT',
        },
        astrologerParticipant: {
          id: astrologer.id,
          name: astrologer.name ?? null,
          email: astrologer.email ?? null,
          phone: astrologer.phone ?? undefined,
          profilePhoto: astrologer.profilePhoto ?? undefined,
          role: 'ASTROLOGER',
        },
      };
      setMessages([]);
      setActiveChat(syntheticChat);
      setActiveChatId(syntheticChatId);
      currentOtherUserId.current = astrologerId;
      setShowMobileChat(true);
      await loadMessages(astrologerId);
    } catch (error) {
      console.error('Failed to open new conversation:', error);
      toast.error('Failed to load astrologer');
    }
  };

  // Load messages for active chat (initial load)
  const loadMessages = React.useCallback(async (otherUserId: string, reset = true) => {
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

      setMessages(chatMessages);
      setMessageOffset(30);
      setHasMore(total > 30 || chatMessages.length === 30);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

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

  // Handle broadcast chat selection
  const handleSelectBroadcastChat = () => {
    console.log('📢 [ChatPage] Selecting broadcast chat');
    setIsBroadcastChatActive(true);
    setActiveChat(null);
    setActiveChatId(null);
    setMessages([]);
    setShowMobileChat(true);

    // ✅ Change URL to just /chat (remove chatId query param)
    router.replace('/chat');
  };

  // Handle chat selection
  const handleSelectChat = React.useCallback(
    async (chatId: string, otherUserId: string) => {
      if (!chatId || !otherUserId) return;

      const selectedChat = chats.find((c) => c.id === chatId);
      if (!selectedChat) return;

      // Clear messages first to prevent duplicates from store merge
      setMessages([]);

      setIsBroadcastChatActive(false); // Clear broadcast chat state
      setActiveChat(selectedChat);
      setActiveChatId(chatId);
      setShowMobileChat(true);
      await loadMessages(otherUserId);

      // Mark messages as read
      try {
        await chatService.markMessagesAsRead(chatId);
        // Update unread count in chat list
        setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)));
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    },
    [chats, loadMessages]
  );

  // Handle chat created from broadcast (memoized to prevent unnecessary re-renders)
  const handleChatCreatedFromBroadcast = React.useCallback(
    async (chatId: string) => {
      // Reload conversations to get the new chat
      await loadConversations();
      const freshChats = await loadConversations();
      const selectedChat = freshChats.find((c: Chat) => c.id === chatId);
      if (selectedChat) {
        // For clients, the other user is always the astrologer
        const otherUser = selectedChat.astrologerParticipant;
        handleSelectChat(chatId, otherUser.id);
      }
    },
    [handleSelectChat]
  );

  // Handle sending message (profile from Zustand store per chat)
  const handleSendMessage = async (content: string, attachment?: FileAttachment) => {
    if (!activeChat || !user || !activeChatId) return;

    const profileIdToUse = getSelectedProfileForChat(activeChatId);
    if (profileIdToUse === 'me') {
      const profileCheck = checkClientProfileCompletion(user);
      if (!profileCheck.isComplete) {
        setMissingProfileFields(profileCheck.missingFields);
        setShowProfileIncompleteDialog(true);
        return;
      }
    }

    const otherUser = activeChat.astrologerParticipant;
    // Use cached birth details when available; otherwise compute and cache
    let birthDetails = getBirthDetailsForChat(activeChatId);
    if (!birthDetails || Object.keys(birthDetails).length === 0) {
      birthDetails = getBirthDetailsForProfile(user, familyProfiles, profileIdToUse) as
        | Record<string, string>
        | undefined;
      if (birthDetails && Object.keys(birthDetails).length > 0) {
        setBirthDetailsForChat(activeChatId, birthDetails);
      }
    }
    const baseMetadata =
      birthDetails && Object.keys(birthDetails).length > 0 ? { birthDetails } : undefined;

    // Handle file upload if attachment exists
    if (attachment) {
      try {
        toast.loading('Uploading file...');

        const fileData = await chatService.uploadChatFile(attachment.file);

        toast.dismiss();
        toast.success('File uploaded!');

        const messageContent = content || '';
        const success = sendMessage(otherUser.id, messageContent, fileData.type, {
          ...baseMetadata,
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

    const success = sendMessage(otherUser.id, content, 'TEXT', baseMetadata);

    if (!success) {
      toast.error('Failed to send message. Please check your connection.');
    }
  };

  // Handle typing indicator
  const handleTyping = (isTyping: boolean) => {
    if (!activeChat || !user) return;

    // For clients, the other user is always the astrologer
    const otherUser = activeChat.astrologerParticipant;

    sendTypingIndicator(otherUser.id, isTyping);
  };

  // Handle input focus - mark messages as read
  const handleInputFocus = async () => {
    if (!activeChatId || activeChatId.startsWith('new-')) return;

    try {
      await chatService.markMessagesAsRead(activeChatId);
      // Update unread count in chat list
      setChats((prev) => prev.map((c) => (c.id === activeChatId ? { ...c, unreadCount: 0 } : c)));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle back button on mobile
  const handleBack = () => {
    setShowMobileChat(false);
    setActiveChat(null);
    setActiveChatId(null);
  };

  // Handle chat ended
  const handleChatEnded = async () => {
    // Reload conversations to update status
    await loadConversations();

    // Clear active chat
    setActiveChat(null);
    setActiveChatId(null);
    setMessages([]);
    setShowMobileChat(false);

    toast.success('You can now start a new chat');
  };

  // Update active chat messages when new messages arrive from store
  useEffect(() => {
    if (chatMessages && activeChatId && chatMessages[activeChatId]) {
      // Merge with existing messages to avoid duplicates
      setMessages((prevMessages) => {
        const newMessages = chatMessages[activeChatId];
        const messageIds = new Set(prevMessages.map((m) => m.id));
        const uniqueNewMessages = newMessages
          .filter((m) => !messageIds.has(m.id))
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
                type: m.type,
                metadata: m.metadata,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt || m.createdAt,
                isRead: m.isRead,
                isDeleted: m.isDeleted || false,
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

  if (!user) {
    return <LoadingScreen />;
  }

  // Check if other user is typing (for clients, it's the astrologer)
  const otherUserId = activeChat ? activeChat.astrologerParticipant.id : null;
  const isOtherUserTyping = otherUserId ? typingUsers.has(otherUserId) : false;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">💬 Chat</h1>
          <p className="text-gray-400">Connect with astrologers in real-time</p>
        </div>

        {/* Online Astrologers - Scrollable, No Limit */}
        <OnlineUsers title="Online Astrologers - Available Now" maxHeight="300px" />

        {/* Chat Interface - Fixed Height */}
        <Card className="bg-black/40 backdrop-blur-md border-purple-500/30 overflow-hidden">
          <div className="flex h-[600px]">
            {/* Conversations List */}
            <div
              className={`${showMobileChat ? 'hidden' : 'block'} lg:block w-full lg:w-80 border-r border-purple-500/20 h-full`}
            >
              <ChatList
                chats={chats}
                activeChat={activeChatId}
                currentUserId={user.id}
                onSelectChat={handleSelectChat}
                isLoading={isLoadingChats}
                showBroadcastChat={true}
                isBroadcastChatActive={isBroadcastChatActive}
                onSelectBroadcastChat={handleSelectBroadcastChat}
              />
            </div>

            {/* Chat Window */}
            <div className={`${showMobileChat ? 'block' : 'hidden'} lg:block flex-1 h-full`}>
              {isBroadcastChatActive ? (
                <BroadcastChatWindow onChatCreated={handleChatCreatedFromBroadcast} />
              ) : (
                <ChatWindow
                  key={activeChat?.id || 'no-chat'}
                  chat={activeChat}
                  messages={messages}
                  currentUserId={user.id}
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  onInputFocus={handleInputFocus}
                  onLoadMore={loadMoreMessages}
                  onBack={handleBack}
                  onChatEnded={handleChatEnded}
                  isTyping={isOtherUserTyping}
                  isLoading={isLoadingMessages}
                  isLoadingMore={isLoadingMore}
                  hasMore={hasMore}
                  isConnected={isConnected}
                  selectedProfileId={selectedProfileForActiveChat}
                  onProfileChange={(profileId) =>
                    setSelectedProfileForChat(activeChatId!, profileId)
                  }
                  familyProfiles={familyProfiles}
                />
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Profile Incomplete Dialog */}
      <ProfileIncompleteDialog
        isOpen={showProfileIncompleteDialog}
        onClose={() => setShowProfileIncompleteDialog(false)}
        missingFields={missingProfileFields}
      />

      {/* Coin Purchase Modal */}
      <CoinPurchaseModal
        isOpen={showCoinPurchaseModal}
        onClose={() => setShowCoinPurchaseModal(false)}
        requiredCoins={requiredCoins}
        onPurchaseSuccess={() => {
          setShowCoinPurchaseModal(false);
          // After purchase, coins will be updated and user can retry sending message
        }}
        mode="insufficient"
      />
    </DashboardLayout>
  );
}
