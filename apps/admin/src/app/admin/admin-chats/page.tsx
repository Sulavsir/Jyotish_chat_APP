/**
 * Admin Chats Page
 * View and manage admin chat conversations (support widget)
 */

'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import type { AdminChat } from '@/lib/admin-api';
import { useAdminSocket } from '@/hooks';
import { RefreshCw, MessageSquare } from 'lucide-react';
import { generatePageNumbers } from '@/utils/helpers';
import AdminChatDetailModal from '@/components/admin-chat/AdminChatDetailModal';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

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
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'RESOLVED' | 'CLOSED' | ''>('');
  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { on, off, isConnected } = useAdminSocket();

  // Fetch admin chats with TanStack Query
  const {
    data: chatsResponse,
    isLoading,
    refetch,
  } = useQuery<AdminChatsResponse>({
    queryKey: [...ADMIN_QUERY_KEYS.ADMIN_CHAT.LIST(), currentPage, statusFilter, searchTerm],
    queryFn: async () => {
      const response = await adminApi.adminChat.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      });
      return response;
    },
  });

  const chats = chatsResponse?.chats || [];
  const pagination = chatsResponse?.pagination || {
    page: 1,
    limit: ITEMS_PER_PAGE,
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

  // Reset to page 1 when search term or filter changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [searchTerm, statusFilter]);

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
      accessor: (chat) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {chat.user?.name ||
              chat.user?.phone ||
              chat.astrologer?.name ||
              chat.astrologer?.phone ||
              'Unknown Participant'}
          </span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: (chat) => {
        const role =
          chat.participantRole ||
          (chat.astrologerId || chat.astrologer ? 'ASTROLOGER' : 'CLIENT');
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
      accessor: (chat) => <span className="text-sm text-slate-400">{formatDate(chat.lastMessageAt)}</span>,
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Admin Chats</h2>
            <p className="text-slate-400 mt-1">
              Manage support conversations from users
              {isConnected && <span className="ml-2 text-green-400">• Live</span>}
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

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Search
              placeholder="Search by participant name, email, or phone..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='flex items-center '>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="p-2 h-16 items-center bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          </div>
         
        </div>

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={chats}
            columns={columns}
            loading={isLoading}
            keyExtractor={(chat) => chat.id}
            onRowClick={handleChatClick}
            emptyState={{
              icon: <MessageSquare className="w-20 h-20 text-slate-600" />,
              title: searchTerm || statusFilter ? 'No chats found' : 'No admin chats yet',
              description: searchTerm || statusFilter
                ? 'Try adjusting your search terms or filters'
                : 'Admin chat conversations will appear here when users contact support',
            }}
          />
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span> to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of{' '}
                <span className="text-purple-400">{pagination.total}</span> entries
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
                      onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
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
      <AdminChatDetailModal
        chat={selectedChat}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </AdminLayout>
  );
}
