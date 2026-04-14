'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { adminApi } from '@/lib/admin-api';
import { Button, Input, Textarea, LoadingButton, ProfileImageInput, PhoneInputWithCountry, CountrySelect } from '@jyotish/ui';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  ArrowLeftIcon,
  CheckIcon,
} from '@jyotish/ui';
import { ADMIN_ROUTES } from '@/constants';
import { AstrologerCommissionPercentFields } from '@/components/astrologer/AstrologerCommissionPercentFields';
import {
  createAstrologerSchema,
  parseCommaSeparatedToArray,
  type CreateAstrologerFormData,
} from '@/constants/validators.constants';
import { ASTROLOGER_PROOF_UPLOAD } from '@jyotish/shared';
import { toast } from 'sonner';

const {
  MAX_FILES: MAX_PROOF_FILES,
  MAX_FILE_SIZE,
  ALLOWED_TYPES: ALLOWED_PROOF_TYPES,
  isAllowedType: isAllowedProofType,
} = ASTROLOGER_PROOF_UPLOAD;

export default function CreateAstrologerPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<Map<string, string>>(new Map());
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateAstrologerFormData>({
    resolver: zodResolver(createAstrologerSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      gender: 'MALE',
      specialization: [],
      experience: 5,
      chatMessageCommissionPercent: 10,
      broadcastMessageCommissionPercent: 10,
      firstBroadcastCommissionPercent: 10,
      kundaliReviewCommissionPercent: 10,
      appointmentCommissionPercent: 10,
      category: 'ORDINARY',
      appointmentFee: null,
      chatMessageFee: null,
      languages: [],
      bio: '',
      address: '',
      country: null,
      inhouseAstrologer: false,
    },
  });

  const onSubmit = async (data: CreateAstrologerFormData) => {
    setIsSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();

      // Add all form fields
      formData.append('name', data.name.trim());
      formData.append('email', data.email.trim());
      formData.append('phone', data.phone.trim());
      formData.append('password', data.password);
      formData.append('gender', data.gender || 'MALE');
      formData.append('experience', String(Number(data.experience) || 0));
      formData.append(
        'chatMessageCommissionPercent',
        String(Number(data.chatMessageCommissionPercent) || 10)
      );
      formData.append(
        'broadcastMessageCommissionPercent',
        String(Number(data.broadcastMessageCommissionPercent) || 10)
      );
      formData.append(
        'firstBroadcastCommissionPercent',
        String(Number(data.firstBroadcastCommissionPercent) || 10)
      );
      formData.append(
        'kundaliReviewCommissionPercent',
        String(Number(data.kundaliReviewCommissionPercent) || 10)
      );
      formData.append(
        'appointmentCommissionPercent',
        String(Number(data.appointmentCommissionPercent) || 10)
      );
      formData.append('category', data.category);
      if (data.appointmentFee) {
        formData.append('appointmentFee', String(Number(data.appointmentFee)));
      }
      if (data.chatMessageFee) {
        formData.append('chatMessageFee', String(Number(data.chatMessageFee)));
      }
      if (data.bio) {
        formData.append('bio', data.bio.trim());
      }
      if (data.address) {
        formData.append('address', data.address.trim());
      }
      if (data.country) {
        formData.append('country', data.country);
      }

      // In-house flag
      formData.append('inhouseAstrologer', data.inhouseAstrologer ? 'true' : 'false');

      // Add arrays
      const specialization = Array.isArray(data.specialization) ? data.specialization : [];
      specialization.forEach((item) => {
        formData.append('specialization[]', item);
      });

      const languages = Array.isArray(data.languages) ? data.languages : [];
      languages.forEach((item) => {
        formData.append('languages[]', item);
      });

      // Add proof files - at least one required
      if (proofFiles.length === 0) {
        toast.error('At least one proof of astrology certificate is required');
        setIsSubmitting(false);
        return;
      }
      proofFiles.forEach((file) => formData.append('proofOfAstrology', file));
      if (profilePhotoFile) {
        formData.append('profilePhoto', profilePhotoFile);
      }

      const response = await adminApi.astrologers.createWithFile(formData);

      toast.success('✅ Astrologer created successfully!');
      router.push(ADMIN_ROUTES.ASTROLOGERS);
    } catch (error: any) {
      console.error('❌ Failed to create astrologer:', error);
      console.error('Error response:', error?.response);
      console.error('Error data:', error?.response?.data);

      // Show detailed error message
      const errorMessage =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create astrologer. Please try again.';

      toast.error(`❌ Error: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews = new Map<string, string>();

    for (const file of files) {
      if (proofFiles.length + newFiles.length >= MAX_PROOF_FILES) {
        toast.error(`Maximum ${MAX_PROOF_FILES} files allowed.`);
        break;
      }
      if (!isAllowedProofType(file.type)) {
        toast.error(`${file.name}: Must be an image (JPEG, PNG, GIF, WebP) or PDF.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: File size must be less than 10MB.`);
        continue;
      }
      newFiles.push(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newPreviews.set(file.name, url);
      }
    }

    if (newFiles.length > 0) {
      setProofFiles((prev) => [...prev, ...newFiles]);
      setProofPreviews((prev) => new Map([...prev, ...newPreviews]));
    }
    e.target.value = '';
  };

  const handleRemoveFile = (fileName: string) => {
    setProofFiles((prev) => prev.filter((f) => f.name !== fileName));
    setProofPreviews((prev) => {
      const url = prev.get(fileName);
      if (url) URL.revokeObjectURL(url);
      const next = new Map(prev);
      next.delete(fileName);
      return next;
    });
  };

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} type="button">
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-white">Add New Astrologer</h2>
            <p className="text-slate-400 mt-1">Create a new cosmic advisor account</p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="cosmic-card rounded-xl p-8">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <PhoneInputWithCountry
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="Enter phone number"
                            defaultCountry="NP"
                          />
                        </FormControl>
                        <FormDescription>
                          Select country and enter number (e.g. +977 98...){' '}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2 space-y-2 border border-purple-400/20 rounded-lg p-3">
                    <FormLabel>Profile Image (Optional)</FormLabel>
                    <ProfileImageInput
                      value={profilePhotoFile}
                      onChange={setProfilePhotoFile}
                      placeholderName={form.watch('name') || 'A'}
                      disabled={isSubmitting}
                      description="Your profile image will be displayed in your profile."
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <PasswordInput
                            name={field.name}
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="Enter password"
                            disabled={isSubmitting}
                            className="w-full"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormDescription>
                          Min 8 chars, 1 uppercase, 1 number, 1 special
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
                        <FormLabel>Gender *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
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
              </div>

              {/* Professional Details */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                  Professional Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="specialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specialization *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Vedic, Numerology, Tarot"
                            onChange={(e) => {
                              const array = parseCommaSeparatedToArray(e.target.value);
                              field.onChange(array);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>Comma-separated list (e.g., Vedic, Tarot)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience (years) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="5"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                        <FormLabel>Category *</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="ORDINARY">Ordinary - Chat only</option>
                            <option value="PROFESSIONAL">Professional - Chat & Appointments</option>
                            <option value="PREMIUM">Premium - Appointments only</option>
                            <option value="KATHA_VACHAK">Katha Vachak - Booking only</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          Determines service availability and features
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="appointmentFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Appointment Fee (Rs)
                          {(form.watch('category') === 'PROFESSIONAL' ||
                            form.watch('category') === 'PREMIUM' ||
                            form.watch('category') === 'KATHA_VACHAK') &&
                            ' *'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="500"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : null)
                            }
                            disabled={form.watch('category') === 'ORDINARY'}
                          />
                        </FormControl>
                        <FormDescription>
                          {form.watch('category') === 'ORDINARY'
                            ? 'Not applicable for ordinary astrologers'
                            : 'Fee charged per appointment session'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chatMessageFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instant Chat Message Fee (NRs)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 10"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : null)
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
                    name="languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Languages</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="English, Hindi, Sanskrit"
                            onChange={(e) => {
                              const array = parseCommaSeparatedToArray(e.target.value);
                              field.onChange(array);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>Comma-separated list (optional)</FormDescription>
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
                            value={field.value ? 'yes' : 'no'}
                            onChange={(e) => field.onChange(e.target.value === 'yes')}
                            className="w-full px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </FormControl>
                        <FormDescription>
                          Only in-house astrologers can accept free broadcast questions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white border-b border-slate-700 pb-2">
                  Additional Information
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
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about this astrologer's expertise and background..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Maximum 1000 characters</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Proof of Astrology Upload */}
                <div className="space-y-2">
                  <FormLabel>
                    Proof of Astrology <span className="text-red-400">*</span>
                  </FormLabel>
                  <FormDescription>
                    Upload certificates or documents proving astrology expertise (Images or PDF, max
                    10MB per file, up to {MAX_PROOF_FILES} files)
                  </FormDescription>
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      id="proof-upload"
                    />
                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting || proofFiles.length >= MAX_PROOF_FILES}
                      >
                        {proofFiles.length === 0 ? 'Add files' : 'Add more files'}
                      </Button>
                      {proofFiles.length === 0 && (
                        <span className="text-sm text-red-400">At least one proof is required</span>
                      )}
                    </div>
                    {proofFiles.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {proofFiles.map((file) => {
                          const preview = proofPreviews.get(file.name);
                          return (
                            <div
                              key={file.name}
                              className="flex items-center gap-2 p-3 rounded-lg border border-slate-700 bg-slate-800/50"
                            >
                              {preview ? (
                                <img
                                  src={preview}
                                  alt=""
                                  className="h-14 w-14 object-cover rounded border border-slate-600"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded border border-slate-600 bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
                                  PDF
                                </div>
                              )}
                              <span
                                className="text-sm text-slate-300 truncate max-w-[140px]"
                                title={file.name}
                              >
                                {file.name}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFile(file.name)}
                                disabled={isSubmitting}
                                className="text-red-400 hover:text-red-300 shrink-0"
                              >
                                Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-6 border-t border-slate-700">
                <LoadingButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <CheckIcon className="w-5 h-5" />
                  Create Astrologer
                </LoadingButton>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
}
