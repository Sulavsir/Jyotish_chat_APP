'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/layout/AdminLayout';
import { adminApi } from '@/lib/admin-api';
import { Button, Input, Textarea, LoadingButton } from '@jyotish/ui';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  ArrowLeftIcon,
} from '@jyotish/ui';
import { ADMIN_ROUTES, ADMIN_QUERY_KEYS } from '@/constants';
import { ASTROLOGER_EDIT_PASSWORD } from '@/constants/app.constants';
import {
  updateAstrologerFormSchema,
  parseCommaSeparatedToArray,
  type UpdateAstrologerFormData,
} from '@/constants/validators.constants';
import { AttachmentPreview } from '@/components/ui/AttachmentPreview';
import { AstrologerEditPasswordModal } from '@/components/ui/AstrologerEditPasswordModal';
import { PhoneInputWithCountry, CountrySelect } from '@jyotish/ui';
import { getImageUrl } from '@/utils/helpers';
import { toast } from 'sonner';
import type { Astrologer } from '@/types';
import { X } from 'lucide-react';
import { AstrologerCategory, ASTROLOGER_PROOF_UPLOAD } from '@jyotish/shared';
import { AstrologerCommissionPercentFields } from '@/components/astrologer/AstrologerCommissionPercentFields';

const { MAX_FILES: MAX_NEW_PROOF_FILES, isAllowedType: isAllowedProofType } =
  ASTROLOGER_PROOF_UPLOAD;

