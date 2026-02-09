/**
 * Astrologer Registration Form Component
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Label,
  LoadingButton,
  ArrowLeftIcon,
  ProfileImageInput,
} from '@jyotish/ui';
import { FormInput, FormPasswordInput } from '@/components/form';
import { PhoneInputWithCountry } from '@jyotish/ui';
import {
  astrologerRegistrationSchema,
  type AstrologerRegistrationFormData,
} from '@/lib/validations/astrologerRegistration.validations';
import { astrologerRegistrationService } from '@/services/astrologerRegistration.service';
import { displayError, displaySuccess } from '@/utils/error-handler';
import { Upload, X, FileText } from 'lucide-react';
import type { Gender } from '@prisma/client';
import { parseCommaSeparatedToArray } from '@/utils/parseCommaSeparatedToArray';
import type { ApiError } from '@/types/auth';
import { FILE_UPLOAD } from '@/constants/file-upload.constants';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const;

interface AstrologerRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AstrologerRegistrationForm({
  onSuccess,
  onCancel,
}: AstrologerRegistrationFormProps) {
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<Map<string, string>>(new Map());
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [specializationText, setSpecializationText] = useState('');
  const [languagesText, setLanguagesText] = useState('');

  const form = useForm<AstrologerRegistrationFormData>({
    resolver: zodResolver(astrologerRegistrationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      bio: '',
      address: null as string | null,
      specialization: [],
      experience: undefined,
      languages: ['English', 'Nepali'],
      gender: null,
    },
  });

  const password = form.watch('password');
  const confirmPassword = form.watch('confirmPassword');
  const proofOfAstrologyError = form.formState.errors.proofOfAstrology;

  useEffect(() => {
    const currentSpecializations = form.getValues('specialization') ?? [];
    const currentLanguages = form.getValues('languages') ?? [];
    setSpecializationText(currentSpecializations.join(', '));
    setLanguagesText(currentLanguages.join(', '));
  }, [form]);

  useEffect(() => {
    if (confirmPassword) {
      void form.trigger('confirmPassword');
    }
  }, [password, confirmPassword, form]);

  const registrationMutation = useMutation({
    mutationFn: async (data: AstrologerRegistrationFormData) => {
      if (proofFiles.length === 0) {
        throw new Error('At least one proof of astrology certificate is required');
      }
      return await astrologerRegistrationService.register({
        ...data,
        address: data.address ?? undefined,
        profilePhoto: profilePhotoFile ?? undefined,
        proofOfAstrology: proofFiles,
        gender: (data.gender as Gender | null) || undefined,
      });
    },
    onSuccess: (response) => {
      displaySuccess(response.message || 'Registration request submitted successfully!');
      form.reset();
      // Clean up object URLs
      proofPreviews.forEach((url) => URL.revokeObjectURL(url));
      setProofFiles([]);
      setProofPreviews(new Map());
      setProfilePhotoFile(null);
      setSpecializationText('');
      setLanguagesText('');
      onSuccess?.();
    },
    onError: (error: unknown) => {
      displayError(error as ApiError, 'Failed to submit registration request');
    },
  });

  const ALLOWED_FILE_TYPES = Object.keys(FILE_UPLOAD.ALLOWED_TYPES);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for astrologer proof docs

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const newFiles: File[] = [];
      const newPreviews = new Map<string, string>();

      files.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name}: File size must be less than 10MB`);
          return;
        }

        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          toast.error(`${file.name}: File must be an image (JPEG, PNG, GIF, WebP) or PDF`);
          return;
        }

        newFiles.push(file);

        if (file.type.startsWith('image/')) {
          const preview = URL.createObjectURL(file);
          newPreviews.set(file.name, preview);
        }
      });

      if (newFiles.length > 0) {
        setProofFiles((prev) => [...prev, ...newFiles]);
        setProofPreviews((prev) => new Map([...prev, ...newPreviews]));
        form.setValue('proofOfAstrology', newFiles[0] as unknown as File, { shouldValidate: true });
      }

      // Reset input to allow selecting the same file again
      e.target.value = '';
    },
    [ALLOWED_FILE_TYPES, MAX_FILE_SIZE, form]
  );

  const handleRemoveFile = useCallback(
    (fileName: string) => {
      setProofFiles((prev) => {
        const updated = prev.filter((f) => f.name !== fileName);
        if (updated.length === 0) {
          form.setValue('proofOfAstrology', undefined as unknown as File, {
            shouldValidate: false,
          });
        }
        return updated;
      });
      setProofPreviews((prev) => {
        const preview = prev.get(fileName);
        if (preview) {
          URL.revokeObjectURL(preview);
        }
        const updated = new Map(prev);
        updated.delete(fileName);
        return updated;
      });
    },
    [form]
  );

  const onSubmit = (data: AstrologerRegistrationFormData) => {
    if (proofFiles.length === 0) {
      toast.error('Please upload at least one proof of astrology certificate');
      return;
    }
    registrationMutation.mutate(data);
  };

  return (
    <Card className="bg-black/40 backdrop-blur-lg border-orange-500/30 max-w-4xl mx-auto">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-3 mb-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={registrationMutation.isPending}
              className="text-white hover:text-orange-400 hover:bg-white/10 p-2"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
          )}
          <CardTitle className="text-3xl font-bold text-white flex-1">
            Register as Astrologer 🔮
          </CardTitle>
        </div>
        <CardDescription className="text-gray-300 text-center">
          Fill out the form below. Your registration will be reviewed by our admin team.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-orange-500/30 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="name"
                label="Full Name"
                placeholder="Enter your full name"
                {...form.register('name')}
                error={form.formState.errors.name?.message}
                disabled={registrationMutation.isPending}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  Phone Number
                  <span className="text-red-400 ml-1">*</span>
                </Label>
                <PhoneInputWithCountry
                  id="phone"
                  value={form.watch('phone')}
                  onChange={(value) => form.setValue('phone', value ?? '')}
                  onBlur={() => form.trigger('phone')}
                  placeholder="Enter phone number"
                  disabled={registrationMutation.isPending}
                  defaultCountry="NP"
                  maxNationalDigits={10}
                  variant="jyotish"
                />
                {form.formState.errors.phone?.message && (
                  <p className="text-sm text-red-400">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormInput
                id="email"
                label="Email (Optional)"
                type="email"
                placeholder="Enter your email"
                {...form.register('email')}
                error={form.formState.errors.email?.message}
                disabled={registrationMutation.isPending}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-white">
                  Gender (Optional)
                </Label>
                <select
                  id="gender"
                  {...form.register('gender')}
                  disabled={registrationMutation.isPending}
                  className="flex h-11 w-full rounded-md border-2 border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" className="bg-slate-900 text-white">
                    Select gender
                  </option>
                  {GENDER_OPTIONS.map((option) => (
                    <option
                      key={option.value}
                      value={option.value}
                      className="bg-slate-900 text-white"
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-white">Profile Image (Optional)</Label>
                <ProfileImageInput
                  value={profilePhotoFile}
                  onChange={setProfilePhotoFile}
                  placeholderName={form.watch('name') || 'A'}
                  disabled={registrationMutation.isPending}
                  description="Your profile image will be displayed in your profile."
                  variant="jyotish"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormPasswordInput
                id="password"
                name="password"
                label="Password"
                placeholder="Enter password"
                value={form.watch('password')}
                onChange={(e) => form.setValue('password', e.target.value)}
                onBlur={() => form.trigger('password')}
                error={form.formState.errors.password?.message}
                disabled={registrationMutation.isPending}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />

              <FormPasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm Password"
                placeholder="Confirm password"
                value={form.watch('confirmPassword')}
                onChange={(e) => form.setValue('confirmPassword', e.target.value)}
                onBlur={() => form.trigger('confirmPassword')}
                error={form.formState.errors.confirmPassword?.message}
                disabled={registrationMutation.isPending}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-orange-500/30 pb-2">
              Professional Information
            </h3>

            <div>
              <Label htmlFor="specialization" className="text-white">
                Specialization <span className="text-red-400">*</span>
              </Label>
              <textarea
                id="specialization"
                placeholder="Vedic Astrology, Tarot Reading, Numerology (comma-separated)"
                disabled={registrationMutation.isPending}
                rows={3}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                onChange={(e) => {
                  const value = e.target.value;
                  setSpecializationText(value);
                  const array = parseCommaSeparatedToArray(value);
                  form.setValue('specialization', array, { shouldValidate: true });
                }}
                onBlur={() => form.trigger('specialization')}
                value={specializationText}
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter specializations separated by commas
              </p>
              {form.formState.errors.specialization && (
                <p className="text-sm text-red-400 mt-1">
                  {form.formState.errors.specialization.message}
                </p>
              )}
            </div>

            <FormInput
              id="experience"
              label="Years of Experience (Optional)"
              type="number"
              placeholder="e.g., 5"
              {...form.register('experience', { valueAsNumber: true })}
              error={form.formState.errors.experience?.message}
              disabled={registrationMutation.isPending}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              min={0}
            />

            <div>
              <Label htmlFor="languages" className="text-white">
                Languages <span className="text-red-400">*</span>
              </Label>
              <textarea
                id="languages"
                placeholder="English, Nepali, Hindi (comma-separated)"
                disabled={registrationMutation.isPending}
                rows={3}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                onChange={(e) => {
                  const value = e.target.value;
                  setLanguagesText(value);
                  const array = parseCommaSeparatedToArray(value);
                  form.setValue('languages', array, { shouldValidate: true });
                }}
                onBlur={() => form.trigger('languages')}
                value={languagesText}
              />
              <p className="text-xs text-gray-400 mt-1">Enter languages separated by commas</p>
              {form.formState.errors.languages && (
                <p className="text-sm text-red-400 mt-1">
                  {form.formState.errors.languages.message}
                </p>
              )}
            </div>

            <FormInput
              id="address"
              label="Address (Optional)"
              placeholder="e.g. Kathmandu, Nepal"
              {...form.register('address', {
                setValueAs: (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
              })}
              error={form.formState.errors.address?.message}
              disabled={registrationMutation.isPending}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />

            <div>
              <Label htmlFor="bio" className="text-white">
                Bio (Optional)
              </Label>
              <textarea
                id="bio"
                {...form.register('bio')}
                placeholder="Tell us about yourself and your expertise..."
                disabled={registrationMutation.isPending}
                rows={4}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              />
              {form.formState.errors.bio && (
                <p className="text-sm text-red-400 mt-1">{form.formState.errors.bio.message}</p>
              )}
            </div>
          </div>

          {/* Proof of Astrology */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-orange-500/30 pb-2">
              Proof of Astrology
            </h3>

            <div>
              <Label className="text-white">
                Certificate/Proof Documents <span className="text-red-400">*</span>
              </Label>
              <p className="text-xs text-gray-400 mb-2">
                Upload your certificates or proof documents (Image or PDF, max 10MB per file)
              </p>

              <div className="mt-2">
                <input
                  type="file"
                  id="proofOfAstrology"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  disabled={registrationMutation.isPending}
                  multiple
                  className="hidden"
                />
                <label
                  htmlFor="proofOfAstrology"
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-orange-500/50 transition-colors bg-white/5"
                >
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-300">
                    {proofFiles.length === 0 ? 'Click to upload certificate' : 'Add more documents'}
                  </span>
                </label>
              </div>

              {/* File Previews */}
              {proofFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {proofFiles.map((file) => {
                    const preview = proofPreviews.get(file.name);
                    return (
                      <div
                        key={file.name}
                        className="p-4 border border-white/20 rounded-lg bg-white/5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {preview ? (
                              <div className="relative h-16 w-16 rounded overflow-hidden">
                                <Image
                                  src={preview}
                                  alt="Proof preview"
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="h-16 w-16 flex items-center justify-center bg-white/10 rounded">
                                <FileText className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-white font-medium">{file.name}</p>
                              <p className="text-xs text-gray-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(file.name)}
                            disabled={registrationMutation.isPending}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <X className="h-5 w-5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {proofOfAstrologyError && (
                <p className="text-sm text-red-400 mt-1">
                  {String(
                    typeof proofOfAstrologyError === 'string'
                      ? proofOfAstrologyError
                      : (proofOfAstrologyError?.message ?? '')
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={registrationMutation.isPending}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            )}
            <LoadingButton
              type="submit"
              loading={registrationMutation.isPending}
              className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
            >
              Submit Registration Request
            </LoadingButton>
          </div>

          <p className="text-xs text-center text-gray-400">
            Your registration will be reviewed by our admin team. You will be notified once your
            account is approved.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
