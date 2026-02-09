'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import {
  Button,
  Search,
  PlusIcon,
  StarIcon,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@jyotish/ui';
import { RefreshCw, Eye, X, Download, FileText, Pencil } from 'lucide-react';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
import { useAdminSocket } from '@/hooks';
import type { Astrologer } from '@/types';
import { AstrologerCategory } from '@jyotish/shared';
import { generatePageNumbers, getImageUrl } from '@/utils/helpers';
import { AttachmentPreview } from '@/components/ui/AttachmentPreview';
const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

interface AstrologersResponse {
  astrologers: Astrologer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AstrologersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { on, off, isConnected } = useAdminSocket();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [onlineAstrologers, setOnlineAstrologers] = useState<Set<string>>(new Set());
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  const [viewingProfileImage, setViewingProfileImage] = useState<string | null>(null);

  const viewing = viewingProfileImage
    ? { type: 'profile' as const, value: viewingProfileImage }
    : viewingAttachment
      ? { type: 'proof' as const, value: viewingAttachment }
      : null;

  const closeViewer = () => {
    setViewingAttachment(null);
    setViewingProfileImage(null);
  };

  // Debug: Log socket connection status
  useEffect(() => {
    console.log('📊 [ADMIN ASTROLOGERS] Socket connection status:', {
      isConnected,
      hasOn: !!on,
      hasOff: !!off,
    });
  }, [isConnected, on, off]);