export default function EditAstrologerPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const id = params?.id as string;
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<Map<string, string>>(new Map());
  const [proofUrlsToRemove, setProofUrlsToRemove] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const submitInProgressRef = useRef(false);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [pendingUpdatePayload, setPendingUpdatePayload] = useState<
    (UpdateAstrologerFormData & { proofOfAstrology?: string | null }) | null
  >(null);

  function parseProofUrls(value: string | null | undefined): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }

  const { data, isLoading: isLoadingAstrologer } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.DETAIL(id),
    queryFn: async () => {
      const res = await adminApi.astrologers.get(id);
      return (res as { astrologer: Astrologer }).astrologer;
    },
    enabled: !!id,
  });

  const form = useForm<UpdateAstrologerFormData>({
    resolver: zodResolver(updateAstrologerFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      bio: '',
      specialization: [],
      experience: null,
      chatMessageCommissionPercent: 10,
      broadcastMessageCommissionPercent: 10,
      firstBroadcastCommissionPercent: 10,
      kundaliReviewCommissionPercent: 10,
      appointmentCommissionPercent: 10,
      category: 'ORDINARY',
      appointmentFee: null,
      chatMessageFee: null,
      languages: [],
      gender: null,
      address: null,
      country: null,
    },
  });

  useEffect(() => {
    if (!data) return;
    form.reset({
      name: data.name ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      bio: data.bio ?? '',
      specialization: data.specialization ?? [],
      experience: data.experience ?? null,
      chatMessageCommissionPercent: data.chatMessageCommissionPercent ?? 10,
      broadcastMessageCommissionPercent: data.broadcastMessageCommissionPercent ?? 10,
      firstBroadcastCommissionPercent: data.firstBroadcastCommissionPercent ?? 10,
      kundaliReviewCommissionPercent: data.kundaliReviewCommissionPercent ?? 10,
      appointmentCommissionPercent: data.appointmentCommissionPercent ?? 10,
      category: data.category ?? AstrologerCategory.ORDINARY,
      appointmentFee: data.appointmentFee ?? null,
      chatMessageFee: data.chatMessageFee ?? null,
      languages: data.languages ?? [],
      gender: data.gender ?? null,
      address: data.address ?? null,
      country: data.country ?? null,
      inhouseAstrologer: data.inhouseAstrologer ?? false,
    });
  }, [data, form]);

  const updateMutation = useMutation({
    mutationFn: (
      payload: UpdateAstrologerFormData & {
        editPassword: string;
        proofOfAstrology?: string | null;
      }
    ) =>
      adminApi.astrologers.update(id, {
        ...payload,
        email: payload.email ?? null,
        bio: payload.bio ?? null,
        address: payload.address ?? null,
        appointmentFee: payload.appointmentFee ?? null,
        gender: payload.gender ?? null,
      }),
    onSuccess: () => {
      toast.success('Astrologer updated successfully');
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.ALL });
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.DETAIL(id) });
      setShowEditPasswordModal(false);
      setPendingUpdatePayload(null);
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(ASTROLOGER_EDIT_PASSWORD.STORAGE_KEY);
      }
      router.push(ADMIN_ROUTES.ASTROLOGERS);
    },
    onError: (err: Error) => {
      const message =
        err?.message?.toLowerCase().includes('invalid') ||
        err?.message?.toLowerCase().includes('forbidden')
          ? ASTROLOGER_EDIT_PASSWORD.INVALID_PASSWORD
          : err.message || 'Failed to update astrologer';
      toast.error(message);
    },
  });

  const uploadProofMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('proofOfAstrology', file);
      return adminApi.astrologers.uploadProof(id, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.DETAIL(id) });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload proof');
    },
  });

  const uploadProfilePhotoMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('profilePhoto', file);
      return adminApi.astrologers.uploadProfilePhoto(id, fd);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.DETAIL(id) });
      toast.success('Profile photo updated');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload profile photo');
    },
  });

  const removeProfilePhotoMutation = useMutation({
    mutationFn: () => adminApi.astrologers.update(id, { profilePhoto: null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEYS.ASTROLOGERS.DETAIL(id) });
      toast.success('Profile photo removed');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to remove profile photo');
    },
  });

  const onSubmit = async (payload: UpdateAstrologerFormData) => {
    if (submitInProgressRef.current) return;
    submitInProgressRef.current = true;

    try {
      const specialization =
        typeof payload.specialization === 'string'
          ? parseCommaSeparatedToArray(payload.specialization as unknown as string)
          : (payload.specialization ?? []);

      const inhouseAstrologer = payload.inhouseAstrologer === true;

      const updatePayload: UpdateAstrologerFormData & { proofOfAstrology?: string | null } = {
        ...payload,
        inhouseAstrologer,
        specialization: Array.isArray(specialization) ? specialization : [],
      };

      // Handle existing proof URLs that were removed via the UI.
      const serverProofUrls = parseProofUrls(data?.proofOfAstrology ?? null);
      const keptServerUrls = serverProofUrls.filter((url) => !proofUrlsToRemove.has(url));

      if (keptServerUrls.length === 0 && proofFiles.length === 0) {
        // No existing proofs kept and no new files selected -> clear all proofs
        updatePayload.proofOfAstrology = null;
      } else if (keptServerUrls.length > 0) {
        // Persist the remaining proofs by overwriting the field on the server
        updatePayload.proofOfAstrology =
          keptServerUrls.length === 1 ? keptServerUrls[0]! : JSON.stringify(keptServerUrls);
      }

      for (const file of proofFiles) {
        await uploadProofMutation.mutateAsync(file);
      }
      if (proofFiles.length > 0) {
        setProofFiles([]);
        proofPreviews.forEach((url) => URL.revokeObjectURL(url));
        setProofPreviews(new Map());
      }

      const storedPassword =
        typeof window !== 'undefined'
          ? window.sessionStorage.getItem(ASTROLOGER_EDIT_PASSWORD.STORAGE_KEY)
          : null;
      if (storedPassword) {
        await updateMutation.mutateAsync({
          ...updatePayload,
          editPassword: storedPassword,
        });
        setProofUrlsToRemove(new Set());
      } else {
        setPendingUpdatePayload(updatePayload);
        setShowEditPasswordModal(true);
      }
    } catch {
      // Error already shown by mutation onError
    } finally {
      submitInProgressRef.current = false;
    }
  };

  const handleEditPasswordSubmit = async (editPassword: string) => {
    if (!pendingUpdatePayload) return;
    submitInProgressRef.current = true;
    try {
      await updateMutation.mutateAsync({
        ...pendingUpdatePayload,
        editPassword,
      });
      setProofUrlsToRemove(new Set());
    } catch {
      // Error already shown by mutation onError
    } finally {
      submitInProgressRef.current = false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews = new Map<string, string>();

    for (const file of files) {
      if (proofFiles.length + newFiles.length >= MAX_NEW_PROOF_FILES) {
        toast.error(`Maximum ${MAX_NEW_PROOF_FILES} new files per save.`);
        break;
      }
      if (!isAllowedProofType(file.type)) {
        toast.error(`${file.name}: Must be an image (JPEG, PNG, GIF) or PDF.`);
        continue;
      }
      newFiles.push(file);
      if (file.type.startsWith('image/')) {
        newPreviews.set(file.name, URL.createObjectURL(file));
      }
    }

    if (newFiles.length > 0) {
      setProofFiles((prev) => [...prev, ...newFiles]);
      setProofPreviews((prev) => new Map([...prev, ...newPreviews]));
    }
    e.target.value = '';
  };

  const handleRemoveProof = (url: string) => {
    setProofUrlsToRemove((prev) => new Set(prev).add(url));
  };

  const handleRemoveNewProof = (fileName: string) => {
    setProofFiles((prev) => prev.filter((f) => f.name !== fileName));
    setProofPreviews((prev) => {
      const url = prev.get(fileName);
      if (url) URL.revokeObjectURL(url);
      const next = new Map(prev);
      next.delete(fileName);
      return next;
    });
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Profile photo must be an image (JPEG, PNG, GIF, or WebP).');
      e.target.value = '';
      return;
    }
    uploadProfilePhotoMutation.mutate(file);
    e.target.value = '';
  };

  if (!id) {
    router.replace(ADMIN_ROUTES.ASTROLOGERS);
    return null;
  }

  if (isLoadingAstrologer || !data) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-400">Loading astrologer...</p>
        </div>
      </AdminLayout>
    );
  }

  const serverProofUrls = parseProofUrls(data.proofOfAstrology);
  const displayedProofUrls = serverProofUrls.filter((url) => !proofUrlsToRemove.has(url));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(ADMIN_ROUTES.ASTROLOGERS)}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-white">Edit Astrologer</h2>
            <p className="text-slate-400 mt-1">{data.name} — update profile and attachments</p>
          </div>
        </div>

        <AstrologerEditPasswordModal
          open={showEditPasswordModal}
          onOpenChange={(open) => {
            setShowEditPasswordModal(open);
            if (!open) setPendingUpdatePayload(null);
          }}
          onSubmit={handleEditPasswordSubmit}
          isLoading={updateMutation.isPending}
          submitLabel="Save changes"
        />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@example.com"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInputWithCountry
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Enter phone number"
                          defaultCountry="NP"
                        />
                      </FormControl>
                      <FormDescription>
                        E.164 format (e.g. +9779812345678). Phone number must be exactly 10 digits
                        (after country code).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value ?? ''}
                          className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">—</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <CountrySelect
                          value={field.value ?? undefined}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="Select country"
                          variant="admin"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t border-slate-700 pt-6 mt-6">
                <FormLabel className="text-white">Profile Image</FormLabel>
                <FormDescription className="text-slate-400 mb-3 block">
                  Current profile photo. Upload a new image to replace or remove it.
                </FormDescription>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center shrink-0">
                    {data.profilePhoto ? (
                      <img
                        src={getImageUrl(data.profilePhoto) ?? ''}
                        alt={data.name ?? 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-slate-500 text-sm">No photo</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleProfilePhotoChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => profilePhotoInputRef.current?.click()}
                      disabled={uploadProfilePhotoMutation.isPending}
                    >
                      {uploadProfilePhotoMutation.isPending
                        ? 'Uploading…'
                        : data.profilePhoto
                          ? 'Change'
                          : 'Upload'}
                    </Button>
                    {data.profilePhoto && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                        onClick={() => removeProfilePhotoMutation.mutate()}
                        disabled={removeProfilePhotoMutation.isPending}
                      >
                        {removeProfilePhotoMutation.isPending ? 'Removing…' : 'Remove'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                Professional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="chatMessageFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instant Chat Message Fee (NRs)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        NRs charged per direct chat message with this Jyotish.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Vedic, Tarot, Numerology"
                          value={
                            Array.isArray(field.value)
                              ? field.value.join(', ')
                              : (field.value ?? '')
                          }
                          onChange={(e) =>
                            field.onChange(parseCommaSeparatedToArray(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>Comma-separated</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience (years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <AstrologerCommissionPercentFields control={form.control} />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="ORDINARY">Ordinary</option>
                          <option value="PROFESSIONAL">Professional</option>
                          <option value="PREMIUM">Premium</option>
                          <option value="KATHA_VACHAK">Katha Vachak</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appointmentFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appointment Fee</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(e.target.value === '' ? null : Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                Address & Bio
              </h3>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Kathmandu, Nepal"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormDescription>Optional address (city, region, country)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="inhouseAstrologer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In-house astrologer?</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ? 'yes' : 'no'}
                        onChange={(e) => field.onChange(e.target.value === 'yes')}
                        className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Only in-house astrologers can accept broadcast requests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Short bio..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 space-y-6">
              <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                Proof of Astrology (attachments)
              </h3>
              <p className="text-slate-400 text-sm">
                Remove with the cross icon; changes apply when you click Save. Online status cannot
                be edited here.
              </p>
              <div className="flex flex-wrap items-start gap-4">
                {displayedProofUrls.map((url) => {
                  const fullUrl = getImageUrl(url);
                  return (
                    <div key={url} className="relative group">
                      <div className="rounded-lg border border-slate-600 overflow-hidden bg-slate-800/50 p-1">
                        <AttachmentPreview
                          attachmentUrl={fullUrl ?? url}
                          size="lg"
                          onView={() => window.open(fullUrl ?? url, '_blank')}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveProof(url)}
                        className="absolute -top-1 -right-1 z-10 rounded-full bg-red-500/90 text-white p-1 shadow-lg hover:bg-red-500 opacity-90 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove proof"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
                {proofFiles.map((file) => {
                  const preview = proofPreviews.get(file.name);
                  return (
                    <div key={file.name} className="relative group">
                      <div className="rounded-lg border border-slate-600 overflow-hidden bg-slate-800/50 p-3 flex items-center gap-2 min-w-[140px]">
                        {preview ? (
                          <img
                            src={preview}
                            alt="New proof"
                            className="h-24 w-24 object-cover rounded"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded bg-slate-700 flex items-center justify-center text-slate-400">
                            <span className="text-xs font-medium">PDF</span>
                          </div>
                        )}
                        <span
                          className="text-xs text-slate-300 truncate max-w-[100px]"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveNewProof(file.name)}
                        className="absolute -top-1 -right-1 z-10 rounded-full bg-red-500/90 text-white p-1 shadow-lg hover:bg-red-500 opacity-90 group-hover:opacity-100 transition-opacity"
                        aria-label="Remove new proof"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-xs text-amber-400 mt-1">New (saved on Save)</p>
                    </div>
                  );
                })}
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={proofFiles.length >= MAX_NEW_PROOF_FILES}
                    className="border-slate-600 text-slate-300 w-fit"
                  >
                    {proofFiles.length === 0 ? 'Add files' : 'Add more files'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(ADMIN_ROUTES.ASTROLOGERS)}
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
              <LoadingButton
                type="submit"
                loading={updateMutation.isPending || uploadProofMutation.isPending}
                loadingText="Saving..."
              >
                Save changes
              </LoadingButton>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
