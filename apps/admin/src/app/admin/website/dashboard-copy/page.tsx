'use client';

import { useEffect, useState } from 'react';
import { useDebounce, useDebouncedPageSize } from '@/hooks';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import { adminApi } from '@/lib/admin-api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Search,
  Textarea,
  LoadingButton,
} from '@jyotish/ui';
import type { DashboardRotatingCopy } from '@jyotish/shared';
import { toast } from 'sonner';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import { ConfirmDialog } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';

interface DashboardRotatingCopyResponse {
  items: DashboardRotatingCopy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type CopyFormState = {
  title: string;
  subtitle: string;
  sortOrder: number;
  isActive: boolean;
};

function toFormDefaults(item?: DashboardRotatingCopy): CopyFormState {
  return {
    title: item?.title ?? '',
    subtitle: item?.subtitle ?? '',
    sortOrder: item?.sortOrder ?? 0,
    isActive: item?.isActive ?? true,
  };
}

export default function DashboardCopyManagementPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DashboardRotatingCopy | null>(null);
  const [form, setForm] = useState<CopyFormState>(toFormDefaults());
  const [itemToDelete, setItemToDelete] = useState<DashboardRotatingCopy | null>(null);

  const {
    data: itemsResponse,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<DashboardRotatingCopyResponse>({
    queryKey: [
      ...ADMIN_QUERY_KEYS.WEBSITE.DASHBOARD_ROTATING_COPY(),
      currentPage,
      debouncedSearch,
      debouncedRowsPerPage,
    ],
    queryFn: () =>
      adminApi.dashboard.rotatingCopy.list({
        page: currentPage,
        limit: debouncedRowsPerPage,
        search: debouncedSearch || undefined,
      }),
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const items = itemsResponse?.items ?? [];
  const pagination = itemsResponse?.pagination || {
    page: 1,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: 0,
  };

  // Reset to page 1 when search term or rows per page changes
  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, debouncedRowsPerPage]);

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.dashboard.rotatingCopy.create({
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.DASHBOARD_ROTATING_COPY(),
      });
      toast.success('Created successfully');
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: () => {
      if (!editing) throw new Error('No item selected');
      return adminApi.dashboard.rotatingCopy.update(editing.id, {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.DASHBOARD_ROTATING_COPY(),
      });
      toast.success('Updated successfully');
      setDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update'),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminApi.dashboard.rotatingCopy.toggle(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.DASHBOARD_ROTATING_COPY(),
      });
      toast.success('Status updated');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to toggle'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.dashboard.rotatingCopy.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.DASHBOARD_ROTATING_COPY(),
      });
      toast.success('Deleted successfully');
      setItemToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete'),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(toFormDefaults());
    setDialogOpen(true);
  };

  const openEdit = (item: DashboardRotatingCopy) => {
    setEditing(item);
    setForm(toFormDefaults(item));
    setDialogOpen(true);
  };

  const onSubmit = () => {
    if (!form.title.trim() || !form.subtitle.trim()) {
      toast.error('Title and subtitle are required');
      return;
    }
    if (editing) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-5 sm:space-y-6">

        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Dashboard Header Copy
            </h1>
            <div className="flex items-center gap-2 shrink-0 self-start">
              <AdminRefreshButton
                onClick={() => refetch()}
                loading={isLoading || isFetching}
                className="shrink-0"
              />
              <Button
                onClick={openCreate}
                className="hidden sm:inline-flex gap-2 bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add copy
              </Button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Add, edit, enable/disable the rotating title & subtitle shown on the client dashboard.
          </p>
          <Button
            onClick={openCreate}
            className="sm:hidden w-full gap-2 bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add copy
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="w-full min-w-0">
            <Search
              containerClassName="w-full"
              placeholder="Search title/subtitle..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={items}
            loading={isLoading}
            keyExtractor={(item) => item.id}
            columns={
              [
                {
                  header: 'Title / Subtitle',
                  accessor: (item) => (
                    <div className="space-y-1">
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="text-sm text-slate-400">{item.subtitle}</div>
                    </div>
                  ),
                },
                {
                  header: 'Status',
                  accessor: (item) =>
                    item.isActive ? (
                      <Badge className="bg-green-500/15 text-green-300 border border-green-500/30">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-500/15 text-slate-300 border border-slate-500/30">
                        Disabled
                      </Badge>
                    ),
                  width: '140px',
                },
                {
                  header: 'Actions',
                  accessor: (item) => (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-slate-700"
                        onClick={() => openEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="border-slate-700"
                        onClick={() => toggleMutation.mutate(item.id)}
                        disabled={toggleMutation.isPending}
                      >
                        {item.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setItemToDelete(item)}
                        disabled={deleteMutation.isPending}
                        className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                  className: 'text-right',
                  width: '320px',
                },
              ] satisfies AdminTableColumn<DashboardRotatingCopy>[]
            }
            showSerialNumber
            emptyState={{
              icon: (
                <svg
                  className="w-12 h-12 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H9l-2 2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              ),
              title: debouncedSearch ? 'No dashboard copy items found' : 'No dashboard copy items',
              description: debouncedSearch
                ? 'Try adjusting your search terms'
                : 'Create the first rotating title/subtitle to show on the client dashboard.',
              action: searchTerm ? undefined : { label: 'Add copy', onClick: openCreate },
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

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
              setForm(toFormDefaults());
            }
          }}
        >
          <DialogContent className="flex max-h-[min(90vh,800px)] w-[calc(100vw-2rem)] flex-col overflow-y-auto bg-slate-900 border-slate-700 text-white sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editing ? 'Edit dashboard copy' : 'Add dashboard copy'}
              </DialogTitle>
            </DialogHeader>

            <div className="min-w-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white">
                  Title
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Enter title..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subtitle" className="text-white">
                  Subtitle
                </Label>
                <Textarea
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                  placeholder="Enter subtitle..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder" className="text-white">
                    Sort order
                  </Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, sortOrder: Number(e.target.value || 0) }))
                    }
                    min={0}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isActive" className="text-white">
                    Active
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="isActive"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-slate-300">
                      {form.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="w-full border-slate-700 sm:w-auto"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <LoadingButton
                onClick={onSubmit}
                loading={isSubmitting}
                loadingText="Saving..."
                className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 sm:w-auto"
              >
                Save
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          isOpen={itemToDelete !== null}
          onClose={() => {
            if (!deleteMutation.isPending) setItemToDelete(null);
          }}
          onConfirm={() => {
            if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
          }}
          title="Delete this item?"
          description={itemToDelete ? `"${itemToDelete.title}". This cannot be undone.` : ''}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          isLoading={deleteMutation.isPending}
          icon={<Trash2 className="w-6 h-6 text-red-400" />}
        />
      </div>
    </AdminLayout>
  );
}
