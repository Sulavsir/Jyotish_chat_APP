/**
 * Chat Page (Client)
 * Real-time chat interface for clients to communicate with astrologers
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@jyotish/ui';
import { useStore } from '@/store';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { useSocket } from '@/hooks/useSocket';
import { ChatList, ChatWindow } from '@/components/features/chat';
import { BroadcastChatWindow } from '@/components/features/broadcast-chat/BroadcastChatWindow';
import chatService from '@/services/chat.service';
import { toast } from 'sonner';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { Chat, Message, FileAttachment } from '@/types/chat';

export default function ChatPage() {
  // Require CLIENT role to access this page
  useRequireAuth({ requiredRole: USER_ROLES.CLIENT });

  const searchParams = useSearchParams();
  const chatIdFromUrl = searchParams?.get('chatId');

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
  const initializedRef = useRef(false);
  const currentOtherUserId = useRef<string | null>(null);

  const { sendMessage, sendTypingIndicator, isConnected, socket } = useSocket();
  const typingUsers = useStore((state) => state.typingUsers);
  const chatMessages = useStore((state) => state.messages);

  // Load conversations and auto-select chat from URL
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
        // Pass loaded chats to avoid timing issues
        await loadAndSelectChatFromUrl(chatIdFromUrl, loadedChats);
      }
    };

    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatIdFromUrl, user?.id]);

  // Real-time conversation updates from socket
  useEffect(() => {
    if (!socket || !isConnected || !user) return;

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

    // Listen to both receive and sent events
    socket.on('chat:receive', handleNewMessage);
    socket.on('chat:sent', handleNewMessage);
    socket.on('chat:ended', handleChatEnded);
    socket.on('chat:reopened', handleChatReopened);

    return () => {
      socket.off('chat:receive', handleNewMessage);
      socket.off('chat:sent', handleNewMessage);
      socket.off('chat:ended', handleChatEnded);
      socket.off('chat:reopened', handleChatReopened);
    };
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
  const loadAndSelectChatFromUrl = async (chatId: string, loadedChats?: any[]) => {
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

      // Directly set the active chat and load messages
      setActiveChat(chat);
      setActiveChatId(chat.id);
      setShowMobileChat(true);

      // Load messages
      await loadMessages(otherUser.id);
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error('Failed to open chat');
    }
  };

  // Load messages for active chat (initial load)
  const loadMessages = async (otherUserId: string, reset = true) => {
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

  // Handle broadcast chat selection
  const handleSelectBroadcastChat = () => {
    setIsBroadcastChatActive(true);
    setActiveChat(null);
    setActiveChatId(null);
    setMessages([]);
    setShowMobileChat(true);
  };

  // Handle chat selection
  const handleSelectChat = async (chatId: string, otherUserId: string) => {
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
  };

  // Handle chat created from broadcast
  const handleChatCreatedFromBroadcast = async (chatId: string) => {
    // Reload conversations to get the new chat
    await loadConversations();
    // Select the new chat
    const selectedChat = chats.find((c) => c.id === chatId);
    if (selectedChat) {
      // For clients, the other user is always the astrologer
      const otherUser = selectedChat.astrologerParticipant;
      handleSelectChat(chatId, otherUser.id);
    }
  };

  // Handle sending message
  const handleSendMessage = async (content: string, attachment?: FileAttachment) => {
    if (!activeChat || !user) return;

    // For clients, the other user is always the astrologer
    const otherUser = activeChat.astrologerParticipant;

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

    // Send text message via WebSocket
    const success = sendMessage(otherUser.id, content);

    if (!success) {
      toast.error('Failed to send message. Please check your connection.');
    }

    // Don't add optimistically - let WebSocket handle it
    // This prevents duplicate messages
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
    if (!activeChatId) return;

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
                type: m.type, // ✅ Include message type (TEXT, IMAGE, FILE, AUDIO)
                metadata: m.metadata, // ✅ Include attachment metadata
                createdAt: m.createdAt,
                isRead: m.isRead,
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
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
