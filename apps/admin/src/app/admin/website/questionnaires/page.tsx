'use client';

import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminLayout from '@/components/layout/AdminLayout';
import { ADMIN_QUERY_KEYS, PAGINATION_DEFAULTS } from '@/constants';
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Search,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@jyotish/ui';
import type { QuestionnaireCategory } from '@jyotish/shared';
import { QUESTIONNAIRE_LANGUAGES } from '@jyotish/shared';
import { toast } from 'sonner';
import { AdminTable, type AdminTableColumn } from '@/components/admin';
import { generatePageNumbers } from '@/utils/helpers';
import { RefreshCw, Plus, Trash2 } from 'lucide-react';
import React from 'react';

type QuestionnairesListResponse = {
  categories: QuestionnaireCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const ITEMS_PER_PAGE = PAGINATION_DEFAULTS.LIMIT;

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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [languageFilter, setLanguageFilter] = React.useState<string>('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<QuestionnaireCategory | null>(null);

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
      searchTerm,
      languageFilter,
    ],
    queryFn: () =>
      adminApi.website.questionnaires.list({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchTerm || undefined,
        language: languageFilter || undefined,
      }),
  });

  const { data: pricingData } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.WEBSITE.BROADCAST_QUESTION_PRICING(),
    queryFn: () => adminApi.website.broadcastQuestionPricing.get(),
  });
  const [pricingRows, setPricingRows] = React.useState<BroadcastPricingRow[]>([
    { id: FIRST_ROW_ID, questionCount: 1, amountNr: '' },
  ]);
  React.useEffect(() => {
    const tiers = pricingData?.tiers ?? [];
    if (tiers.length === 0) return;
    const one = tiers.find((t) => t.questionCount === 1);
    const rest = tiers.filter((t) => t.questionCount !== 1).sort((a, b) => a.questionCount - b.questionCount);
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
    limit: ITEMS_PER_PAGE,
    total: 0,
    totalPages: 0,
  };

  React.useEffect(() => {
    setCurrentPage(PAGINATION_DEFAULTS.PAGE);
  }, [searchTerm, languageFilter]);

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
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Questionnaires</h1>
            <p className="text-slate-400">
              Manage question categories, optional icons, and predefined questions shown on the
              client dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              size="sm"
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={openCreate}
              className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
            >
              Add category
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full flex-1">
            <Search
              placeholder="Search categories..."
              value={searchTerm}
              onSearch={setSearchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
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
                        onClick={() => {
                          const ok = window.confirm(
                            `Delete this category?\n\n${item.name}\n\nThis cannot be undone.`
                          );
                          if (!ok) return;
                          deleteMutation.mutate(item.id);
                        }}
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
              title: searchTerm ? 'No questionnaires found' : 'No questionnaires yet',
              description: searchTerm
                ? 'Try adjusting your search terms'
                : 'Create the first category to manage predefined questions for the client dashboard.',
              action: searchTerm ? undefined : { label: 'Add category', onClick: openCreate },
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

        {/* Broadcast question pricing (NRs): 1 question + custom rows */}
        <Card className="cosmic-card border border-slate-700 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-white">Broadcast question pricing (NRs)</CardTitle>
            <p className="text-sm text-slate-400">
              Set NRs per number of questions. First row is for 1 question; add custom rows for
              more (e.g. 2 questions = 190 NRs, 5 = 400 NRs).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {pricingRows.map((row, index) => (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-600 bg-slate-800/50 p-3"
                >
                  {row.id === FIRST_ROW_ID ? (
                    <>
                      <span className="text-slate-300 text-sm w-32">1 question</span>
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
                              r.id === FIRST_ROW_ID
                                ? { ...r, amountNr: e.target.value }
                                : r
                            )
                          )
                        }
                        className="bg-slate-800 border-slate-600 text-white h-9 w-28"
                      />
                    </>
                  ) : (
                    <>
                      <Label className="text-slate-300 text-sm">No. of questions</Label>
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
                        className="bg-slate-800 border-slate-600 text-white h-9 w-24"
                      />
                      <Label className="text-slate-300 text-sm">Price (NRs)</Label>
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
                        className="bg-slate-800 border-slate-600 text-white h-9 w-28"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-400"
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
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300"
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
                    toast.error(`Duplicate number of questions: ${dup}. Each row must be unique.`);
                    return;
                  }
                  pricingMutation.mutate(tiers);
                }}
                className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
              >
                Save pricing
              </LoadingButton>
            </div>
          </CardContent>
        </Card>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditing(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">
                {editing ? 'Edit Questionnaire' : 'Add Questionnaire'}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6 max-h-[65vh] overflow-y-auto pr-1"
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
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Predefined Questions</Label>
                    <p className="text-xs text-slate-300">
                      These questions will be suggested to clients under this category.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
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
                    <div key={field.id} className="flex items-center gap-2">
                      <div className="text-xs text-slate-400 w-5 text-right">{index + 1}.</div>
                      <Input
                        {...form.register(`questions.${index}.text` as const)}
                        placeholder="Type a predefined question..."
                        className="flex-1 bg-slate-900/80 border-slate-700 text-sm"
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

              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-700"
                  onClick={() => setDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  className="bg-gradient-to-r from-cosmic-purple to-nebula-pink hover:opacity-90"
                >
                  {editing ? 'Save changes' : 'Create questionnaire'}
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
