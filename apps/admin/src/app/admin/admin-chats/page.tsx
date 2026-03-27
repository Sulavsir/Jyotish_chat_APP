/**
 * Admin Chats Page
 * View and manage admin chat conversations (support widget)
 */

'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Search } from '@jyotish/ui';
import {
  AdminTable,
  AdminClearFiltersButton,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
  AdminChatStatusFilter,
  type AdminChatStatusFilterValue,
} from '@/components/admin';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import type { AdminChat } from '@/lib/admin-api';
import { useAdminSocket, useDebounce } from '@/hooks';
import { MessageSquare } from 'lucide-react';
import AdminChatDetailModal from '@/components/admin-chat/AdminChatDetailModal';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import { UserParticipantCell } from '@/components/chat';

interface AdminChatsResponse {
  chats: AdminChat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminChatsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(PAGINATION_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<AdminChatStatusFilterValue>('');
  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { on, off, isConnected } = useAdminSocket();

  // Fetch admin chats with TanStack Query
  const {
    data: chatsResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<AdminChatsResponse>({
    queryKey: [
      ...ADMIN_QUERY_KEYS.ADMIN_CHAT.LIST(),
      currentPage,
      statusFilter,
      debouncedSearch,
      rowsPerPage,
    ],
    queryFn: async () => {
      const response = await adminApi.adminChat.list({
        page: currentPage,
        limit: rowsPerPage,
        status: statusFilter || undefined,
        search: debouncedSearch.trim() || undefined,
      });
      return response;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) {
      void refetch();
      return;
    }
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const chats = chatsResponse?.chats || [];
  const pagination = chatsResponse?.pagination || {
    page: 1,
    limit: rowsPerPage,
    total: 0,
    totalPages: 0,
  };

  // Listen for real-time admin chat updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNewMessage = (data: { chatId: string; message: unknown; chat: AdminChat }) => {
      console.log('💬 New admin chat message:', data);
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.ALL });
      if (selectedChat?.id === data.chatId) {
        setSelectedChat(data.chat);
      }
    };

    const handleChatUpdate = (data: { chat: AdminChat }) => {
      console.log('💬 Admin chat updated:', data);
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ADMIN_CHAT.ALL });
      if (selectedChat?.id === data.chat.id) {
        setSelectedChat(data.chat);
      }
    };

    on(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.NEW_MESSAGE, handleNewMessage);
    on(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.MESSAGE, handleChatUpdate);

    return () => {
      off(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.NEW_MESSAGE, handleNewMessage);
      off(ADMIN_SOCKET_EVENTS.ADMIN_CHAT.MESSAGE, handleChatUpdate);
    };
  }, [isConnected, on, off, queryClient, selectedChat]);

  // Reset to page 1 when search term, filter, or rows per page changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, statusFilter, rowsPerPage]);

  const hasAdminChatFilters = Boolean(debouncedSearch.trim()) || Boolean(statusFilter);
  const clearAdminChatFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const handleChatClick = (chat: AdminChat) => {
    setSelectedChat(chat);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedChat(null), 300);
  };

  const columns: AdminTableColumn<AdminChat>[] = [
    {
      header: 'Participant',
      accessor: (chat) => {
        if (chat.user) {
          return (
            <UserParticipantCell
              label={chat.participantRole === 'ASTROLOGER' ? 'Jyotish' : 'Client'}
              name={chat.user.name}
              phone={chat.user.phone}
              email={chat.user.email}
            />
          );
        }
        if (chat.astrologer) {
          return (
            <UserParticipantCell
              label="Jyotish"
              name={chat.astrologer.name}
              phone={chat.astrologer.phone}
              email={chat.astrologer.email}
            />
          );
        }
        return <span className="text-slate-500 text-sm">Unknown participant</span>;
      },
    },
    {
      header: 'Role',
      accessor: (chat) => {
        const role =
          chat.participantRole || (chat.astrologerId || chat.astrologer ? 'ASTROLOGER' : 'CLIENT');
        return (
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              role === 'ASTROLOGER'
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-emerald-500/20 text-emerald-300'
            }`}
          >
            {role}
          </span>
        );
      },
    },
    {
      header: 'Last Message',
      accessor: (chat) => (
        <span className="max-w-xs truncate block text-sm">
          {chat.lastMessageText || 'No messages yet'}
        </span>
      ),
    },
    {
      header: 'Time',
      accessor: (chat) => (
        <span className="text-sm text-slate-400">{formatDate(chat.lastMessageAt)}</span>
      ),
    },
    {
      header: 'Status',
      accessor: (chat) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            chat.status === 'ACTIVE'
              ? 'bg-green-500/20 text-green-400'
              : chat.status === 'RESOLVED'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-slate-500/20 text-slate-400'
          }`}
        >
          {chat.status}
        </span>
      ),
    },
    {
      header: 'Unread',
      accessor: (chat) => (
        <div className="flex items-center gap-2">
          {!chat.adminRead && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
              !
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold text-white break-words">
              Admin Chats
            </h2>
            <AdminRefreshButton
              onClick={() => refetch()}
              loading={isLoading || isFetching}
              className="shrink-0 self-start"
            />
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Manage support conversations from users
            {isConnected && <span className="ml-2 text-green-400">• Live</span>}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="w-full min-w-0">
            <Search
              containerClassName="w-full"
              placeholder="Search by participant name, email, or phone..."
              value={searchTerm}
              onSearch={(value) => {
                setSearchTerm(value);
                setCurrentPage(PAGINATION_DEFAULTS.PAGE);
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex w-full min-w-0 flex-row items-end justify-end gap-2 sm:gap-3">
            <AdminChatStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end">
            <AdminClearFiltersButton
              show={hasAdminChatFilters}
              onClear={clearAdminChatFilters}
              disabled={isLoading}
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
              icon: <MessageSquare className="w-16 h-16 text-slate-600" />,
              title: hasAdminChatFilters ? 'No chats found' : 'No admin chats yet',
              description: hasAdminChatFilters
                ? 'Try adjusting search or status, or clear filters.'
                : 'Admin chat conversations will appear here when users contact support',
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
      <AdminChatDetailModal chat={selectedChat} isOpen={isModalOpen} onClose={handleCloseModal} />
    </AdminLayout>
  );
}
