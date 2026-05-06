'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { useDebounce, useDebouncedPageSize } from '@/hooks';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  LoadingButton,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@jyotish/ui';
import {
  AdminRole,
  QUESTIONNAIRE_LANGUAGES,
  type QuestionnaireCategory,
} from '@jyotish/shared';
import { toast } from 'sonner';
import {
  AdminTable,
  AdminListPaginationSection,
  AdminRefreshButton,
  type AdminTableColumn,
} from '@/components/admin';
import { ConfirmDialog } from '@/components/ui';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';
import { useAdminStore } from '@/store/admin-store';

type QuestionnairesListResponse = {
  categories: QuestionnaireCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type BroadcastPricingRow = { id: string; questionCount: number; amountNr: string };
const FIRST_ROW_ID = 'row-1';

const questionnaireFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Category name must be at least 2 characters')
    .max(100, 'Category name is too long'),
  emoji: z.string().max(8, 'Icon/emoji is too long').optional(),
  language: z.enum(['NEPALI', 'HINDI', 'ENGLISH']).default('ENGLISH'),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0, 'Sort order cannot be negative').default(0),
  questions: z
    .array(
      z.object({
        text: z
          .string()
          .min(3, 'Question must be at least 3 characters')
          .max(300, 'Question is too long'),
      })
    )
    .min(1, 'Please add at least one question'),
});

type QuestionnaireFormValues = z.infer<typeof questionnaireFormSchema>;

function toFormDefaults(item?: QuestionnaireCategory): QuestionnaireFormValues {
  return {
    name: item?.name ?? '',
    emoji: item?.emoji ?? '',
    language: (item?.language ?? 'ENGLISH') as 'NEPALI' | 'HINDI' | 'ENGLISH',
    isActive: item?.isActive ?? true,
    sortOrder: item?.sortOrder ?? 0,
    questions: item?.questions.map((question) => ({
      text: question.text,
    })) ?? [
      {
        text: '',
      },
    ],
  };
}

