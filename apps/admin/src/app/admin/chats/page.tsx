'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Search, ChatIcon } from '@jyotish/ui';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS } from '@/constants';
import type { Chat } from '@/types';
import ChatDetailModal from '@/components/chat/ChatDetailModal';
import { useAdminSocket } from '@/hooks';
import { Ban, RefreshCw } from 'lucide-react';

export default function ChatsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { on, off, isConnected } = useAdminSocket();

  // Fetch chats with TanStack Query
  const {
    data: chats = [],
    isLoading,
    refetch,
  } = useQuery<Chat[]>({
    queryKey: ADMIN_QUERY_KEYS.CHATS.LIST(),
    queryFn: async () => {
      const response: any = await adminApi.chats.list({ limit: 1000 });
      if (Array.isArray(response)) {
        return response;
      } else if (response?.chats) {
        return response.chats;
      }
      return [];
    },
  });

  // Listen for real-time chat updates via socket
  useEffect(() => {
    if (!isConnected) return;

    const handleNewChat = (newChat: Chat) => {
      console.log('💬 New chat created:', newChat);
      queryClient.setQueryData<Chat[]>(ADMIN_QUERY_KEYS.CHATS.LIST(), (old = []) => [
        newChat,
        ...old,
      ]);
    };

    const handleChatUpdate = (updatedChat: Chat) => {
      console.log('💬 Chat updated:', updatedChat);
      queryClient.setQueryData<Chat[]>(ADMIN_QUERY_KEYS.CHATS.LIST(), (old = []) =>
        old.map((chat) => (chat.id === updatedChat.id ? { ...chat, ...updatedChat } : chat))
      );
    };

    const handleChatAbandoned = (data: {
      chatId: string;
      reason?: string;
      abandonedBy: string;
    }) => {
      console.log('🚫 Chat abandoned:', data);
      queryClient.setQueryData<Chat[]>(ADMIN_QUERY_KEYS.CHATS.LIST(), (old = []) =>
        old.map((chat) =>
          chat.id === data.chatId
            ? {
                ...chat,
                isAbandonedByAdmin: true,
                abandonedBy: data.abandonedBy,
                abandonReason: data.reason,
                isLocked: true,
                status: 'ENDED',
              }
            : chat
        )
      );
    };

    const handleChatUnblocked = (data: { chatId: string }) => {
      console.log('🔓 Chat unblocked:', data);
      queryClient.setQueryData<Chat[]>(ADMIN_QUERY_KEYS.CHATS.LIST(), (old = []) =>
        old.map((chat) =>
          chat.id === data.chatId
            ? {
                ...chat,
                isAbandonedByAdmin: false,
                abandonedBy: null,
                abandonReason: null,
                isLocked: false,
              }
            : chat
        )
      );
    };

    on('chat:new', handleNewChat);
    on('chat:update', handleChatUpdate);
    on('chat:abandoned', handleChatAbandoned);
    on('chat:unblocked', handleChatUnblocked);

    return () => {
      off('chat:new', handleNewChat);
      off('chat:update', handleChatUpdate);
      off('chat:abandoned', handleChatAbandoned);
      off('chat:unblocked', handleChatUnblocked);
    };
  }, [isConnected, on, off, queryClient]);

  const isImageUrl = (text: string) => {
    if (!text) return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
    return imageExtensions.test(text) || text.includes('/uploads/chat/images/');
  };

  const formatLastMessage = (text: string | null | undefined) => {
    if (!text) return 'No messages yet';
    if (isImageUrl(text)) return '📷 Image';
    if (text.startsWith('http') && text.includes('/uploads/')) return '📎 Attachment';
    return text;
  };

  // Filter chats using useMemo
  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
      const clientName = chat.clientParticipant?.name?.toLowerCase() || '';
      const astrologerName = chat.astrologerParticipant?.name?.toLowerCase() || '';
      const lastMessage = chat.lastMessageText?.toLowerCase() || '';
      const search = searchTerm.toLowerCase();

      return (
        clientName.includes(search) ||
        astrologerName.includes(search) ||
        lastMessage.includes(search)
      );
    });
  }, [chats, searchTerm]);

  const handleChatClick = (chat: Chat) => {
    setSelectedChat(chat);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Delay clearing selected chat to allow modal animation to complete
    setTimeout(() => setSelectedChat(null), 300);
  };

  const columns: AdminTableColumn<Chat>[] = [
    {
      header: 'User',
      accessor: (chat) => (
        <span className="font-medium">{chat.clientParticipant?.name || 'Unknown User'}</span>
      ),
    },
    {
      header: 'Astrologer',
      accessor: (chat) => chat.astrologerParticipant?.name || 'Unknown Astrologer',
    },
    {
      header: 'Last Message',
      accessor: (chat) => (
        <span className="max-w-xs truncate block">{formatLastMessage(chat.lastMessageText)}</span>
      ),
    },
    {
      header: 'Time',
      accessor: (chat) =>
        chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'N/A',
    },
    {
      header: 'Status',
      accessor: (chat) => (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              chat.status === 'ACTIVE'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-slate-500/20 text-slate-400'
            }`}
          >
            {chat.status}
          </span>
          {chat.isAbandonedByAdmin && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
              title={chat.abandonReason || 'Abandoned by admin'}
            >
              <Ban className="h-3 w-3" />
              Abandoned
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Chat Monitor</h2>
            <p className="text-slate-400 mt-1">
              Monitor conversations between users and astrologers
            </p>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search Bar */}
        <Search
          placeholder="Search by user, astrologer, or message content..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={filteredChats}
            columns={columns}
            loading={isLoading}
            keyExtractor={(chat) => chat.id}
            onRowClick={handleChatClick}
            emptyState={{
              icon: <ChatIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No chats found' : 'No active chats',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Chat conversations will appear here once users start communicating with astrologers',
            }}
          />
        </div>
      </div>

      {/* Chat Detail Modal */}
      <ChatDetailModal chat={selectedChat} isOpen={isModalOpen} onClose={handleCloseModal} />
    </AdminLayout>
  );
}
