'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  DocumentIcon,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { RefreshCw } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { useAdminSocket, useDebounce } from '@/hooks';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  astrologerId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    phone: string;
  };
  astrologer?: {
    id: string;
    name: string;
    phone: string;
  };
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { on, off, isConnected } = useAdminSocket();

  useEffect(() => {
    loadLogs();
  }, []);

  // Real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const handleNewAuditLog = (newLog: AuditLog) => {
      console.log('📋 New audit log:', newLog);

      setLogs((prev) => [newLog, ...prev]);

      // Show toast notification for important events
      if (newLog.action.includes('LOGIN') || newLog.action.includes('LOGOUT')) {
        const actor = newLog.user?.name || newLog.astrologer?.name || 'User';
        toast.info(`${actor} ${newLog.action.toLowerCase().replace('_', ' ')}`);
      }
    };

    on('auditLog:new', handleNewAuditLog);

    return () => {
      off('auditLog:new', handleNewAuditLog);
    };
  }, [isConnected, on, off]);

  const loadLogs = async () => {
    try {
      const response: any = await adminApi.auditLogs.list({ limit: 100 });
      if (Array.isArray(response)) {
        setLogs(response);
      } else if (response?.logs) {
        setLogs(response.logs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('REGISTER'))
      return 'bg-green-500/20 text-green-400';
    if (action.includes('UPDATE')) return 'bg-blue-500/20 text-blue-400';
    if (action.includes('DELETE')) return 'bg-red-500/20 text-red-400';
    if (action.includes('LOGIN')) return 'bg-purple-500/20 text-purple-400';
    if (action.includes('LOGOUT')) return 'bg-orange-500/20 text-orange-400';
    if (action.includes('REQUEST')) return 'bg-yellow-500/20 text-yellow-400';
    if (action.includes('ACCEPT')) return 'bg-emerald-500/20 text-emerald-400';
    if (action.includes('EXPIRE') || action.includes('CANCEL'))
      return 'bg-gray-500/20 text-gray-400';
    return 'bg-slate-500/20 text-slate-400';
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, ' ');
  };

  const getActorName = (log: AuditLog) => {
    if (log.user) {
      return `${log.user.name || 'User'} (${log.user.phone})`;
    }
    if (log.astrologer) {
      return `${log.astrologer.name || 'Astrologer'} (${log.astrologer.phone})`;
    }
    return 'System';
  };

  const filteredLogs = logs.filter((log) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource.toLowerCase().includes(searchLower) ||
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.phone?.includes(debouncedSearch) ||
      log.astrologer?.name?.toLowerCase().includes(searchLower) ||
      log.astrologer?.phone?.includes(debouncedSearch) ||
      log.resourceId?.includes(debouncedSearch)
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('ellipsis-start');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('ellipsis-end');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const columns: AdminTableColumn<AuditLog>[] = [
    {
      header: 'Action',
      accessor: (log) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}
        >
          {formatAction(log.action)}
        </span>
      ),
    },
    {
      header: 'Resource',
      accessor: (log) => <span className="font-medium text-white">{log.resource}</span>,
    },
    {
      header: 'Actor',
      accessor: (log) => <span className="text-slate-300">{getActorName(log)}</span>,
    },
    {
      header: 'IP Address',
      accessor: (log) => (
        <span className="text-sm text-slate-400 font-mono">{log.ipAddress || 'N/A'}</span>
      ),
    },
    {
      header: 'Time',
      accessor: (log) => (
        <span className="text-sm text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
      ),
    },
    {
      header: 'Resource ID',
      accessor: (log) => (
        <span className="font-mono text-xs text-slate-500">
          {log.resourceId ? `${log.resourceId.substring(0, 8)}...` : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        {/* Header — same responsive pattern as Horoscopes */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold cosmic-text truncate">Audit Logs</h1>
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={loadLogs}
                className="border-slate-700 text-white hover:bg-slate-800 shrink-0 w-auto sm:hidden"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Track all activities and changes on the platform
              {isConnected && <span className="ml-2 text-green-400">• Live</span>}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={loadLogs}
              className="hidden sm:inline-flex border-slate-700 text-white hover:bg-slate-800 w-full sm:w-auto"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="w-full">
          <Search
            placeholder="Search by action, resource, user name, or phone..."
            value={searchTerm}
            onSearch={setSearchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={paginatedLogs}
            columns={columns}
            loading={loading}
            keyExtractor={(log) => log.id}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            emptyState={{
              icon: <DocumentIcon className="w-20 h-20 text-slate-600" />,
              title: debouncedSearch ? 'No logs found' : 'No audit logs',
              description: debouncedSearch
                ? 'Try adjusting your search terms'
                : 'Activity logs will appear here as actions are performed on the platform',
            }}
          />
        </div>

        {!loading && filteredLogs.length > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="text-sm text-white font-medium text-center sm:text-left">
                Showing <span className="text-purple-400">{startIndex + 1}</span> to{' '}
                <span className="text-purple-400">{Math.min(endIndex, filteredLogs.length)}</span>{' '}
                of <span className="text-purple-400">{filteredLogs.length}</span> entries
              </div>

              <Pagination className="w-full overflow-x-auto">
                <PaginationContent className="flex-wrap justify-center gap-1 sm:justify-end">
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, index) => (
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
