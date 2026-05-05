'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api';
import {
  ADMIN_QUERY_KEYS,
  PAGINATION_DEFAULTS,
  ADMIN_ROWS_PER_PAGE_OPTIONS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from '@/constants';
import {
  Button,
  LoadingButton,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Search,
} from '@jyotish/ui';
import type { KundaliConsultationQuestionAdminDTO } from '@/types/kundaliMatchConsultationCatalogue.types';
import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Loader2,
  Pencil,
  Plus,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import {
  AdminTable,
  AdminListPaginationSection,
  type AdminTableColumn,
  AdminRefreshButton,
} from '@/components/admin';
import { useDebouncedPageSize, useDebounce } from '@/hooks';

function truncateTextNe(s: string, maxChars: number): string {
  const arr = [...s];
  if (arr.length <= maxChars) return s;
  return arr.slice(0, maxChars).join('') + '…';
}

export function KundaliMatchConsultationCatalogueSection() {
  const queryClient = useQueryClient();
  const [titleEditOpen, setTitleEditOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm.trim(), ADMIN_SEARCH_DEBOUNCE_MS);
  const [currentPage, setCurrentPage] = useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);

  const [addOpen, setAddOpen] = useState(false);
  const [newText, setNewText] = useState('');
  const [titleModalDraft, setTitleModalDraft] = useState('');
  const [editQuestion, setEditQuestion] = useState<KundaliConsultationQuestionAdminDTO | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<KundaliConsultationQuestionAdminDTO | null>(null);

  const invalidateConsultation = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ADMIN_QUERY_KEYS.KUNDALI_MATCH.CONSULTATION_CATALOGUE_ROOT,
    });
  }, [queryClient]);

  const lookupQueryKey = ADMIN_QUERY_KEYS.KUNDALI_MATCH.CONSULTATION_LOOKUP();
  const { data: orderLookup } = useQuery({
    queryKey: lookupQueryKey,
    queryFn: () => adminApi.kundaliMatch.consultationCatalogueLookup(),
    staleTime: 60_000,
  });

  const listParams = useMemo(
    () => ({
      page: currentPage,
      limit: debouncedRowsPerPage,
      search: debouncedSearch,
    }),
    [currentPage, debouncedRowsPerPage, debouncedSearch]
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.KUNDALI_MATCH.CONSULTATION_LIST(listParams),
    queryFn: () =>
      adminApi.kundaliMatch.consultationCatalogueList({
        ...listParams,
        search: debouncedSearch || undefined,
      }),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const orderBounds = useMemo(() => {
    const ordered = orderLookup?.questions ?? [];
    const idx = new Map<string, number>();
    for (let i = 0; i < ordered.length; i++) {
      idx.set(ordered[i]!.id, i);
    }
    const last = Math.max(0, ordered.length - 1);
    return { idx, last };
  }, [orderLookup?.questions]);

  const rankInCatalogue = useCallback(
    (questionId: string, fallbackSortOrder: number) => {
      const idx = orderBounds.idx.get(questionId);
      if (idx !== undefined) return idx + 1;
      return Math.max(1, fallbackSortOrder <= 0 ? fallbackSortOrder + 1 : fallbackSortOrder);
    },
    [orderBounds.idx]
  );

  useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, debouncedRowsPerPage]);

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const titleMutation = useMutation({
    mutationFn: (titleNe: string) => adminApi.kundaliMatch.updateConsultationTitle({ titleNe }),
    onSuccess: () => {
      toast.success('Title updated');
      setTitleEditOpen(false);
      invalidateConsultation();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update title'),
  });

  const moveMutation = useMutation({
    mutationFn: (args: { id: string; direction: 'up' | 'down' }) =>
      adminApi.kundaliMatch.moveConsultationQuestion(args.id, { direction: args.direction }),
    onSuccess: (_res, args) => {
      toast.success(args.direction === 'up' ? 'Moved up' : 'Moved down');
      invalidateConsultation();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to change order'),
  });

  const deleteMutation = useMutation({
    mutationFn: (questionId: string) => adminApi.kundaliMatch.deleteConsultationQuestion(questionId),
    onSuccess: () => {
      toast.success('Topic deleted');
      setDeleteTarget(null);
      invalidateConsultation();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete topic'),
  });

  const saveTextMutation = useMutation({
    mutationFn: async (args: { id: string; textNe: string }) => {
      return adminApi.kundaliMatch.updateConsultationQuestion(args.id, { textNe: args.textNe });
    },
    onSuccess: () => {
      toast.success('Question saved');
      setEditQuestion(null);
      invalidateConsultation();
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Failed to save question');
    },
  });

  const createMutation = useMutation({
    mutationFn: (textNe: string) => adminApi.kundaliMatch.createConsultationQuestion({ textNe }),
    onSuccess: () => {
      toast.success('Topic added');
      setAddOpen(false);
      setNewText('');
      invalidateConsultation();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to add topic'),
  });

  const questionsOrdered = useMemo(() => {
    const list = [...(data?.questions ?? [])];
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    return list;
  }, [data?.questions]);

  const paginationMeta = data?.pagination ?? {
    page: currentPage,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: data ? 1 : 0,
  };

  const columns = useMemo((): AdminTableColumn<KundaliConsultationQuestionAdminDTO>[] => {
    return [
      {
        header: 'Order',
        width: '4.5rem',
        accessor: (q) => (
          <span className="text-slate-300 tabular-nums">{rankInCatalogue(q.id, q.sortOrder)}</span>
        ),
      },
      {
        header: 'ID',
        accessor: (q) => (
          <code className="text-[10px] text-slate-400 break-all" title={q.id}>
            {q.id.length > 14 ? `${q.id.slice(0, 8)}…${q.id.slice(-4)}` : q.id}
          </code>
        ),
      },
      {
        header: 'Question',
        accessor: (q) => (
          <span className="text-sm text-slate-200 whitespace-normal" title={q.textNe}>
            {truncateTextNe(q.textNe, 140)}
          </span>
        ),
      },
      {
        header: 'Actions',
        className: 'text-right',
        accessor: (q) => {
          const i = orderBounds.idx.get(q.id);
          const atTop = i === 0;
          const atBottom = i === orderBounds.last;
          const moving = moveMutation.isPending;
          return (
            <div className="flex flex-wrap justify-end gap-1">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                disabled={moving || atTop || i === undefined}
                title="Move up globally"
                onClick={() => moveMutation.mutate({ id: q.id, direction: 'up' })}
                aria-label="Move up"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                disabled={moving || atBottom || i === undefined}
                title="Move down globally"
                onClick={() => moveMutation.mutate({ id: q.id, direction: 'down' })}
                aria-label="Move down"
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-slate-600"
                onClick={() => {
                  setEditQuestion(q);
                  setEditDraft(q.textNe);
                }}
                aria-label="Edit question text"
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-red-600/50 text-red-400 hover:bg-red-500/10"
                disabled={deleteMutation.isPending}
                title="Delete topic"
                aria-label="Delete topic"
                onClick={() => setDeleteTarget(q)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [moveMutation.isPending, deleteMutation.isPending, orderBounds.idx, orderBounds.last, rankInCatalogue]);

  if (isLoading && !data) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 animate-pulse space-y-3">
        <div className="h-4 w-1/2 rounded bg-slate-700" />
        <div className="h-24 rounded bg-slate-800" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 text-sm">
        {error instanceof Error ? error.message : 'Could not load consultation catalogue.'}
      </div>
    );
  }


  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 sm:p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Match consultation topics</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            These topics appear in the public app when users submit a premium Kundali Match request. Deleted
            topics are removed from the picker; reorder changes list order everywhere.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <AdminRefreshButton
            onClick={() => void refetch()}
            loading={isFetching}
            label="Reload list"
          />
          <Button variant="outline" className="border-amber-500/40 shrink-0" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add topic
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-slate-300">Section title (Nepali)</Label>
        <div className="flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5">
          <p className="flex-1 min-w-0 text-sm text-slate-100 whitespace-pre-wrap break-words">
            {data.titleNe?.trim() ? data.titleNe : '—'}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 h-9 w-9 p-0 text-slate-400 hover:text-amber-400"
            aria-label="Edit section title"
            onClick={() => {
              setTitleModalDraft(data.titleNe);
              setTitleEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="w-full min-w-0">
        <Label className="text-slate-300 mb-2 block">Search topics</Label>
        <Search
          containerClassName="w-full max-w-none"
          placeholder="Question text or topic ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="cosmic-card rounded-xl overflow-hidden relative">
        {isFetching && !isLoading && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 rounded-lg bg-slate-900/90 px-2 py-1 text-xs text-slate-300 border border-slate-600">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            Updating…
          </div>
        )}
        <AdminTable
          data={questionsOrdered}
          columns={columns}
          loading={isLoading}
          keyExtractor={(q) => q.id}
          showSerialNumber={false}
          emptyState={{
            icon: <MessageSquare className="w-12 h-12 text-slate-600" />,
            title: debouncedSearch ? 'No topics match your search' : 'No consultation topics yet',
            description: debouncedSearch ? 'Try a different search.' : 'Add a topic to get started.',
            action: debouncedSearch
              ? undefined
              : {
                  label: 'Add topic',
                  onClick: () => setAddOpen(true),
                },
          }}
        />
      </div>

      {!isLoading && (
        <AdminListPaginationSection
          pagination={{
            page: paginationMeta.page,
            limit: paginationMeta.limit,
            total: paginationMeta.total,
            totalPages: paginationMeta.totalPages,
          }}
          onPageChange={setCurrentPage}
          pageSize={rowsPerPage}
          pageSizeOptions={ADMIN_ROWS_PER_PAGE_OPTIONS}
          onPageSizeChange={handlePageSizeChange}
          disabled={isFetching}
          countNoun="topics"
        />
      )}

      <Dialog open={titleEditOpen} onOpenChange={setTitleEditOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit section title</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-slate-400">
            Nepali heading shown above consultation topics in the public app (max 512 characters).
          </p>
          <Textarea
            value={titleModalDraft}
            onChange={(e) => setTitleModalDraft(e.target.value)}
            maxLength={512}
            rows={5}
            placeholder="Section title in Nepali…"
            className="bg-slate-950 border-slate-600 text-white"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setTitleEditOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              type="button"
              loading={titleMutation.isPending}
              disabled={
                !titleModalDraft.trim() ||
                titleModalDraft.trim() === data.titleNe.trim()
              }
              onClick={() => {
                const t = titleModalDraft.trim();
                if (!t) {
                  toast.error('Title cannot be empty');
                  return;
                }
                titleMutation.mutate(t);
              }}
            >
              Save title
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Delete consultation topic?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            This removes the topic from the public app. Older match requests that included it may still
            reference the topic ID.
          </p>
          <p className="rounded-lg border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-200 whitespace-pre-wrap break-words max-h-[30vh] overflow-y-auto">
            {deleteTarget?.textNe}
          </p>
          <p className="text-[11px] text-slate-500 font-mono break-all">{deleteTarget?.id}</p>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <LoadingButton
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteMutation.mutate(deleteTarget.id);
              }}
            >
              Delete
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Add consultation topic</DialogTitle>
          </DialogHeader>
          <Textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={5}
            placeholder="Nepali question line…"
            className="bg-slate-950 border-slate-600"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <LoadingButton
              type="button"
              loading={createMutation.isPending}
              onClick={() => {
                const t = newText.trim();
                if (!t) {
                  toast.error('Enter question text');
                  return;
                }
                createMutation.mutate(t);
              }}
            >
              Add topic
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editQuestion !== null} onOpenChange={(o) => !o && setEditQuestion(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit consultation topic</DialogTitle>
          </DialogHeader>
          <p className="text-[11px] text-slate-500 font-mono break-all">{editQuestion?.id}</p>
          <Textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={6}
            className="bg-slate-950 border-slate-600"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setEditQuestion(null)}>
              Cancel
            </Button>
            <LoadingButton
              type="button"
              loading={saveTextMutation.isPending}
              disabled={
                !editDraft.trim() || editDraft.trim() === editQuestion?.textNe.trim()
              }
              onClick={() => {
                if (!editQuestion) return;
                const t = editDraft.trim();
                if (!t) {
                  toast.error('Question text cannot be empty');
                  return;
                }
                saveTextMutation.mutate({ id: editQuestion.id, textNe: t });
              }}
            >
              Save question
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
