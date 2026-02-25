/**
 * Astrologer Registration Requests Page
 * Admin panel for managing astrologer registration requests
 */

'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Search,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { RefreshCw, Check, X, FileText, UserIcon, Download } from 'lucide-react';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import type { RegistrationRequest } from '@/types';
import { AstrologerCategory } from '@jyotish/shared';
import { getImageUrl } from '@/utils/helpers';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { generatePageNumbers } from '@/utils/helpers';
import { AttachmentPreview } from '@/components/ui/AttachmentPreview';

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

interface RegistrationRequestsResponse {
  requests: RegistrationRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApproveRejectModalProps {
  request: RegistrationRequest;
  type: 'approve' | 'reject';
  onClose: () => void;
  onSuccess: () => void;
}

function ApproveRejectModal({ request, type, onClose, onSuccess }: ApproveRejectModalProps) {
  const [category, setCategory] = useState<AstrologerCategory>(AstrologerCategory.ORDINARY);
  const [appointmentFee, setAppointmentFee] = useState<string>('');
  const [chatMessageFee, setChatMessageFee] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (type === 'approve') {
        await adminApi.astrologers.approveRegistration(request.id, {
          category,
          appointmentFee: appointmentFee ? parseFloat(appointmentFee) : undefined,
          chatMessageFee: chatMessageFee ? parseFloat(chatMessageFee) : undefined,
          commissionRate: commissionRate ? parseFloat(commissionRate) : undefined,
        });
        toast.success('Registration approved successfully');
      } else {
        if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
          toast.error('Rejection reason must be at least 10 characters');
          setIsSubmitting(false);
          return;
        }
        await adminApi.astrologers.rejectRegistration(request.id, {
          rejectionReason: rejectionReason.trim(),
        });
        toast.success('Registration rejected successfully');
      }
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process request';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <Card className="bg-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-white">
            {type === 'approve' ? 'Approve Registration' : 'Reject Registration'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'approve' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AstrologerCategory)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ORDINARY">Ordinary</option>
                    <option value="PROFESSIONAL">Professional</option>
                    <option value="PREMIUM">Premium</option>
                    <option value="KATHA_VACHAK">Katha Vachak</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Appointment Fee (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={appointmentFee}
                    onChange={(e) => setAppointmentFee(e.target.value)}
                    placeholder="e.g., 500.00"
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Instant Chat Message Fee (Optional, NRs per message)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={chatMessageFee}
                    onChange={(e) => setChatMessageFee(e.target.value)}
                    placeholder="e.g., 10.00"
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Commission Rate % (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="e.g., 20.0"
                    className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Rejection Reason <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection (minimum 10 characters)..."
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                  minLength={10}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>

              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText={type === 'approve' ? 'Approving...' : 'Rejecting...'}
                className={`flex-1 ${
                  type === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {type === 'approve' ? 'Approve' : 'Reject'}
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RegistrationRequestsPage() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [viewingProfileImage, setViewingProfileImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const viewing =
    viewingProfileImage !== null
      ? { type: 'profile' as const, value: viewingProfileImage }
      : viewingAttachment !== null
        ? { type: 'proof' as const, value: viewingAttachment }
        : null;

  const closeViewer = () => {
    setViewingAttachment(null);
    setViewingProfileImage(null);
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [searchTerm]);

  const {
    data: requestsResponse,
    isLoading,
    refetch,
  } = useQuery<RegistrationRequestsResponse>({
    queryKey: [...ADMIN_QUERY_KEYS.ASTROLOGERS.REGISTRATION_REQUESTS(), currentPage, searchTerm],
    queryFn: async (): Promise<RegistrationRequestsResponse> => {
      const response = await adminApi.astrologers.getRegistrationRequests({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
      });
      return response;
    },
  });

  const requests = requestsResponse?.requests || [];
  const pagination = requestsResponse?.pagination || {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

  const approveMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      category: string;
      appointmentFee?: number;
      commissionRate?: number;
    }) => {
      return await adminApi.astrologers.approveRegistration(data.id, {
        category: data.category,
        appointmentFee: data.appointmentFee,
        commissionRate: data.commissionRate,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.REGISTRATION_REQUESTS(),
      });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.LIST() });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { id: string; rejectionReason: string }) => {
      return await adminApi.astrologers.rejectRegistration(data.id, {
        rejectionReason: data.rejectionReason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.REGISTRATION_REQUESTS(),
      });
    },
  });

  const handleApprove = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setModalType('approve');
  };

  const handleReject = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setModalType('reject');
  };

  const handleModalSuccess = () => {
    refetch();
  };

  // Close viewer modal on Escape key
  useEffect(() => {
    if (!viewing) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewing]);

  const columns: AdminTableColumn<RegistrationRequest>[] = [
    {
      header: 'Name',
      accessor: (request) => <span className="font-medium text-white">{request.name}</span>,
    },
    {
      header: 'Email',
      accessor: (request) => <span className="text-slate-300">{request.email || 'N/A'}</span>,
    },
    {
      header: 'Phone',
      accessor: (request) => <span className="text-slate-300">{request.phone}</span>,
    },
    {
      header: 'Profile',
      accessor: (request) => (
        <div className="flex justify-center">
          <AttachmentPreview
            attachmentUrl={request.profilePhoto}
            onView={() => {
              setViewingAttachment(null);
              setViewingProfileImage(request.profilePhoto || null);
            }}
            size="md"
          />
        </div>
      ),
      className: 'text-center',
    },
    {
      header: 'Experience',
      accessor: (request) => (
        <span className="text-slate-300">
          {request.experience ? `${request.experience} years` : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Specialization',
      accessor: (request) => (
        <span className="text-slate-300">
          {request.specialization.length > 0 ? request.specialization.join(', ') : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Languages',
      accessor: (request) => (
        <span className="text-slate-300">
          {request.languages.length > 0 ? request.languages.join(', ') : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Requested Date',
      accessor: (request) => (
        <span className="text-slate-300">
          {new Date(request.registrationRequestedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Attachments',
      accessor: (request) => (
        <div className="flex justify-center">
          <AttachmentPreview
            attachmentUrl={request.proofOfAstrology}
            onView={() => {
              setViewingProfileImage(null);
              setViewingAttachment(request.proofOfAstrology || null);
            }}
            size="md"
          />
        </div>
      ),
      className: 'text-center',
    },
    {
      header: 'Actions',
      accessor: (request) => (
        <div className="flex items-center gap-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleApprove(request);
            }}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
            size="sm"
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleReject(request);
            }}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            color="danger"
            size="sm"
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      ),
      className: 'text-center',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Account Creation Requests</h2>
            <p className="text-slate-400 mt-1">
              Review and manage astrologer registration requests
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

        {/* Search Bar */}
        <Search
          placeholder="Search requests by name, email, or phone..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={requests}
            columns={columns}
            loading={isLoading}
            keyExtractor={(request) => request.id}
            emptyState={{
              icon: <UserIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No requests found' : 'No pending registration requests',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'All registration requests have been processed',
            }}
            currentPage={pagination.page}
            itemsPerPage={pagination.limit}
            totalItems={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 0 && (
          <div className="rounded-xl p-4">
            <div className="flex flex-col gap-2 items-center justify-between">
              <div className="text-sm text-white font-medium">
                Showing{' '}
                <span className="text-purple-400">
                  {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                to{' '}
                <span className="text-purple-400">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
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

        {/* Modals */}
        {selectedRequest && modalType && (
          <ApproveRejectModal
            request={selectedRequest}
            type={modalType}
            onClose={() => {
              setSelectedRequest(null);
              setModalType(null);
            }}
            onSuccess={handleModalSuccess}
          />
        )}

        {/* Attachment / Profile Image Viewer Modal (same as admin/astrologers) */}
        {viewing && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={closeViewer}
          >
            <Card
              className="bg-slate-900 border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">
                  {viewing.type === 'profile'
                    ? 'Profile Image'
                    : 'Proof of Astrology Certificates'}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeViewer}
                  className="text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {(() => {
                  let fileUrls: string[] = [];
                  try {
                    const parsed = JSON.parse(viewing.value);
                    fileUrls = Array.isArray(parsed) ? parsed : [viewing.value];
                  } catch {
                    fileUrls = [viewing.value];
                  }

                  return (
                    <div className="space-y-4">
                      {fileUrls.map((fileUrl, index) => {
                        const fullUrl = getImageUrl(fileUrl);
                        if (!fullUrl) return null;

                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileUrl);
                        const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
                        const fileName = fileUrl.split('/').pop() || `Document ${index + 1}`;

                        return (
                          <div key={index} className="space-y-3">
                            {fileUrls.length > 1 && (
                              <p className="text-sm text-slate-400">
                                File {index + 1} of {fileUrls.length}
                              </p>
                            )}

                            {isImage ? (
                              <img
                                src={fullUrl}
                                alt={fileName}
                                className="w-full h-auto rounded-lg border border-slate-700"
                              />
                            ) : (
                              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <FileText
                                    className={`w-6 h-6 ${isPdf ? 'text-red-400' : 'text-blue-400'}`}
                                  />
                                  <span className="text-slate-100 text-sm break-all">
                                    {fileName}
                                  </span>
                                </div>
                                <a
                                  href={fullUrl}
                                  download={fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="w-4 h-4" />
                                  Download
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
