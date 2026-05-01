'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminApi } from '@/lib/admin-api';
import {
  Search,
  ChatIcon,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@jyotish/ui';
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
  ADMIN_ROUTES,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import type { AdminMonitorChatOrigin, Astrologer, Chat } from '@/types';
import ChatDetailModal from '@/components/chat/ChatDetailModal';
import { useAdminSocket, useDebounce, useDebouncedPageSize } from '@/hooks';
import { ADMIN_SOCKET_EVENTS } from '@/constants/socket-events.constants';
import { Ban } from 'lucide-react';
import { UserParticipantCell } from '@/components/chat';

function ChatOriginBadge({ origin }: { origin?: AdminMonitorChatOrigin | 'UNKNOWN' }) {
  // Legacy API or cached payloads used UNKNOWN; treat like Direct (ad-hoc first-message threads).
  const o: AdminMonitorChatOrigin = origin === 'UNKNOWN' || origin == null ? 'DIRECT' : origin;
  if (o === 'MIXED') {
    return (
      <span className="inline-flex flex-wrap gap-1">
        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
          Broadcast
        </span>
        <span className="inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25">
          Direct
        </span>
      </span>
    );
  }
  if (o === 'BROADCAST') {
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
        Broadcast
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/25">
      Direct
    </span>
  );
}

interface ChatsResponse {
  chats: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type AstrologersPickerResponse = {
  astrologers: Astrologer[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

export default function ChatsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const astrologerIdFromUrl = searchParams.get('astrologerId') ?? '';

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

  const { data: astrologersPickerData } = useQuery<AstrologersPickerResponse>({
    queryKey: [
      ...ADMIN_QUERY_KEYS.ASTROLOGERS.LIST(),
      'chats-filter-picker',
      { page: 1, limit: 500 },
    ],
    queryFn: async () => {
      const response = await adminApi.astrologers.list({ page: 1, limit: 500 });
      if (
        response &&
        typeof response === 'object' &&
        'astrologers' in response &&
        'pagination' in response
      ) {
        return response as AstrologersPickerResponse;
      }
      if (Array.isArray(response)) {
        const list = response as Astrologer[];
        return {
          astrologers: list,
          pagination: { page: 1, limit: 500, total: list.length, totalPages: 1 },
        };
      }
      return {
        astrologers: [],
        pagination: { page: 1, limit: 500, total: 0, totalPages: 0 },
      };
    },
    staleTime: 60_000,
  });

  const pickerAstrologers = astrologersPickerData?.astrologers ?? [];
  const needsAstrologerDetail =
    Boolean(astrologerIdFromUrl) && !pickerAstrologers.some((a) => a.id === astrologerIdFromUrl);

  const { data: astrologerFromUrlDetail } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.DETAIL(astrologerIdFromUrl),
    queryFn: async () => {
      const res = await adminApi.astrologers.get(astrologerIdFromUrl);
      return (res as { astrologer: Astrologer }).astrologer;
    },
    enabled: needsAstrologerDetail,
  });

  const astrologerSelectOptions = useMemo(() => {
    const base = [...pickerAstrologers];
    if (astrologerFromUrlDetail && !base.some((a) => a.id === astrologerFromUrlDetail.id)) {
      base.unshift(astrologerFromUrlDetail);
    }
    return base;
  }, [pickerAstrologers, astrologerFromUrlDetail]);

  const setAstrologerInUrl = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!id || id === 'all') {
      params.delete('astrologerId');
    } else {
      params.set('astrologerId', id);
    }
    const qs = params.toString();
    router.replace(qs ? `${ADMIN_ROUTES.CHATS}?${qs}` : ADMIN_ROUTES.CHATS, { scroll: false });
  };

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
      astrologerIdFromUrl,
    ],
    queryFn: async () => {
      const response = await adminApi.chats.list({
        page: currentPage,
        limit: debouncedRowsPerPage,
        status: statusFilter || undefined,
        search: debouncedSearch.trim() || undefined,
        astrologerId: astrologerIdFromUrl || undefined,
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

  // Reset to page 1 when search term, status filter, astrologer, or rows per page changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, statusFilter, debouncedRowsPerPage, astrologerIdFromUrl]);

  const hasChatFilters =
    Boolean(debouncedSearch.trim()) || Boolean(statusFilter) || Boolean(astrologerIdFromUrl);
  const clearChatFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
    setAstrologerInUrl('all');
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
      header: 'Chat source',
      accessor: (chat) => <ChatOriginBadge origin={chat.chatOrigin} />,
      width: '140px',
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
    <>
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
                <div className="space-y-1 min-w-[200px]">
                  <Select
                    value={astrologerIdFromUrl || 'all'}
                    onValueChange={setAstrologerInUrl}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-900 text-white h-10 w-[200px] max-w-[min(200px,100vw-2rem)]">
                      <SelectValue placeholder="All jyotish" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All jyotish</SelectItem>
                      {astrologerSelectOptions.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name ?? a.phone ?? a.email ?? a.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
          Monitor conversations between users and astrologers. Use the jyotish filter to narrow the
          list.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex sm:hidden w-full flex-col gap-2 min-w-0">
            <div className="space-y-1 w-full">
              <Label className="text-slate-400 text-xs block">Jyotish</Label>
              <Select
                value={astrologerIdFromUrl || 'all'}
                onValueChange={setAstrologerInUrl}
                disabled={isLoading}
              >
                <SelectTrigger className="border-slate-700 bg-slate-900 text-white h-10 w-full">
                  <SelectValue placeholder="All jyotish" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jyotish</SelectItem>
                  {astrologerSelectOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name ?? a.phone ?? a.email ?? a.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-full items-center gap-2 min-w-0">
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
                ? astrologerIdFromUrl
                  ? 'No threads for this jyotish with the current filters. Try clearing status or search.'
                  : 'Try adjusting search or status, or clear filters.'
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
    </>
  );
}
