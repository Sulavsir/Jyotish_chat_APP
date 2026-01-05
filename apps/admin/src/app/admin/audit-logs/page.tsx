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
  DocumentIcon,
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
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(searchLower) ||
      log.resource.toLowerCase().includes(searchLower) ||
      log.user?.name?.toLowerCase().includes(searchLower) ||
      log.user?.phone?.includes(searchTerm) ||
      log.astrologer?.name?.toLowerCase().includes(searchLower) ||
      log.astrologer?.phone?.includes(searchTerm) ||
      log.resourceId?.includes(searchTerm)
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
  }, [searchTerm]);

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Audit Logs</h2>
            <p className="text-slate-400 mt-1">
              Track all activities and changes on the platform
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

        {/* Search Bar */}
        <Search
          placeholder="Search by action, resource, user name, or phone..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          {loading ? (
            <TableSkeleton rows={15} columns={6} />
          ) : filteredLogs.length === 0 ? (
            <EmptyState
              icon={<DocumentIcon className="w-20 h-20 text-slate-600" />}
              title={searchTerm ? 'No logs found' : 'No audit logs'}
              description={
                searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Activity logs will appear here as actions are performed on the platform'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Resource ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}
                      >
                        {formatAction(log.action)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-white">{log.resource}</TableCell>
                    <TableCell className="text-slate-300">{getActorName(log)}</TableCell>
                    <TableCell className="text-sm text-slate-400 font-mono">
                      {log.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {log.resourceId ? `${log.resourceId.substring(0, 8)}...` : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
      </div>
      {!loading && filteredLogs.length > 0 && (
        <div className="rounded-xl p-4">
          <div className="flex flex-col gap-2 items-center justify-between">
            <div className="text-sm text-white font-medium">
              Showing <span className="text-purple-400">{startIndex + 1}</span> to{' '}
              <span className="text-purple-400">{Math.min(endIndex, filteredLogs.length)}</span> of{' '}
              <span className="text-purple-400">{filteredLogs.length}</span> entries
            </div>

            <Pagination>
              <PaginationContent>
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
    </AdminLayout>
  );
}
