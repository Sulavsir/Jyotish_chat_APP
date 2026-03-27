'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Search, ChatIcon } from '@jyotish/ui';
import {
  AdminTable,
  AdminClearFiltersButton,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
  ChatStatusFilter,
  type ChatStatusFilterValue,
} from '@/components/admin';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import type { Chat } from '@/types';
import ChatDetailModal from '@/components/chat/ChatDetailModal';
import { useAdminSocket, useDebounce, useDebouncedPageSize } from '@/hooks';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import { Ban } from 'lucide-react';
import { UserParticipantCell } from '@/components/chat';

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
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<ChatStatusFilterValue>('');
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { on, off, isConnected } = useAdminSocket();

  // Fetch chats with TanStack Query (server-side pagination)
  const {
    data: chatsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ChatsResponse>({
    queryKey: [
      ...ADMIN_QUERY_KEYS.CHATS.LIST(),
      currentPage,
      statusFilter,
      debouncedSearch,
      debouncedRowsPerPage,
    ],
    queryFn: async () => {
      const response = await adminApi.chats.list({
        page: currentPage,
        limit: debouncedRowsPerPage,
        status: statusFilter || undefined,
        search: debouncedSearch.trim() || undefined,
      });
      if (
        response &&
        typeof response === 'object' &&
        'chats' in response &&
        'pagination' in response
      ) {
        return response as ChatsResponse;
      }
      if (Array.isArray(response)) {
        return {
          chats: response as Chat[],
          pagination: {
            page: 1,
            limit: debouncedRowsPerPage,
            total: response.length,
            totalPages: 1,
          },
        };
      }
      return {
        chats: [],
        pagination: { page: 1, limit: debouncedRowsPerPage, total: 0, totalPages: 0 },
      };
    },
    refetchOnWindowFocus: false,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const chats = chatsResponse?.chats || [];
  const pagination = chatsResponse?.pagination || {
    page: 1,
    limit: debouncedRowsPerPage,
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

  // Reset to page 1 when search term, status filter, or rows per page changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, statusFilter, debouncedRowsPerPage]);

  const hasChatFilters = Boolean(debouncedSearch.trim()) || Boolean(statusFilter);
  const clearChatFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

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
        <UserParticipantCell
          name={chat.clientParticipant?.name}
          phone={chat.clientParticipant?.phone}
          email={chat.clientParticipant?.email}
        />
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
      <div className="space-y-2 sm:space-y-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold text-white break-words">
              Chat Monitor
            </h2>

            <div className="flex items-center gap-2 shrink-0 self-start flex-wrap justify-end">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isLoading || isFetching}
                className="shrink-0"
              />

              <div className="hidden sm:flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <ChatStatusFilter
                  value={statusFilter}
                  onChange={setStatusFilter}
                  disabled={isLoading}
                />
                <AdminClearFiltersButton
                  show={hasChatFilters}
                  onClear={clearChatFilters}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        </div>
        <p className="text-sm sm:text-base text-slate-400">
          Monitor conversations between users and astrologers
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex sm:hidden w-full items-center gap-2 min-w-0">
            <div className="min-w-0 flex-1 [&_button]:w-full">
              <ChatStatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                disabled={isLoading}
              />
            </div>
            <AdminClearFiltersButton
              show={hasChatFilters}
              onClear={clearChatFilters}
              disabled={isLoading}
            />
          </div>
          <div className="w-full min-w-0">
            <Search
              containerClassName="w-full"
              placeholder="Search by name, phone, email, or last message..."
              value={searchTerm}
              onSearch={(value) => {
                setSearchTerm(value);
                setCurrentPage(PAGINATION_DEFAULTS.PAGE);
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={chats}
            columns={columns}
            loading={isLoading}
            keyExtractor={(chat) => chat.id}
            showSerialNumber
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            onRowClick={handleChatClick}
            emptyState={{
              icon: <ChatIcon className="w-16 h-16 text-slate-600" />,
              title: hasChatFilters ? 'No chats found' : 'No active chats',
              description: hasChatFilters
                ? 'Try adjusting search or status, or clear filters.'
                : 'Chat conversations will appear here once users start communicating with astrologers',
            }}
          />
        </div>

        {!isLoading && (
          <AdminListPaginationSection
            pagination={{
              page: pagination.page,
              limit: pagination.limit,
              total: pagination.total,
              totalPages: pagination.totalPages,
            }}
            onPageChange={setCurrentPage}
            pageSize={rowsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={isFetching}
          />
        )}
      </div>

      {/* Chat Detail Modal */}
      <ChatDetailModal chat={selectedChat} isOpen={isModalOpen} onClose={handleCloseModal} />
    </AdminLayout>
  );
}
