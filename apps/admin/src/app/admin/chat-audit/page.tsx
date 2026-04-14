'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import { Search, ChatIcon } from '@jyotish/ui';
import {
  AdminTable,
  AdminClearFiltersButton,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
  ChatAuditStatusFilter,
  ChatAuditTypeFilter,
  type ChatAuditStatusFilterValue,
  type ChatAuditTypeFilterValue,
} from '@/components/admin';
import { useAdminSocket, useDebounce, useDebouncedPageSize } from '@/hooks';
import { toast } from 'sonner';
import {
  ChatAuditLog,
  ChatAuditNewEvent,
  ChatAuditUpdateEvent,
  ChatAuditChatEndedEvent,
  ChatAuditListResponse,
} from '@/types';
import {
  CHAT_AUDIT_DEFAULTS,
  SOCKET_EVENTS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  AVATAR_GRADIENTS,
  ADMIN_SEARCH_DEBOUNCE_MS,
  ADMIN_QUERY_KEYS,
} from '@/constants';
import { getImageUrl, formatAction, getStatusColor, getInitials, formatDate } from '@/utils';

export default function ChatAuditPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState<number>(CHAT_AUDIT_DEFAULTS.PAGE);
  const {
    pageSize: itemsPerPage,
    setPageSize: setItemsPerPage,
    debouncedPageSize: debouncedItemsPerPage,
  } = useDebouncedPageSize(CHAT_AUDIT_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<ChatAuditStatusFilterValue>('');
  const [typeFilter, setTypeFilter] = useState<ChatAuditTypeFilterValue>('');
  const { on, off, isConnected } = useAdminSocket();

  const {
    data: listResponse,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<ChatAuditListResponse>({
    queryKey: [
      ...ADMIN_QUERY_KEYS.CHAT_AUDIT.LIST(),
      currentPage,
      debouncedSearch.trim(),
      statusFilter,
      typeFilter,
      debouncedItemsPerPage,
    ],
    queryFn: async () => {
      const params: {
        page: number;
        limit: number;
        status?: string;
        type?: string;
        search?: string;
      } = {
        page: currentPage,
        limit: debouncedItemsPerPage,
      };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const q = debouncedSearch.trim();
      if (q) params.search = q;
      try {
        return (await adminApi.chatAudit.list(params)) as ChatAuditListResponse;
      } catch (error) {
        console.error('Failed to load chat audit logs:', error);
        toast.error('Failed to load chat audit logs');
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });

  const logs = listResponse?.logs ?? [];
  const pagination = listResponse?.pagination ?? {
    page: currentPage,
    limit: debouncedItemsPerPage,
    total: 0,
    totalPages: 0,
  };

  const handlePageSizeChange = (size: number) => {
    if (size === itemsPerPage) return;
    setItemsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, statusFilter, typeFilter]);

  // Real-time updates — invalidate list so server pagination stays in sync
  useEffect(() => {
    if (!isConnected) return;

    const invalidateChatAudit = () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.CHAT_AUDIT.ALL });
    };

    const handleNewChatAudit = (newLog: ChatAuditNewEvent) => {
      console.log('📋 New chat audit log:', newLog);
      invalidateChatAudit();
      const clientName = newLog.client?.name || newLog.client?.phone || 'User';
      toast.info(`${clientName} sent a broadcast message`);
    };

    const handleChatAuditUpdate = (update: ChatAuditUpdateEvent) => {
      console.log('📋 Chat audit update:', update);
      invalidateChatAudit();

      if (update.status === 'ACCEPTED') {
        toast.success('Broadcast message accepted by astrologer');
      }
    };

    const handleChatEnded = (event: ChatAuditChatEndedEvent) => {
      console.log('📋 Chat ended:', event);
      invalidateChatAudit();
      toast.info('Chat has ended');
    };

    on(SOCKET_EVENTS.CHAT_AUDIT_NEW, handleNewChatAudit);
    on(SOCKET_EVENTS.CHAT_AUDIT_UPDATE, handleChatAuditUpdate);
    on(SOCKET_EVENTS.CHAT_AUDIT_CHAT_ENDED, handleChatEnded);

    return () => {
      off(SOCKET_EVENTS.CHAT_AUDIT_NEW, handleNewChatAudit);
      off(SOCKET_EVENTS.CHAT_AUDIT_UPDATE, handleChatAuditUpdate);
      off(SOCKET_EVENTS.CHAT_AUDIT_CHAT_ENDED, handleChatEnded);
    };
  }, [isConnected, on, off, queryClient]);

  const hasChatAuditFilters =
    Boolean(debouncedSearch.trim()) || Boolean(statusFilter) || Boolean(typeFilter);

  const clearChatAuditFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setCurrentPage(CHAT_AUDIT_DEFAULTS.PAGE);
  };

  const columns: AdminTableColumn<ChatAuditLog>[] = [
    {
      header: 'Status',
      accessor: (log) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}
        >
          {log.metadata?.assignedByAdmin === true ? 'Admin Assignee' : formatAction(log.status)}
        </span>
      ),
    },
    {
      header: 'Client',
      accessor: (log) => (
        <div className="flex items-center gap-2">
          {getImageUrl(log.client?.profilePhoto) ? (
            <img
              src={getImageUrl(log.client.profilePhoto)!}
              alt={log.client.name || log.client.phone}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS.CLIENT} flex items-center justify-center text-white text-xs font-bold`}
            >
              {getInitials(log.client?.name, log.client?.phone, 'U')}
            </div>
          )}
          <div>
            <div className="font-medium text-white">{log.client?.name || 'Unknown'}</div>
            <div className="text-xs text-slate-400">{log.client?.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Astrologer',
      accessor: (log) =>
        log.astrologer ? (
          <div className="flex items-center gap-2">
            {getImageUrl(log.astrologer?.profilePhoto) ? (
              <img
                src={getImageUrl(log.astrologer.profilePhoto)!}
                alt={log.astrologer.name || log.astrologer.phone}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS.ASTROLOGER} flex items-center justify-center text-white text-xs font-bold`}
              >
                {getInitials(log.astrologer?.name, log.astrologer?.phone, 'A')}
              </div>
            )}
            <div>
              <div className="font-medium text-white">{log.astrologer?.name || 'Unknown'}</div>
              <div className="text-xs text-slate-400">{log.astrologer?.phone}</div>
            </div>
          </div>
        ) : (
          <span className="text-slate-500 text-sm">No astrologer yet</span>
        ),
    },
    {
      header: 'Type',
      accessor: (log) => <span className="text-sm text-slate-300">{formatAction(log.type)}</span>,
    },
    {
      header: 'Chat Status',
      accessor: (log) =>
        log.metadata?.chatStatus === 'ENDED' ? (
          <div className="flex flex-col gap-1">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 w-fit">
              ENDED
            </span>
            {log.metadata?.chatEndedAt && (
              <span className="text-xs text-slate-500">{formatDate(log.metadata.chatEndedAt)}</span>
            )}
          </div>
        ) : log.status === 'ACCEPTED' ? (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">
            ACTIVE
          </span>
        ) : log.status === 'EXPIRED' ? (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-400">
            EXPIRED
          </span>
        ) : (
          <span className="text-slate-500 text-sm">-</span>
        ),
    },
    {
      header: 'Created',
      accessor: (log) => (
        <span className="text-sm text-slate-400">{formatDate(log.createdAt)}</span>
      ),
    },
    {
      header: 'Accepted',
      accessor: (log) => (
        <span className="text-sm text-slate-400">
          {log.acceptedAt ? formatDate(log.acceptedAt) : '-'}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="min-w-0 flex-1 pr-1 text-2xl font-bold text-white break-words">
              Chat Audit
            </h2>
            <div className="flex items-center gap-2 shrink-0 self-start flex-wrap justify-end">
              <AdminRefreshButton
                onClick={() => void refetch()}
                loading={isFetching}
                className="shrink-0"
              />
              <div className="hidden sm:flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <ChatAuditTypeFilter
                  value={typeFilter}
                  onChange={setTypeFilter}
                  disabled={isLoading}
                />
                <ChatAuditStatusFilter
                  value={statusFilter}
                  onChange={setStatusFilter}
                  disabled={isLoading}
                />
                <AdminClearFiltersButton
                  show={hasChatAuditFilters}
                  onClear={clearChatAuditFilters}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Monitor broadcast messages, chat requests, and acceptances
            {isConnected && <span className="ml-2 text-green-400">• Live</span>}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:hidden w-full">
            <div className="w-full [&_button]:w-full">
              <ChatAuditTypeFilter value={typeFilter} onChange={setTypeFilter} disabled={isLoading} />
            </div>
            <div className="flex w-full items-center gap-2 min-w-0">
              <div className="min-w-0 flex-1 [&_button]:w-full">
                <ChatAuditStatusFilter
                  value={statusFilter}
                  onChange={setStatusFilter}
                  disabled={isLoading}
                />
              </div>
              <AdminClearFiltersButton
                show={hasChatAuditFilters}
                onClear={clearChatAuditFilters}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="w-full min-w-0">
            <Search
              containerClassName="w-full"
              placeholder="Search by name, phone, email, or message..."
              value={searchTerm}
              onSearch={(value) => {
                setSearchTerm(value);
                setCurrentPage(CHAT_AUDIT_DEFAULTS.PAGE);
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={logs}
            columns={columns}
            loading={isLoading}
            keyExtractor={(log) => log.id}
            showSerialNumber
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            emptyState={{
              icon: <ChatIcon className="w-16 h-16 text-slate-600" />,
              title: hasChatAuditFilters ? 'No logs found' : 'No chat audit logs',
              description: hasChatAuditFilters
                ? 'Try adjusting search or filters, or clear filters to see all loaded logs.'
                : 'Chat activity logs will appear here as broadcast messages are sent',
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
            onPageChange={handlePageChange}
            pageSize={itemsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={isFetching}
          />
        )}
      </div>
    </>
  );
}
