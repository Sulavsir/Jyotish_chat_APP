'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Search, DocumentIcon } from '@jyotish/ui';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import { ADMIN_ROWS_PER_PAGE_OPTIONS, PAGINATION_DEFAULTS } from '@/constants';
import { useAdminSocket, useDebounce } from '@/hooks';
import { toast } from 'sonner';

/** Max rows loaded when searching (client filter); API has no text search yet. */
const SEARCH_FETCH_LIMIT = 100;

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

function filterLogsBySearch(logs: AuditLog[], search: string): AuditLog[] {
  if (!search.trim()) return logs;
  const searchLower = search.toLowerCase();
  return logs.filter(
    (log) =>
      log.action.toLowerCase().includes(searchLower) ||
      log.resource.toLowerCase().includes(searchLower) ||
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.phone?.includes(search) ||
      log.astrologer?.name?.toLowerCase().includes(searchLower) ||
      log.astrologer?.phone?.includes(search) ||
      log.resourceId?.includes(search)
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({
    page: PAGINATION_DEFAULTS.PAGE,
    limit: PAGINATION_DEFAULTS.LIMIT,
    total: 0,
    totalPages: 0,
  });
  /** Filtered pool when search is active (from a single `limit: SEARCH_FETCH_LIMIT` fetch). */
  const [searchPool, setSearchPool] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(PAGINATION_DEFAULTS.LIMIT);
  const { on, off, isConnected } = useAdminSocket();

  const searchActive = Boolean(debouncedSearch.trim());

  const fetchServerPage = useCallback(async () => {
    setLoading(true);
    try {
      const response: any = await adminApi.auditLogs.list({
        page: currentPage,
        limit: itemsPerPage,
      });
      const rawLogs = Array.isArray(response) ? response : (response?.logs ?? []);
      const pag = response?.pagination;
      setLogs(rawLogs);
      setPagination(
        pag ?? {
          page: currentPage,
          limit: itemsPerPage,
          total: rawLogs.length,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  const fetchSearchPool = useCallback(async () => {
    const q = debouncedSearch.trim();
    if (!q) return;
    setLoading(true);
    try {
      const response: any = await adminApi.auditLogs.list({
        page: 1,
        limit: SEARCH_FETCH_LIMIT,
      });
      const raw = Array.isArray(response) ? response : (response?.logs ?? []);
      setSearchPool(filterLogsBySearch(raw, q));
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    if (searchActive) return;
    void fetchServerPage();
  }, [searchActive, fetchServerPage]);

  useEffect(() => {
    if (!searchActive) return;
    void fetchSearchPool();
  }, [searchActive, fetchSearchPool]);

  useLayoutEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, itemsPerPage]);

  useEffect(() => {
    if (!searchActive) return;
    const total = searchPool.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / itemsPerPage);
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [searchActive, searchPool, itemsPerPage, currentPage]);

  useEffect(() => {
    if (!isConnected) return;

    const handleNewAuditLog = (newLog: AuditLog) => {
      if (newLog.action.includes('LOGIN') || newLog.action.includes('LOGOUT')) {
        const actor = newLog.user?.name || newLog.astrologer?.name || 'User';
        toast.info(`${actor} ${newLog.action.toLowerCase().replace('_', ' ')}`);
      }
      if (!debouncedSearch.trim()) {
        void fetchServerPage();
      }
    };

    on('auditLog:new', handleNewAuditLog);

    return () => {
      off('auditLog:new', handleNewAuditLog);
    };
  }, [isConnected, on, off, debouncedSearch, fetchServerPage]);

  const handlePageSizeChange = (size: number) => {
    if (size === itemsPerPage) {
      if (searchActive) void fetchSearchPool();
      else void fetchServerPage();
      return;
    }
    setItemsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const handleRefresh = () => {
    if (searchActive) void fetchSearchPool();
    else void fetchServerPage();
  };

  const { displayLogs, displayPagination } = useMemo(() => {
    if (searchActive) {
      const total = searchPool.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / itemsPerPage);
      const safePage = totalPages === 0 ? 1 : Math.min(currentPage, Math.max(1, totalPages));
      const start = (safePage - 1) * itemsPerPage;
      return {
        displayLogs: searchPool.slice(start, start + itemsPerPage),
        displayPagination: {
          page: safePage,
          limit: itemsPerPage,
          total,
          totalPages,
        },
      };
    }
    return {
      displayLogs: logs,
      displayPagination: pagination,
    };
  }, [searchActive, searchPool, logs, pagination, currentPage, itemsPerPage]);

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

  const showPagination = !loading && (searchActive ? searchPool.length > 0 : pagination.total > 0);

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Audit Logs
            </h1>
            <AdminRefreshButton
              onClick={handleRefresh}
              loading={loading}
              className="shrink-0 self-start"
            />
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Track all activities and changes on the platform
            {isConnected && <span className="ml-2 text-green-400">• Live</span>}
          </p>
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
            data={displayLogs}
            columns={columns}
            loading={loading}
            keyExtractor={(log) => log.id}
            currentPage={displayPagination.page}
            itemsPerPage={displayPagination.limit}
            emptyState={{
              icon: <DocumentIcon className="w-20 h-20 text-slate-600" />,
              title: debouncedSearch ? 'No logs found' : 'No audit logs',
              description: debouncedSearch
                ? 'Try adjusting your search terms'
                : 'Activity logs will appear here as actions are performed on the platform',
            }}
          />
        </div>

        {showPagination && (
          <AdminListPaginationSection
            pagination={{
              page: displayPagination.page,
              limit: displayPagination.limit,
              total: displayPagination.total,
              totalPages: Math.max(1, displayPagination.totalPages),
            }}
            onPageChange={setCurrentPage}
            pageSize={itemsPerPage}
            pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
            onPageSizeChange={handlePageSizeChange}
            disabled={loading}
          />
        )}
      </div>
    </AdminLayout>
  );
}
