'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Search, ChatIcon, Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@jyotish/ui';
import { RefreshCw } from 'lucide-react';
import { AdminTable, type AdminTableColumn, ChatAuditStatusFilter, ChatAuditTypeFilter, type ChatAuditStatusFilterValue, type ChatAuditTypeFilterValue } from '@/components/admin';
import { useAdminSocket, useDebounce } from '@/hooks';
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
  AVATAR_GRADIENTS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import { AdminClearFiltersButton } from '@/components/admin';
import {
  getImageUrl,
  formatAction,
  getStatusColor,
  getInitials,
  generatePageNumbers,
  formatDate,
} from '@/utils';

export default function ChatAuditPage() {
  const [logs, setLogs] = useState<ChatAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState<number>(CHAT_AUDIT_DEFAULTS.PAGE);
  const [itemsPerPage] = useState<number>(CHAT_AUDIT_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<ChatAuditStatusFilterValue>('');
  const [typeFilter, setTypeFilter] = useState<ChatAuditTypeFilterValue>('');
  const { on, off, isConnected } = useAdminSocket();

  useEffect(() => {
    loadLogs();
  }, [statusFilter, typeFilter]);

  // Real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNewChatAudit = (newLog: ChatAuditNewEvent) => {
      console.log('📋 New chat audit log:', newLog);
      setLogs((prev) => [newLog as ChatAuditLog, ...prev]);

      const clientName = newLog.client?.name || newLog.client?.phone || 'User';
      toast.info(`${clientName} sent a broadcast message`);
    };

    const handleChatAuditUpdate = (update: ChatAuditUpdateEvent) => {
      console.log('📋 Chat audit update:', update);
      setLogs((prev) =>
        prev.map((log) =>
          log.id === update.id
            ? {
                ...log,
                status: update.status,
                astrologer: update.astrologer,
                acceptedAt: update.acceptedAt,
              }
            : log
        )
      );

      if (update.status === 'ACCEPTED') {
        toast.success('Broadcast message accepted by astrologer');
      }
    };

    const handleChatEnded = (event: ChatAuditChatEndedEvent) => {
      console.log('📋 Chat ended:', event);
      setLogs((prev) =>
        prev.map((log) =>
          log.id === event.id
            ? {
                ...log,
                metadata: {
                  ...log.metadata,
                  chatStatus: event.chatStatus,
                  chatEndedAt: event.chatEndedAt,
                  chatEndedBy: event.chatEndedBy,
                },
              }
            : log
        )
      );

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
  }, [isConnected, on, off]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params: {
        limit: number;
        status?: string;
        type?: string;
      } = {
        limit: CHAT_AUDIT_DEFAULTS.LOAD_LIMIT,
      };

      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      const response = (await adminApi.chatAudit.list(params)) as ChatAuditListResponse;

      if (response?.logs) {
        setLogs(response.logs);
      }
    } catch (error) {
      console.error('Failed to load chat audit logs:', error);
      toast.error('Failed to load chat audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => {
      return (
        log.client?.name?.toLowerCase().includes(q) ||
        log.client?.phone?.includes(debouncedSearch) ||
        (log.client?.email && log.client.email.toLowerCase().includes(q)) ||
        log.astrologer?.name?.toLowerCase().includes(q) ||
        log.astrologer?.phone?.includes(debouncedSearch) ||
        (log.astrologer?.email && log.astrologer.email.toLowerCase().includes(q)) ||
        (log.content && log.content.toLowerCase().includes(q))
      );
    });
  }, [logs, debouncedSearch]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, statusFilter, typeFilter]);

  const hasChatAuditFilters =
    Boolean(debouncedSearch.trim()) || Boolean(statusFilter) || Boolean(typeFilter);

  const clearChatAuditFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setCurrentPage(CHAT_AUDIT_DEFAULTS.PAGE);
  };

  const pageNumbers = generatePageNumbers(
    currentPage,
    totalPages,
    PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES
  );

  const columns: AdminTableColumn<ChatAuditLog>[] = [
    {
      header: 'Status',
      accessor: (log) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
          {formatAction(log.status)}
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
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS.CLIENT} flex items-center justify-center text-white text-xs font-bold`}>
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
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS.ASTROLOGER} flex items-center justify-center text-white text-xs font-bold`}>
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
        ) : (
          <span className="text-slate-500 text-sm">-</span>
        ),
    },
    {
      header: 'Created',
      accessor: (log) => <span className="text-sm text-slate-400">{formatDate(log.createdAt)}</span>,
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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Chat Audit</h2>
            <p className="text-slate-400 mt-1">
              Monitor broadcast messages, chat requests, and acceptances
              {isConnected && <span className="ml-2 text-green-400">• Live</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ChatAuditTypeFilter
              value={typeFilter}
              onChange={setTypeFilter}
              disabled={loading}
            />
            <ChatAuditStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              disabled={loading}
            />
            <Button
              onClick={loadLogs}
              variant="outline"
              size="sm"
              disabled={loading}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <div className="min-w-0 flex-1">
            <Search
              placeholder="Search by name, phone, email, or message..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AdminClearFiltersButton
            show={hasChatAuditFilters}
            onClear={clearChatAuditFilters}
            disabled={loading}
          />
        </div>

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={paginatedLogs}
            columns={columns}
            loading={loading}
            keyExtractor={(log) => log.id}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            emptyState={{
              icon: <ChatIcon className="w-20 h-20 text-slate-600" />,
              title: hasChatAuditFilters ? 'No logs found' : 'No chat audit logs',
              description: hasChatAuditFilters
                ? 'Try adjusting search or filters, or clear filters to see all loaded logs.'
                : 'Chat activity logs will appear here as broadcast messages are sent',
            }}
          />
        </div>

        {/* Pagination */}
        {!loading && filteredLogs.length > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing <span className="text-purple-400">{startIndex + 1}</span> to{' '}
                <span className="text-purple-400">{Math.min(endIndex, filteredLogs.length)}</span>{' '}
                of <span className="text-purple-400">{filteredLogs.length}</span> entries
              </div>

              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {pageNumbers.map((page, index) => (
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
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
