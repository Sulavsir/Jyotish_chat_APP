'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Search } from '@jyotish/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  EmptyState,
  ChatIcon,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { useAdminSocket } from '@/hooks';
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
  STATUS_FILTER_OPTIONS,
  TYPE_FILTER_OPTIONS,
  PAGINATION_DEFAULTS,
  AVATAR_GRADIENTS,
} from '@/constants';
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
  const [currentPage, setCurrentPage] = useState<number>(CHAT_AUDIT_DEFAULTS.PAGE);
  const [itemsPerPage] = useState<number>(CHAT_AUDIT_DEFAULTS.LIMIT);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
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

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.client?.name?.toLowerCase().includes(searchLower) ||
      log.client?.phone?.includes(searchTerm) ||
      log.astrologer?.name?.toLowerCase().includes(searchLower) ||
      log.astrologer?.phone?.includes(searchTerm)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [searchTerm]);

  const pageNumbers = generatePageNumbers(
    currentPage,
    totalPages,
    PAGINATION_DEFAULTS.MAX_VISIBLE_PAGES
  );

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
          <button
            onClick={loadLogs}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex w-full gap-4">
          <div className="w-full">
            <Search
              placeholder="Search by client or astrologer name/phone..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-16 px-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 whitespace-nowrap"
            >
              {TYPE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-16 px-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {STATUS_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          {loading ? (
            <TableSkeleton rows={PAGINATION_DEFAULTS.LIMIT} columns={6} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={<ChatIcon className="w-20 h-20 text-slate-600" />}
              title={searchTerm ? 'No logs found' : 'No chat audit logs'}
              description={
                searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Chat activity logs will appear here as broadcast messages are sent'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Astrologer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Chat Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Accepted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}
                      >
                        {formatAction(log.status)}
                      </span>
                    </TableCell>
                    <TableCell>
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
                          <div className="font-medium text-white">
                            {log.client?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-slate-400">{log.client?.phone}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.astrologer ? (
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
                            <div className="font-medium text-white">
                              {log.astrologer?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-slate-400">{log.astrologer?.phone}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">No astrologer yet</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-300">{formatAction(log.type)}</span>
                    </TableCell>
                    <TableCell>
                      {log.metadata?.chatStatus === 'ENDED' ? (
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 w-fit">
                            ENDED
                          </span>
                          {log.metadata?.chatEndedAt && (
                            <span className="text-xs text-slate-500">
                              {formatDate(log.metadata.chatEndedAt)}
                            </span>
                          )}
                        </div>
                      ) : log.status === 'ACCEPTED' ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-slate-500 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {log.acceptedAt ? formatDate(log.acceptedAt) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
