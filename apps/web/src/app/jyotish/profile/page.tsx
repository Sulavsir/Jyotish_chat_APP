/**
 * Jyotish Profile Page - Astrologer profile management
 */

'use client';

import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { useAuth, useRequireAuth } from '@/hooks';
import { ROUTES, USER_ROLES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle, Button, Label, Input } from '@jyotish/ui';
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

export default function JyotishProfilePage() {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.ASTROLOGER,
  });
  const { setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

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
    },
  });

  // Update form when user loads
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
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
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">Profile 👤</h1>
            <p className="text-gray-300">Manage your astrologer profile and settings</p>
          </div>
          <Button
            color={isEditing ? 'secondary' : 'primary'}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="lg:col-span-1 bg-black/20 backdrop-blur-sm border-white/10">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <ProfileImageUpload
                  currentImage={user?.profilePhoto}
                  userName={user?.name}
                  onUpload={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
                  isUploading={uploadPhotoMutation.isPending}
                  isEditing={isEditing}
                />

                {/* User Info */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">{user?.name || 'Jyotish Name'}</h2>
                  <p className="text-gray-400">{user?.phoneNumber}</p>
                  {user?.email && <p className="text-gray-400">{user.email}</p>}
                  <span className="inline-block px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-semibold">
                    Astrologer
                  </span>
                </div>

                {/* Stats */}
                <div className="w-full pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">42</p>
                      <p className="text-xs text-gray-400">Consultations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-white">24</p>
                      <p className="text-xs text-gray-400">Clients</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details */}
          <Card className="lg:col-span-2 bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Personal Information</CardTitle>
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                    required
                  />

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      defaultValue={user?.phoneNumber || ''}
                      disabled
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                    />
                  </div>

                  <FormInput
                    id="email"
                    label="Email"
                    type="email"
                    {...register('email')}
                    error={errors.email?.message}
                    disabled={!isEditing}
                    placeholder="email@example.com"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                  />

                  <div className="space-y-2">
                    <Label htmlFor="experience" className="text-white">
                      Years of Experience
                    </Label>
                    <Input
                      id="experience"
                      type="number"
                      defaultValue="10"
                      disabled={!isEditing}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization" className="text-white">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    type="text"
                    defaultValue="Vedic Astrology, Numerology, Palmistry"
                    disabled={!isEditing}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="languages" className="text-white">
                    Languages
                  </Label>
                  <Input
                    id="languages"
                    type="text"
                    defaultValue="Nepali, English, Hindi"
                    disabled={!isEditing}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 disabled:opacity-50"
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      type="submit"
                      color="primary"
                      size="lg"
                      className="flex-1"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleCancel}
                      className="flex-1"
                      disabled={updateProfileMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Consultation Rate</span>
                <span className="text-white font-semibold">NPR 1,500/hr</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Average Rating</span>
                <span className="text-white font-semibold">⭐ 4.8 (24 reviews)</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Total Consultations</span>
                <span className="text-white font-semibold">156</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white font-semibold">January 2024</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 backdrop-blur-sm border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(ROUTES.JYOTISH_SETTINGS)}
              >
                🔒 Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                🔔 Notification Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                💳 Payment Methods
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-400 hover:text-red-300"
                onClick={() => handleLogout()}
              >
                🚪 Logout
              </Button>
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