  // Fetch astrologers with TanStack Query (server-side pagination)
  const {
    data: astrologersResponse,
    isLoading,
    refetch,
  } = useQuery<AstrologersResponse>({
    queryKey: [...ADMIN_QUERY_KEYS.ASTROLOGERS.LIST(), currentPage, searchTerm],
    queryFn: async () => {
      const response: any = await adminApi.astrologers.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
      });
      // Handle both response formats
      if (response?.astrologers && response?.pagination) {
        return response;
      } else if (Array.isArray(response)) {
        // Fallback for old format
        return {
          astrologers: response,
          pagination: {
            page: 1,
            limit: ITEMS_PER_PAGE,
            total: response.length,
            totalPages: 1,
          },
        };
      }
      return {
        astrologers: [],
        pagination: { page: 1, limit: ITEMS_PER_PAGE, total: 0, totalPages: 0 },
      };
    },
  });

  const astrologers = astrologersResponse?.astrologers || [];
  const pagination = astrologersResponse?.pagination || {
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

  // Listen for real-time astrologer online status updates
  useEffect(() => {
    if (!on || !off) {
      console.warn('⚠️ Admin socket on/off functions not available');
      return;
    }

    console.log('✅ Setting up astrologer:status_changed listener', { isConnected });

    const handleAstrologerStatusChanged = (data: { astrologerId: string; isOnline: boolean }) => {
      console.log('🔔 [ADMIN] Astrologer status changed received:', data);
      setOnlineAstrologers((prev) => {
        const newSet = new Set(prev);
        if (data.isOnline) {
          newSet.add(data.astrologerId);
          console.log(`✅ Added ${data.astrologerId} to online set. Total online: ${newSet.size}`);
        } else {
          newSet.delete(data.astrologerId);
          console.log(
            `❌ Removed ${data.astrologerId} from online set. Total online: ${newSet.size}`
          );
        }
        return newSet;
      });
    };

    on('astrologer:status_changed', handleAstrologerStatusChanged);
    console.log('📡 Admin socket listener registered for astrologer:status_changed');

    return () => {
      console.log('🔌 Removing astrologer:status_changed listener');
      off('astrologer:status_changed', handleAstrologerStatusChanged);
    };
  }, [on, off, isConnected]);

  // Close viewer modal on Escape key
  useEffect(() => {
    if (!viewing) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeViewer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewing]);

  // Initialize online status from database
  useEffect(() => {
    if (astrologers.length > 0) {
      const online = new Set(astrologers.filter((a) => a.isOnline).map((a) => a.id));
      setOnlineAstrologers(online);
    }
  }, [astrologers]);

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => adminApi.astrologers.toggleStatus(id),
    onSuccess: () => {
      toast.success('Astrologer status updated successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.ALL });
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error?.message || 'Failed to toggle status';
      toast.error(message);
    },
  });

  const toggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [searchTerm]);

  const columns: AdminTableColumn<Astrologer>[] = [
    {
      header: 'Name',
      accessor: (astrologer) => <span className="font-medium">{astrologer.name}</span>,
    },
    {
      header: 'Email',
      accessor: (astrologer) => astrologer.email,
    },
    {
      header: 'Phone',
      accessor: (astrologer) => astrologer.phone,
    },
    {
      header: 'Experience',
      accessor: (astrologer) => `${astrologer.experience} years`,
    },
    {
      header: 'Profile',
      accessor: (astrologer) => (
        <div className="flex justify-center">
          <AttachmentPreview
            attachmentUrl={astrologer.profilePhoto}
            onView={() => {
              setViewingAttachment(null);
              setViewingProfileImage(astrologer.profilePhoto || null);
            }}
            size="md"
          />
        </div>
      ),
      className: 'text-center',
    },
    {
      header: 'Category',
      accessor: (astrologer) => (
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
            astrologer.category === AstrologerCategory.PREMIUM
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : astrologer.category === AstrologerCategory.PROFESSIONAL
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
          }`}
        >
          {astrologer.category === AstrologerCategory.PREMIUM
            ? '👑 Premium'
            : astrologer.category === AstrologerCategory.PROFESSIONAL
              ? '💎 Professional'
              : astrologer.category === AstrologerCategory.KATHA_VACHAK
                ? '📖 Katha Vachak'
                : '⭐ Ordinary'}
        </span>
      ),
    },
    {
      header: 'Rating',
      accessor: (astrologer) => (
        <div className="flex items-center gap-1">
          <StarIcon className="w-4 h-4 text-yellow-500" />
          {astrologer.rating.toFixed(1)}
        </div>
      ),
    },
    {
      header: 'Account Status',
      accessor: (astrologer) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            astrologer.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {astrologer.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Online Status',
      accessor: (astrologer) => {
        const isOnline = onlineAstrologers.has(astrologer.id);
        return (
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}
            />
            <span
              className={`text-xs font-medium ${isOnline ? 'text-green-400' : 'text-slate-500'}`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Attachments',
      accessor: (astrologer) => (
        <div className="flex justify-center">
          <AttachmentPreview
            attachmentUrl={astrologer.proofOfAstrology}
            onView={() => {
              setViewingProfileImage(null);
              setViewingAttachment(astrologer.proofOfAstrology || null);
            }}
            size="md"
          />
        </div>
      ),
      className: 'text-center',
    },
    {
      header: 'Actions',
      accessor: (astrologer) => (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(ADMIN_ROUTES.ASTROLOGERS_EDIT(astrologer.id))}
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => toggleStatus(astrologer.id)}>
            Toggle Status
          </Button>
        </div>
      ),
      className: 'text-center',
    },
  ];

  return (
    <AdminLayout>
      <div className="w-full max-w-full min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white">Astrologers</h2>
            <p className="text-slate-400 mt-1">Manage your cosmic advisors</p>
          </div>
          <div className="flex items-center gap-2">
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
            <Button
              onClick={() => router.push(ADMIN_ROUTES.ASTROLOGERS_CREATE)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Astrologer
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Search
          placeholder="Search astrologers by name, email, or phone..."
          value={searchTerm}
          onSearch={setSearchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Table */}
        <div className="cosmic-card w-full max-w-full min-w-0 rounded-xl overflow-hidden">
          <AdminTable
            data={astrologers}
            columns={columns}
            loading={isLoading}
            keyExtractor={(astrologer) => astrologer.id}
            emptyState={{
              icon: <StarIcon className="w-20 h-20 text-slate-600" />,
              title: searchTerm ? 'No astrologers found' : 'No astrologers yet',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Get started by adding your first astrologer to the platform',
              action: {
                label: 'Add Astrologer',
                onClick: () => router.push(ADMIN_ROUTES.ASTROLOGERS_CREATE),
              },
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

        {/* Attachment / Profile Image Viewer Modal */}
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
                  {viewing.type === 'profile' ? 'Profile Image' : 'Proof of Astrology Certificates'}
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
                  // Handle JSON array or single file
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