export default function QuestionnairesManagementPage() {
  const canViewBroadcastQuestionPricing =
    useAdminStore((s) => s.admin?.adminRole !== AdminRole.USER_SUPPORT);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const debouncedSearch = useDebounce(searchTerm, ADMIN_SEARCH_DEBOUNCE_MS);
  const [languageFilter, setLanguageFilter] = React.useState<string>('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const {
    pageSize: rowsPerPage,
    setPageSize: setRowsPerPage,
    debouncedPageSize: debouncedRowsPerPage,
  } = useDebouncedPageSize(PAGINATION_DEFAULTS.LIMIT);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<QuestionnaireCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = React.useState<QuestionnaireCategory | null>(
    null
  );

  const form = useForm<QuestionnaireFormValues>({
    resolver: zodResolver(questionnaireFormSchema),
    defaultValues: toFormDefaults(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const {
    data: listResponse,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<QuestionnairesListResponse>({
    queryKey: [
      ...ADMIN_QUERY_KEYS.WEBSITE.QUESTIONNAIRES(),
      currentPage,
      debouncedSearch,
      languageFilter,
      debouncedRowsPerPage,
    ],
    queryFn: () =>
      adminApi.website.questionnaires.list({
        page: currentPage,
        limit: debouncedRowsPerPage,
        search: debouncedSearch || undefined,
        language: languageFilter || undefined,
      }),
  });

  const handlePageSizeChange = (size: number) => {
    if (size === rowsPerPage) return;
    setRowsPerPage(size);
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  };

  const { data: pricingData } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.WEBSITE.BROADCAST_QUESTION_PRICING(),
    queryFn: () => adminApi.website.broadcastQuestionPricing.get(),
    enabled: canViewBroadcastQuestionPricing,
  });
  const [pricingRows, setPricingRows] = React.useState<BroadcastPricingRow[]>([
    { id: FIRST_ROW_ID, questionCount: 1, amountNr: '' },
  ]);
  React.useEffect(() => {
    const tiers = pricingData?.tiers ?? [];
    if (tiers.length === 0) return;
    const one = tiers.find((t) => t.questionCount === 1);
    const rest = tiers
      .filter((t) => t.questionCount !== 1)
      .sort((a, b) => a.questionCount - b.questionCount);
    setPricingRows([
      { id: FIRST_ROW_ID, questionCount: 1, amountNr: one != null ? String(one.amountNr) : '' },
      ...rest.map((t) => ({
        id: `row-${t.questionCount}`,
        questionCount: t.questionCount,
        amountNr: String(t.amountNr),
      })),
    ]);
  }, [pricingData]);

  const pricingMutation = useMutation({
    mutationFn: (tiers: { questionCount: number; amountNr: number }[]) =>
      adminApi.website.broadcastQuestionPricing.update(tiers),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.BROADCAST_QUESTION_PRICING(),
      });
      toast.success('Broadcast question pricing updated.');
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to update pricing.');
    },
  });

  const categories = listResponse?.categories ?? [];
  const pagination = listResponse?.pagination || {
    page: 1,
    limit: debouncedRowsPerPage,
    total: 0,
    totalPages: 0,
  };

  React.useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [debouncedSearch, languageFilter, debouncedRowsPerPage]);

  const createMutation = useMutation({
    mutationFn: (values: QuestionnaireFormValues) =>
      adminApi.website.questionnaires.create({
        name: values.name.trim(),
        emoji: values.emoji?.trim() || undefined,
        language: values.language,
        isActive: values.isActive ?? true,
        sortOrder: values.sortOrder,
        questions: values.questions.map((question) => question.text.trim()),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.QUESTIONNAIRES(),
      });
      toast.success('Questionnaire created successfully');
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create questionnaire');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: QuestionnaireFormValues) => {
      if (!editing) {
        throw new Error('No questionnaire selected');
      }
      return adminApi.website.questionnaires.update(editing.id, {
        name: values.name.trim(),
        emoji: values.emoji?.trim() || undefined,
        language: values.language,
        isActive: values.isActive ?? true,
        sortOrder: values.sortOrder,
        questions: values.questions.map((question) => question.text.trim()),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.QUESTIONNAIRES(),
      });
      toast.success('Questionnaire updated successfully');
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update questionnaire');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.website.questionnaires.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ADMIN_QUERY_KEYS.WEBSITE.QUESTIONNAIRES(),
      });
      toast.success('Questionnaire deleted successfully');
      setCategoryToDelete(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete questionnaire');
    },
  });

  const openCreate = () => {
    setEditing(null);
    form.reset(toFormDefaults());
    setDialogOpen(true);
  };

  const openEdit = (item: QuestionnaireCategory) => {
    setEditing(item);
    form.reset(toFormDefaults(item));
    setDialogOpen(true);
  };

  const handleSubmit = (values: QuestionnaireFormValues) => {
    if (editing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <div className="space-y-5 sm:space-y-6">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 pr-1 text-2xl sm:text-3xl font-bold cosmic-text break-words">
              Questionnaires
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
                Add category
              </Button>
            </div>
          </div>
          <p className="text-sm sm:text-base text-slate-400">
            Manage question categories, optional icons, and predefined questions shown on the client
            dashboard.
          </p>
          <Button
            onClick={openCreate}
            className="sm:hidden w-full gap-2 bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add category
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
          <div className="w-full min-w-0 sm:col-span-1">
            <Search
              containerClassName="w-full"
              placeholder="Search categories..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="w-full min-w-0 flex justify-stretch sm:justify-end">
            <Select
              value={languageFilter || 'ALL'}
              onValueChange={(value) => setLanguageFilter(value === 'ALL' ? '' : value)}
            >
              <SelectTrigger className="w-full sm:w-[180px] border-slate-700 bg-slate-900 text-white">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All languages</SelectItem>
                {QUESTIONNAIRE_LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="cosmic-card rounded-xl overflow-hidden">
          <AdminTable
            data={categories}
            loading={isLoading}
            keyExtractor={(item) => item.id}
            columns={
              [
                {
                  header: 'Category',
                  accessor: (item) => (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {item.emoji && (
                          <span className="text-lg" aria-hidden="true">
                            {item.emoji}
                          </span>
                        )}
                        <span className="font-medium text-white">{item.name}</span>
                      </div>
                      <div className="text-xs text-slate-400">
                        {item.questions.length} question{item.questions.length === 1 ? '' : 's'}
                      </div>
                    </div>
                  ),
                },
                {
                  header: 'Language',
                  accessor: (item) => (
                    <span className="text-sm text-slate-300">{item.language ?? 'ENGLISH'}</span>
                  ),
                  width: '100px',
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
                  header: 'Sort Order',
                  accessor: (item) => (
                    <span className="text-sm text-slate-300">{item.sortOrder}</span>
                  ),
                  width: '100px',
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
                        className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                        onClick={() => setCategoryToDelete(item)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                  className: 'text-right',
                  width: '260px',
                },
              ] satisfies AdminTableColumn<QuestionnaireCategory>[]
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
              title: debouncedSearch ? 'No questionnaires found' : 'No questionnaires yet',
              description: debouncedSearch
                ? 'Try adjusting your search terms'
                : 'Create the first category to manage predefined questions for the client dashboard.',
              action: searchTerm ? undefined : { label: 'Add category', onClick: openCreate },
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

        {canViewBroadcastQuestionPricing && (
          <Card className="cosmic-card border border-slate-700 overflow-hidden">
              <CardHeader className="space-y-1 p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl text-white">
                  Broadcast question pricing (NRs)
                </CardTitle>
                <p className="text-sm text-slate-400">
                  Set NRs per number of questions. First row is for 1 question; add custom rows for
                  more (e.g. 2 questions = 190 NRs, 5 = 400 NRs).
                </p>
              </CardHeader>
              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-3">
                  {pricingRows.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col gap-3 rounded-lg border border-slate-600 bg-slate-800/50 p-3 sm:flex-row sm:flex-wrap sm:items-center"
                    >
                      {row.id === FIRST_ROW_ID ? (
                        <>
                          <span className="text-slate-300 text-sm shrink-0 sm:w-32">
                            1 question
                          </span>
                          <Label className="sr-only">Price (NRs)</Label>
                          <Input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="NRs"
                            value={row.amountNr}
                            onChange={(e) =>
                              setPricingRows((prev) =>
                                prev.map((r) =>
                                  r.id === FIRST_ROW_ID ? { ...r, amountNr: e.target.value } : r
                                )
                              )
                            }
                            className="bg-slate-800 border-slate-600 text-white h-9 w-full min-w-0 sm:w-28"
                          />
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                            <Label className="text-slate-300 text-sm shrink-0">
                              No. of questions
                            </Label>
                            <Input
                              type="number"
                              min={2}
                              max={50}
                              step={1}
                              value={row.questionCount}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (Number.isNaN(v) || v < 2) return;
                                setPricingRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id
                                      ? { ...r, questionCount: Math.min(50, Math.max(2, v)) }
                                      : r
                                  )
                                );
                              }}
                              className="bg-slate-800 border-slate-600 text-white h-9 w-full min-w-0 sm:w-24"
                            />
                          </div>
                          <div className="flex flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                            <Label className="text-slate-300 text-sm shrink-0">Price (NRs)</Label>
                            <Input
                              type="number"
                              min={0}
                              step={1}
                              placeholder="NRs"
                              value={row.amountNr}
                              onChange={(e) =>
                                setPricingRows((prev) =>
                                  prev.map((r) =>
                                    r.id === row.id ? { ...r, amountNr: e.target.value } : r
                                  )
                                )
                              }
                              className="bg-slate-800 border-slate-600 text-white h-9 w-full min-w-0 sm:w-28"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="self-end text-slate-400 hover:text-red-400 sm:self-center"
                            onClick={() =>
                              setPricingRows((prev) => prev.filter((r) => r.id !== row.id))
                            }
                            aria-label="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-slate-600 text-slate-300 sm:w-auto"
                    onClick={() => {
                      const maxCount =
                        pricingRows.length === 0
                          ? 1
                          : Math.max(...pricingRows.map((r) => r.questionCount), 1);
                      const nextCount = maxCount + 1;
                      setPricingRows((prev) => [
                        ...prev,
                        {
                          id: `custom-${Date.now()}`,
                          questionCount: nextCount,
                          amountNr: '',
                        },
                      ]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add custom
                  </Button>
                  <LoadingButton
                    loading={pricingMutation.isPending}
                    loadingText="Saving..."
                    className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 sm:w-auto"
                    onClick={() => {
                      const tiers = pricingRows.map((r) => {
                        const v = parseInt(r.amountNr, 10);
                        return {
                          questionCount: r.questionCount,
                          amountNr: Number.isNaN(v) ? 0 : Math.max(0, v),
                        };
                      });
                      const withAmount = tiers.filter((t) => t.amountNr > 0);
                      if (withAmount.length === 0) {
                        toast.error('Set at least one tier amount (NRs).');
                        return;
                      }
                      const counts = tiers.map((t) => t.questionCount);
                      const dup = counts.find((c, i) => counts.indexOf(c) !== i);
                      if (dup != null) {
                        toast.error(
                          `Duplicate number of questions: ${dup}. Each row must be unique.`
                        );
                        return;
                      }
                      pricingMutation.mutate(tiers);
                    }}
                  >
                    Save pricing
                  </LoadingButton>
                </div>
              </CardContent>
            </Card>
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
            }
          }}
        >
          <DialogContent className="flex max-h-[min(90vh,900px)] w-[calc(100vw-2rem)] flex-col overflow-hidden bg-slate-900 border-slate-700 text-white sm:max-w-2xl">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-white">
                {editing ? 'Edit Questionnaire' : 'Add Questionnaire'}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="flex min-h-0 flex-1 flex-col space-y-6 overflow-y-auto pr-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder="e.g. Marriage (Top Asked)"
                  />
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emoji">Icon / Emoji (optional)</Label>
                  <Input id="emoji" {...form.register('emoji')} placeholder="e.g. ❤️" />
                  {form.formState.errors.emoji && (
                    <p className="text-sm text-red-400">{form.formState.errors.emoji.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={form.watch('language')}
                  onValueChange={(value) =>
                    form.setValue('language', value as 'NEPALI' | 'HINDI' | 'ENGLISH')
                  }
                >
                  <SelectTrigger className="border-slate-700 bg-slate-900/80 text-white w-full md:max-w-[200px]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTIONNAIRE_LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-300">
                  Questions in this category will be shown when users select this language.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sort Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    {...form.register('sortOrder', { valueAsNumber: true })}
                  />
                  {form.formState.errors.sortOrder && (
                    <p className="text-sm text-red-400">
                      {form.formState.errors.sortOrder.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <button
                      type="button"
                      onClick={() => form.setValue('isActive', true)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        (form.watch('isActive') ?? true)
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                          : 'bg-slate-800 border-slate-600 text-slate-300'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => form.setValue('isActive', false)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        form.watch('isActive') === false
                          ? 'bg-slate-500/20 border-slate-400 text-slate-100'
                          : 'bg-slate-800 border-slate-600 text-slate-300'
                      }`}
                    >
                      Disabled
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <Label>Predefined Questions</Label>
                    <p className="text-xs text-slate-300">
                      These questions will be suggested to clients under this category.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 self-start border-slate-700 text-slate-200 hover:bg-slate-800 sm:self-auto"
                    onClick={() =>
                      append({
                        text: '',
                      })
                    }
                    aria-label="Add question"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex min-w-0 items-center gap-2">
                      <div className="w-5 shrink-0 text-right text-xs text-slate-400">
                        {index + 1}.
                      </div>
                      <Input
                        {...form.register(`questions.${index}.text` as const)}
                        placeholder="Type a predefined question..."
                        className="min-w-0 flex-1 bg-slate-900/80 border-slate-700 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-400"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                        aria-label="Remove question"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                {form.formState.errors.questions && (
                  <p className="text-sm text-red-400">
                    {form.formState.errors.questions.message ??
                      (Array.isArray(form.formState.errors.questions) &&
                        form.formState.errors.questions.find(Boolean)?.text?.message) ??
                      ''}
                  </p>
                )}
              </div>

              <DialogFooter className="mt-4 shrink-0 border-t border-slate-700/80 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-slate-700 sm:w-auto"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  className="w-full bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90 sm:w-auto"
                >
                  {editing ? 'Save changes' : 'Create questionnaire'}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          isOpen={categoryToDelete !== null}
          onClose={() => {
            if (!deleteMutation.isPending) setCategoryToDelete(null);
          }}
          onConfirm={() => {
            if (categoryToDelete) deleteMutation.mutate(categoryToDelete.id);
          }}
          title="Delete this category?"
          description={categoryToDelete ? `"${categoryToDelete.name}". This cannot be undone.` : ''}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          isLoading={deleteMutation.isPending}
          icon={<Trash2 className="w-6 h-6 text-red-400" />}
        />
      </div>
    </>
  );
}
