'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  ChatIcon,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import {
  AdminTable,
  type AdminTableColumn,
  ChatStatusFilter,
  type ChatStatusFilterValue,
} from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import type { Chat } from '@/types';
import ChatDetailModal from '@/components/chat/ChatDetailModal';
import { useAdminSocket } from '@/hooks';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import { Ban, RefreshCw } from 'lucide-react';
import { generatePageNumbers } from '@/utils/helpers';

interface ChatsResponse {
  chats: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ChatsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ChatStatusFilterValue>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { on, off, isConnected } = useAdminSocket();

  // Fetch chats with TanStack Query (server-side pagination)
  const {
    data: chatsResponse,
    isLoading,
    refetch,
  } = useQuery<ChatsResponse>({
    queryKey: [...ADMIN_QUERY_KEYS.CHATS.LIST(), currentPage, searchTerm, statusFilter],
    queryFn: async () => {
      const response: any = await adminApi.chats.list({
        page: currentPage,
        limit: PAGINATION_DEFAULTS.LIMIT,
        status: statusFilter || undefined,
      });
      // Handle both response formats
      if (response?.chats && response?.pagination) {
        return response;
      } else if (Array.isArray(response)) {
        // Fallback for old format
        return {
          chats: response,
          pagination: {
            page: 1,
            limit: PAGINATION_DEFAULTS.LIMIT,
            total: response.length,
            totalPages: 1,
          },
        };
      }
      return {
        chats: [],
        pagination: { page: 1, limit: PAGINATION_DEFAULTS.LIMIT, total: 0, totalPages: 0 },
      };
    },
  });

  const chats = chatsResponse?.chats || [];
  const pagination = chatsResponse?.pagination || {
    page: 1,
    limit: PAGINATION_DEFAULTS.LIMIT,
    total: 0,
    totalPages: 0,
  };

  // Listen for real-time chat updates via socket
  useEffect(() => {
    if (!isConnected) return;

    const handleNewChat = (newChat: Chat) => {
      console.log('💬 New chat created:', newChat);
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
    };

    const handleChatUpdate = (updatedChat: Chat) => {
      console.log('💬 Chat updated:', updatedChat);
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
    };

    const handleChatAbandoned = (data: {
      chatId: string;
      reason?: string;
      abandonedBy: string;
    }) => {
      console.log('🚫 Chat abandoned:', data);
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
    };

    const handleChatUnblocked = (data: { chatId: string }) => {
      console.log('🔓 Chat unblocked:', data);
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
    };

    const handleChatReopened = (data: { chatId: string }) => {
      console.log('🔓 Chat reopened:', data);
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHATS.LIST() });
    };

    on('chat:new', handleNewChat);
    on('chat:update', handleChatUpdate);
    on('chat:abandoned', handleChatAbandoned);
    on('chat:unblocked', handleChatUnblocked);
    on(ADMIN_SOCKET_EVENTS.CHAT.REOPENED, handleChatReopened);

    return () => {
      off('chat:new', handleNewChat);
      off('chat:update', handleChatUpdate);
      off('chat:abandoned', handleChatAbandoned);
      off('chat:unblocked', handleChatUnblocked);
      off(ADMIN_SOCKET_EVENTS.CHAT.REOPENED, handleChatReopened);
    };
  }, [isConnected, on, off, queryClient]);

  // Reset to page 1 when search term or status filter changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [searchTerm, statusFilter]);

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

  // Filter chats client-side (since backend may not support search)
  const filteredChats = chats.filter((chat) => {
    if (!searchTerm) return true;
    const clientName = chat.clientParticipant?.name?.toLowerCase() || '';
    const astrologerName = chat.astrologerParticipant?.name?.toLowerCase() || '';
    const lastMessage = chat.lastMessageText?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();

    return (
      clientName.includes(search) || astrologerName.includes(search) || lastMessage.includes(search)
    );
  });

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
          <div className="flex items-center gap-2">
            <ChatStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
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

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing{' '}
                <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="text-purple-400">{pagination.total}</span> entries
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {generatePageNumbers(
                    currentPage,
                    pagination.totalPages,
                    PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES
                  ).map((page, index) => (
                    <PaginationItem key={index}>
                      {typeof page === 'number' ? (
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                      }
                      disabled={currentPage === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Chat Detail Modal */}
      <ChatDetailModal chat={selectedChat} isOpen={isModalOpen} onClose={handleCloseModal} />
    </AdminLayout>
  );
}
