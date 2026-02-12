/**
 * Jyotish Profile Page - Astrologer profile management
 */

'use client';

import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useAuth, useRequireAuth } from '@/hooks';
import { ROUTES, USER_ROLES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, Label, Input } from '@jyotish/ui';
import { LoadingButton } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { displayError, displaySuccess } from '@/utils/error-handler';
import { FormInput } from '@/components/form';
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validations';
import type { ApiError } from '@/types/auth';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';
import { RemoveProfileModal } from '@/components/modals/RemoveProfileModal';
import { LoadingScreenWithBackground } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { GenderEnum, type GenderType } from '@/constants';
import { User, Pencil, MapPin, Briefcase, Settings, Lock, Bell, CreditCard, LogOut } from 'lucide-react';

export default function JyotishProfilePage() {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const { setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const astrologer = user as any; // Astrologer-specific fields (experience, specialization, languages, bio)

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      gender: (user?.gender as GenderType) || null,
    },
  });

  // Update form when user loads
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        gender: (user?.gender as GenderType) || null,
      });
    }
  }, [user, reset]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateFormData) => {
      return authApi.updateProfile(data);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      // Reset form with updated values
      reset({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
      });
      setIsEditing(false);
      displaySuccess('Profile updated successfully!');
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to update profile');
    },
  });

  // Upload profile photo mutation
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      return authApi.uploadProfilePhoto(file);
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      displaySuccess('Profile photo uploaded successfully!');
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to upload profile photo');
    },
  });

  // Remove profile photo mutation
  const removePhotoMutation = useMutation({
    mutationFn: async () => {
      return authApi.removeProfilePhoto();
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      setShowRemoveModal(false);
      displaySuccess('Profile photo removed successfully!');
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to remove profile photo');
      setShowRemoveModal(false);
    },
  });

  const onSubmit = (data: ProfileUpdateFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      name: user?.name || '',
      email: user?.email || '',
      gender: (user?.gender as GenderType) || null,
    });
  };

  const handlePhotoUpload = (file: File) => {
    uploadPhotoMutation.mutate(file);
  };

  const handlePhotoRemove = () => {
    setShowRemoveModal(true);
  };

  const confirmPhotoRemove = () => {
    removePhotoMutation.mutate();
  };

  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  return (
    <JyotishLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30">
              <User className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#fafaf9] tracking-tight">
                Profile
              </h1>
              <p className="text-sm text-[#78716c] mt-0.5">
                Manage your astrologer profile and settings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={
              isEditing
                ? 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-[#fafaf9] hover:bg-white/10 transition-colors text-sm font-medium'
                : 'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-[#0f0e14] hover:bg-amber-400 transition-colors text-sm font-medium'
            }
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden shadow-lg shadow-black/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <ProfileImageUpload
                  currentImage={user?.profilePhoto}
                  userName={user?.name}
                  onUpload={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
                  isUploading={uploadPhotoMutation.isPending}
                  isEditing={isEditing}
                />

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">{user?.name || 'Jyotish Name'}</h2>
                  <p className="text-sm text-white/80">
                    {user?.phone || user?.phoneNumber || 'No phone number'}
                  </p>
                  {astrologer?.address && (
                    <p className="text-white/60 text-sm flex items-center justify-center gap-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {astrologer.address}
                    </p>
                  )}
                  {user?.email && <p className="text-white/60 text-sm">{user.email}</p>}
                  <span className="inline-block px-3 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold border border-amber-500/30">
                    Astrologer
                  </span>
                </div>

                <div className="w-full pt-4 border-t border-white/[0.1]">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">42</p>
                      <p className="text-xs text-white/60">Consultations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">24</p>
                      <p className="text-xs text-white/60">Clients</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2 bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden shadow-lg shadow-black/20">
            <CardHeader>
              <CardTitle className="text-[#fafaf9] flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-amber-500" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput
                    id="name"
                    label="Full Name"
                    {...register('name')}
                    error={errors.name?.message}
                    disabled={!isEditing}
                    className="bg-white/[0.06] border border-white/[0.12] text-[#fafaf9] placeholder:text-white/40 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                    required
                  />

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white/90">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={user?.phone || user?.phoneNumber || ''}
                      disabled
                      className="bg-white/[0.06] border border-white/[0.12] text-[#fafaf9] placeholder:text-white/40 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                    />
                  </div>

                  {astrologer?.address && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address" className="text-white/90">
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={astrologer.address}
                        disabled
                        className="bg-white/[0.06] border border-white/[0.12] text-[#fafaf9] placeholder:text-white/40 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                      />
                    </div>
                  )}

                  <FormInput
                    id="email"
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    disabled={!isEditing}
                    placeholder="email@example.com"
                    className="bg-white/[0.06] border border-white/[0.12] text-[#fafaf9] placeholder:text-white/40 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-white/90">
                      Gender
                    </Label>
                    {isEditing ? (
                      <>
                        <select
                          id="gender"
                          {...register('gender')}
                          className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[#fafaf9] text-sm focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 [color-scheme:dark]"
                        >
                          <option value="">Select Gender</option>
                          <option value={GenderEnum.MALE}>Male</option>
                          <option value={GenderEnum.FEMALE}>Female</option>
                          <option value={GenderEnum.OTHER}>Other</option>
                        </select>
                        {errors.gender && (
                          <p className="text-xs text-red-400">{errors.gender.message}</p>
                        )}
                      </>
                    ) : (
                      <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-lg text-[#fafaf9] text-sm">
                        {user?.gender ? (
                          user.gender === GenderEnum.MALE ? (
                            'Male'
                          ) : user.gender === GenderEnum.FEMALE ? (
                            'Female'
                          ) : (
                            'Other'
                          )
                        ) : (
                          <span className="text-gray-500 italic">Not set</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-white/90">
                      Years of Experience
                    </Label>
                    <Input
                      id="experience"
                      type="number"
                      value={astrologer?.experience ?? ''}
                      disabled
                      className="bg-white/[0.06] border border-white/[0.12] text-[#fafaf9] placeholder:text-white/40 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="languages" className="text-white/90">
                      Languages
                    </Label>
                    <Input
                      id="languages"
                      type="text"
                      value={
                        Array.isArray(astrologer?.languages)
                          ? astrologer.languages.join(', ')
                          : astrologer?.languages || ''
                      }
                      disabled
                      className="bg-white/[0.06] border border-white/[0.12] text-[#fafaf9] placeholder:text-white/40 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-white/90">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    type="text"
                    value={
                      Array.isArray(astrologer?.specialization)
                        ? astrologer.specialization.join(', ')
                        : astrologer?.specialization || ''
                    }
                    disabled
                    className="bg-white/[0.06] border border-white/[0.12] text-[#fafaf9] placeholder:text-white/40 focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white/90">
                    Bio
                  </Label>
                  {isEditing ? (
                    <textarea
                      id="bio"
                      rows={4}
                      defaultValue={astrologer?.bio || ''}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-white/[0.06] border border-white/[0.12] rounded-lg text-[#fafaf9] text-sm focus:outline-none focus:border-amber-500/40 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60 disabled:cursor-not-allowed resize-none placeholder:text-white/40"
                      placeholder="Tell us about your expertise and background..."
                    />
                  ) : (
                    <div className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.1] rounded-lg text-[#fafaf9] text-sm min-h-[100px]">
                      {astrologer?.bio || (
                        <span className="text-white/40 italic">No bio provided</span>
                      )}
                    </div>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <LoadingButton
                      type="submit"
                      isLoading={updateProfileMutation.isPending}
                      loadingText="Saving..."
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-[#0f0e14] font-medium rounded-xl py-2.5"
                    >
                      Save Changes
                    </LoadingButton>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={updateProfileMutation.isPending}
                      className="flex-1 py-2.5 rounded-xl border border-white/20 bg-white/5 text-[#fafaf9] hover:bg-white/10 transition-colors font-medium disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden shadow-lg shadow-black/20">
            <CardHeader>
              <CardTitle className="text-[#fafaf9] flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-amber-400" />
                Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              <div className="flex justify-between items-center py-3 border-b border-white/[0.1]">
                <span className="text-white/60 text-sm">Consultation Rate</span>
                <span className="text-[#fafaf9] font-semibold">NPR 1,500/hr</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/[0.1]">
                <span className="text-white/60 text-sm">Average Rating</span>
                <span className="text-[#fafaf9] font-semibold">4.8 (24 reviews)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/[0.1]">
                <span className="text-white/60 text-sm">Total Consultations</span>
                <span className="text-[#fafaf9] font-semibold">156</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-white/60 text-sm">Member Since</span>
                <span className="text-[#fafaf9] font-semibold">January 2024</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-sm border border-white/[0.12] rounded-xl overflow-hidden shadow-lg shadow-black/20">
            <CardHeader>
              <CardTitle className="text-[#fafaf9] flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-400" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                type="button"
                onClick={() => router.push(ROUTES.JYOTISH_SETTINGS)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-[#fafaf9] hover:bg-white/[0.08] hover:border-amber-500/20 transition-colors text-left text-sm font-medium"
              >
                <Lock className="h-4 w-4 text-amber-400 shrink-0" />
                Change Password
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-[#fafaf9] hover:bg-white/[0.08] hover:border-amber-500/20 transition-colors text-left text-sm font-medium"
              >
                <Bell className="h-4 w-4 text-amber-400 shrink-0" />
                Notification Settings
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-[#fafaf9] hover:bg-white/[0.08] hover:border-amber-500/20 transition-colors text-left text-sm font-medium"
              >
                <CreditCard className="h-4 w-4 text-amber-400 shrink-0" />
                Payment Methods
              </button>
              <button
                type="button"
                onClick={() => handleLogout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors text-left text-sm font-medium"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Remove Profile Photo Modal */}
        <RemoveProfileModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          onConfirm={confirmPhotoRemove}
          isLoading={removePhotoMutation.isPending}
        />
      </div>
    </JyotishLayout>
  );
}
