/**
 * Admin Complaints Page
 * Displays and manages user complaints against astrologers
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  COMPLAINT_STATUS_LABELS,
  COMPLAINT_CATEGORY_LABELS,
  COMPLAINT_STATUS_COLORS,
  COMPLAINT_PRIORITY_LABELS,
} from '@/types';
import { adminApi } from '@/lib/admin-api';
import { formatDistanceToNow } from 'date-fns';
import { LoadingButton } from '@/components/ui';
import { getImageUrl } from '@/utils/helpers';
import {
  Button,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Textarea,
  Label,
  ImagePreview,
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
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  AlertTriangle,
  Eye,
  CheckCircle,
  X,
  Clock,
  RefreshCw,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { generatePageNumbers } from '@/utils/helpers';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

const STATUS_COLORS: Record<ComplaintStatus, string> = {
  [ComplaintStatus.PENDING]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  [ComplaintStatus.IN_REVIEW]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  [ComplaintStatus.RESOLVED]: 'bg-green-500/10 text-green-500 border-green-500/20',
  [ComplaintStatus.DISMISSED]: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  [ComplaintStatus.ESCALATED]: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const STATUS_ICONS: Record<ComplaintStatus, React.ComponentType<{ className?: string }>> = {
  [ComplaintStatus.PENDING]: Clock,
  [ComplaintStatus.IN_REVIEW]: Eye,
  [ComplaintStatus.RESOLVED]: CheckCircle,
  [ComplaintStatus.DISMISSED]: X,
  [ComplaintStatus.ESCALATED]: AlertTriangle,
};

const PRIORITY_COLORS: Record<ComplaintPriority, string> = {
  [ComplaintPriority.LOW]: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  [ComplaintPriority.MEDIUM]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  [ComplaintPriority.HIGH]: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  [ComplaintPriority.URGENT]: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ComplaintsPage() {
  const queryClient = useQueryClient();
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [resolution, setResolution] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<ComplaintPriority>(
    ComplaintPriority.MEDIUM
  );
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Fetch complaints (server-side pagination)
  const {
    data: complaintsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [ADMIN_QUERY_KEYS.COMPLAINTS.LIST, filterStatus, currentPage],
    queryFn: () =>
      adminApi.complaints.getComplaints({
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      }),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const complaints = complaintsData?.complaints || [];
  const totalComplaints = complaintsData?.total ?? complaints.length;
  const pagination = {
    page: currentPage,
    limit: ITEMS_PER_PAGE,
    total: totalComplaints,
    totalPages: Math.ceil(totalComplaints / ITEMS_PER_PAGE),
  };

  // Reset to page 1 when filter status changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [filterStatus]);

  // Calculate stats using useMemo
  const stats = useMemo(() => {
    return {
      total: complaints.length,
      inReview: complaints.filter((c) => c.status === ComplaintStatus.IN_REVIEW).length,
      resolved: complaints.filter((c) => c.status === ComplaintStatus.RESOLVED).length,
      dismissed: complaints.filter((c) => c.status === ComplaintStatus.DISMISSED).length,
    };
  }, [complaints]);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      adminNotes,
      priority,
    }: {
      id: string;
      status: ComplaintStatus;
      adminNotes?: string;
      priority?: ComplaintPriority;
    }) => adminApi.complaints.updateComplaintStatus(id, { status, adminNotes, priority }),
    onSuccess: () => {
      toast.success('Complaint status updated successfully');
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEYS.COMPLAINTS.LIST] });
      setShowDetailModal(false);
      setSelectedComplaint(null);
    },
    onError: () => {
      toast.error('Failed to update complaint status');
    },
  });

  // Resolve mutation
  const resolveMutation = useMutation({
    mutationFn: ({
      id,
      resolution,
      adminNotes,
    }: {
      id: string;
      resolution: string;
      adminNotes?: string;
    }) => adminApi.complaints.resolveComplaint(id, { resolution, adminNotes }),
    onSuccess: () => {
      toast.success('Complaint resolved successfully');
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEYS.COMPLAINTS.LIST] });
      setShowDetailModal(false);
      setSelectedComplaint(null);
      setResolution('');
      setAdminNotes('');
    },
    onError: () => {
      toast.error('Failed to resolve complaint');
    },
  });

  // Dismiss mutation
  const dismissMutation = useMutation({
    mutationFn: ({ id, adminNotes }: { id: string; adminNotes: string }) =>
      adminApi.complaints.dismissComplaint(id, adminNotes),
    onSuccess: () => {
      toast.success('Complaint dismissed successfully');
      queryClient.invalidateQueries({ queryKey: [ADMIN_QUERY_KEYS.COMPLAINTS.LIST] });
      setShowDetailModal(false);
      setSelectedComplaint(null);
      setAdminNotes('');
    },
    onError: () => {
      toast.error('Failed to dismiss complaint');
    },
  });

  const handleViewDetail = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAdminNotes(complaint.adminNotes || '');
    setSelectedPriority(complaint.priority);
    setShowDetailModal(true);
  };

  const handleResolve = () => {
    if (!selectedComplaint) return;
    if (!resolution.trim()) {
      toast.error('Please provide a resolution');
      return;
    }
    resolveMutation.mutate({
      id: selectedComplaint.id,
      resolution,
      adminNotes,
    });
  };

  const handleDismiss = () => {
    if (!selectedComplaint) return;
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for dismissal');
      return;
    }
    dismissMutation.mutate({
      id: selectedComplaint.id,
      adminNotes,
    });
  };

  const handleUpdateStatus = (status: ComplaintStatus) => {
    if (!selectedComplaint) return;
    updateStatusMutation.mutate({
      id: selectedComplaint.id,
      status,
      adminNotes,
      priority: selectedPriority,
    });
  };

  const handleOpenImagePreview = (imageUrl: string) => {
    setPreviewImageUrl(imageUrl);
  };

  const handleCloseImagePreview = () => {
    setPreviewImageUrl(null);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Define columns for AdminTable
  const columns: AdminTableColumn<Complaint>[] = [
    {
      header: 'Client',
      accessor: (complaint) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getImageUrl(complaint.client?.profilePhoto) || undefined} />
            <AvatarFallback className="text-xs">
              {complaint.client?.name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-white">
              {complaint.client?.name || 'Unknown'}
            </div>
            <div className="text-xs text-slate-400">{complaint.client?.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Astrologer',
      accessor: (complaint) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getImageUrl(complaint.astrologer?.profilePhoto) || undefined} />
            <AvatarFallback className="text-xs">
              {complaint.astrologer?.name?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-sm font-medium text-white">
              {complaint.astrologer?.name || 'Unknown'}
            </div>
            <div className="text-xs text-slate-400">{complaint.astrologer?.phone}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Subject',
      accessor: (complaint) => (
        <div className="max-w-xs">
          <div className="text-sm font-medium text-white truncate">{complaint.subject}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {COMPLAINT_CATEGORY_LABELS[complaint.category]}
          </div>
        </div>
      ),
    },
    {
      header: 'Attachment',
      accessor: (complaint) => {
        if (!complaint.attachmentUrl) {
          return <span className="text-xs text-slate-500">N/A</span>;
        }
        const imageUrl = getImageUrl(complaint.attachmentUrl);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenImagePreview(imageUrl || '');
            }}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-xs"
          >
            <Paperclip className="w-3 h-3" />
            Preview
          </button>
        );
      },
    },
    {
      header: 'Priority',
      accessor: (complaint) => {
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
              PRIORITY_COLORS[complaint.priority]
            }`}
          >
            {COMPLAINT_PRIORITY_LABELS[complaint.priority]}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (complaint) => {
        const StatusIcon = STATUS_ICONS[complaint.status];
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              STATUS_COLORS[complaint.status]
            }`}
          >
            <StatusIcon className="w-3 h-3" />
            {COMPLAINT_STATUS_LABELS[complaint.status]}
          </span>
        );
      },
    },
    {
      header: 'Created',
      accessor: (complaint) => (
        <div>
          <div className="text-sm text-slate-300">{formatDate(complaint.createdAt)}</div>
          <div className="text-xs text-slate-500">
            {formatDistanceToNow(new Date(complaint.createdAt), { addSuffix: true })}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      accessor: (complaint) => (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleViewDetail(complaint)}
          className="border-slate-700 text-white hover:bg-slate-800"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">User Complaints</h2>
            <p className="text-slate-400 mt-1">Real-time monitoring of all user complaints</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-400" />
            </div>
          </div>
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">In Review</p>
                <p className="text-2xl font-bold text-blue-400">{stats.inReview}</p>
              </div>
              <Eye className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Resolved</p>
                <p className="text-2xl font-bold text-green-400">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="cosmic-card rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Dismissed</p>
                <p className="text-2xl font-bold text-gray-400">{stats.dismissed}</p>
              </div>
              <X className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="cosmic-card rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400 font-medium">Filter by status:</span>
            {[
              'ALL',
              ComplaintStatus.IN_REVIEW,
              ComplaintStatus.RESOLVED,
              ComplaintStatus.DISMISSED,
            ].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={filterStatus === status ? 'default' : 'ghost'}
                onClick={() => {
                  setFilterStatus(status as ComplaintStatus | 'ALL');
                }}
                className={
                  filterStatus === status
                    ? 'bg-transparent'
                    : 'border-slate-700 text-white hover:bg-slate-800'
                }
              >
                {status === 'ALL' ? 'All' : COMPLAINT_STATUS_LABELS[status as ComplaintStatus]}
              </Button>
            ))}
          </div>
        </div>

        {/* Complaints Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={complaints}
            columns={columns}
            loading={isLoading}
            keyExtractor={(complaint) => complaint.id}
            emptyState={{
              icon: <MessageSquare className="w-12 h-12 text-slate-600" />,
              title: 'No complaints yet',
              description: 'User complaints will appear here',
            }}
          />
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing{' '}
                <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="text-purple-400">
                  {Math.min(currentPage * pagination.limit, pagination.total)}
                </span>{' '}
                of <span className="text-purple-400">{pagination.total}</span> entries
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
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))
                      }
                      disabled={currentPage === pagination.totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="cosmic-card rounded-xl shadow-2xl max-w-3xl w-full my-8 flex flex-col border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-slate-700 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">Complaint Details</h3>
                <p className="text-sm text-slate-400 mt-1">ID: {selectedComplaint.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 max-h-[calc(100vh-300px)]">
              {/* Status and Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Status</Label>
                  <Badge className={`${COMPLAINT_STATUS_COLORS[selectedComplaint.status]} mt-1`}>
                    {COMPLAINT_STATUS_LABELS[selectedComplaint.status]}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Priority</Label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value as ComplaintPriority)}
                    className="mt-1 w-full px-3 py-2 bg-slate-800 text-white border border-slate-600 rounded-lg"
                  >
                    {(Object.entries(COMPLAINT_PRIORITY_LABELS) as [string, string][]).map(
                      ([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Client & Astrologer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-slate-300">Client</Label>
                  <div className="mt-2 flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedComplaint.client?.profilePhoto || ''} />
                      <AvatarFallback>{selectedComplaint.client?.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {selectedComplaint.client?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400">{selectedComplaint.client?.phone}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-300">Astrologer</Label>
                  <div className="mt-2 flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedComplaint.astrologer?.profilePhoto || ''} />
                      <AvatarFallback>
                        {selectedComplaint.astrologer?.name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {selectedComplaint.astrologer?.name || 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {selectedComplaint.astrologer?.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div>
                <Label className="text-sm font-medium text-slate-300">Subject</Label>
                <p className="mt-1 text-white">{selectedComplaint.subject}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300">Category</Label>
                <p className="mt-1 text-slate-300">
                  {COMPLAINT_CATEGORY_LABELS[selectedComplaint.category]}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-slate-300">Description</Label>
                <p className="mt-1 text-slate-300 whitespace-pre-wrap bg-slate-800/30 p-3 rounded-lg border border-slate-700">
                  {selectedComplaint.description}
                </p>
              </div>

              {/* Attachment (if provided) */}
              {selectedComplaint.attachmentUrl && (
                <div>
                  <Label className="text-sm font-medium text-slate-300">Attachment</Label>
                  <div className="mt-2 bg-slate-800/30 p-3 rounded-lg border border-slate-700">
                    <a
                      href={getImageUrl(selectedComplaint.attachmentUrl) || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      View Attachment
                    </a>
                    <img
                      src={getImageUrl(selectedComplaint.attachmentUrl) || ''}
                      alt="Complaint evidence"
                      className="mt-3 max-w-full h-auto rounded-lg border border-slate-600"
                      style={{ maxHeight: '300px' }}
                    />
                  </div>
                </div>
              )}

              {/* Resolution (if resolved) */}
              {selectedComplaint.resolution && (
                <div>
                  <Label className="text-sm font-medium text-green-400">Resolution</Label>
                  <p className="mt-1 text-slate-300 whitespace-pre-wrap bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                    {selectedComplaint.resolution}
                  </p>
                  {selectedComplaint.resolver && (
                    <p className="mt-2 text-xs text-slate-400">
                      Resolved by {selectedComplaint.resolver.name} on{' '}
                      {new Date(selectedComplaint.resolvedAt!).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes" className="text-sm font-medium text-slate-300">
                  Admin Notes
                </Label>
                <Textarea
                  id="admin-notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="mt-1 bg-slate-800 text-white border-slate-600"
                  placeholder="Add notes about this complaint..."
                />
              </div>

              {/* Resolution Input (if resolving) */}
              {selectedComplaint.status !== ComplaintStatus.RESOLVED && (
                <div>
                  <Label htmlFor="resolution" className="text-sm font-medium text-slate-300">
                    Resolution (Required to resolve complaint)
                  </Label>
                  <Textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    rows={3}
                    className="mt-1 bg-slate-800 text-white border-slate-600"
                    placeholder="Provide a detailed resolution for this complaint..."
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-700 bg-slate-800/30 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                Close
              </Button>
              {selectedComplaint.status !== ComplaintStatus.RESOLVED &&
                selectedComplaint.status !== ComplaintStatus.DISMISSED && (
                  <>
                    <LoadingButton
                      onClick={() => handleUpdateStatus(ComplaintStatus.IN_REVIEW)}
                      isLoading={updateStatusMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      disabled={selectedComplaint.status === ComplaintStatus.IN_REVIEW}
                    >
                      Mark as In Review
                    </LoadingButton>
                    <LoadingButton
                      onClick={handleResolve}
                      isLoading={resolveMutation.isPending}
                      className="bg-green-500 hover:bg-green-600 text-white"
                      disabled={!resolution.trim()}
                    >
                      Resolve
                    </LoadingButton>
                    <LoadingButton
                      onClick={handleDismiss}
                      isLoading={dismissMutation.isPending}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={!adminNotes.trim()}
                    >
                      Dismiss
                    </LoadingButton>
                  </>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreview
        imageUrl={previewImageUrl}
        alt="Complaint attachment"
        onClose={handleCloseImagePreview}
      />
    </AdminLayout>
  );
}
