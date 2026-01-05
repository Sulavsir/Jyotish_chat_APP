'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/store/auth-store';
import { ROUTES, USER_ROLES } from '@/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Badge,
  Label,
  Input,
} from '@jyotish/ui';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { displayError, displaySuccess } from '@/utils/error-handler';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  User,
  Shield,
  AlertCircle,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks';
import { authApi } from '@/lib/auth-api';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';
import { RemoveProfileModal } from '@/components/modals/RemoveProfileModal';
import { FormInput } from '@/components/form';
import { profileEditSchema, type ProfileEditFormData } from '@/lib/validations';
import type { ApiError } from '@/types/auth';

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useRequireAuth({ requiredRole: USER_ROLES.CLIENT });
  const { setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  // Local state for dismissing alerts (resets on page reload/navigation)
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [showPasswordAlert, setShowPasswordAlert] = useState(true);

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      timeOfBirth: user?.timeOfBirth || '',
      placeOfBirth: user?.placeOfBirth || '',
      currentAddress: user?.currentAddress || '',
      permanentAddress: user?.permanentAddress || '',
    },
  });

  // Update form when user loads (only once or when user ID changes)
  useEffect(() => {
    if (user) {
      reset(
        {
          name: user.name || '',
          email: user.email || '',
          dateOfBirth: user.dateOfBirth
            ? new Date(user.dateOfBirth).toISOString().split('T')[0]
            : '',
          timeOfBirth: user.timeOfBirth || '',
          placeOfBirth: user.placeOfBirth || '',
          currentAddress: user.currentAddress || '',
          permanentAddress: user.permanentAddress || '',
        },
        { keepDirtyValues: true }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileEditFormData) => {
      // First update basic profile (name, email)
      const updatedUser = await authApi.updateProfile({
        name: data.name,
        email: data.email,
      });

      // Then update birth details if they're provided
      if (data.dateOfBirth || data.timeOfBirth || data.placeOfBirth) {
        return await authApi.updateBirthDetails({
          dateOfBirth: data.dateOfBirth,
          timeOfBirth: data.timeOfBirth,
          placeOfBirth: data.placeOfBirth,
          currentAddress: data.currentAddress,
          permanentAddress: data.permanentAddress,
        });
      }

      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      // Reset form with updated values
      reset({
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        dateOfBirth: updatedUser.dateOfBirth
          ? new Date(updatedUser.dateOfBirth).toISOString().split('T')[0]
          : '',
        timeOfBirth: updatedUser.timeOfBirth || '',
        placeOfBirth: updatedUser.placeOfBirth || '',
        currentAddress: updatedUser.currentAddress || '',
        permanentAddress: updatedUser.permanentAddress || '',
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

  const onSubmit = (data: ProfileEditFormData) => {
    // Only submit if in editing mode
    if (!isEditing) {
      return;
    }

    updateProfileMutation.mutate(data);
  };

  const handleCancel = () => {
    setIsEditing(false);
    reset({
      name: user?.name || '',
      email: user?.email || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      timeOfBirth: user?.timeOfBirth || '',
      placeOfBirth: user?.placeOfBirth || '',
      currentAddress: user?.currentAddress || '',
      permanentAddress: user?.permanentAddress || '',
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

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-7xl mx-auto">
        {/* Profile Incomplete Warning */}
        {!user.profileCompleted && showProfileAlert && (
          <Alert variant="info" dismissible onDismiss={() => setShowProfileAlert(false)}>
            <AlertTitle>Complete Your Profile</AlertTitle>
            <AlertDescription>
              Your profile is incomplete. Please fill in all the required information below to
              access all features.
            </AlertDescription>
          </Alert>
        )}

        {/* Password Not Set Warning */}
        {!user.hasPassword && showPasswordAlert && (
          <Alert variant="warning" dismissible onDismiss={() => setShowPasswordAlert(false)}>
            <AlertTitle>Password Not Set</AlertTitle>
            <AlertDescription>
              You don&apos;t have a password set. Next time you need to login, you&apos;ll have to
              use OTP.{' '}
              <Button
                onClick={() => router.push(ROUTES.SETTINGS)}
                variant="link"
                color="warning"
                size="sm"
                className="h-auto p-0 text-yellow-400 hover:text-yellow-300"
              >
                Set a password now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Header Banner */}
        <Card className="overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/80 to-slate-900 backdrop-blur-xl border-purple-500/30 shadow-2xl">
          <div className="relative h-28 bg-gradient-to-r from-purple-900/60 via-violet-900/70 to-indigo-900/60 overflow-hidden">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-transparent" />
            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '32px 32px',
              }}
            />
            {/* Bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          <CardContent className="relative -mt-14 px-6 pb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              {/* Profile Photo */}
              <div className="relative">
                <ProfileImageUpload
                  currentImage={user?.profilePhoto}
                  userName={user?.name}
                  onUpload={handlePhotoUpload}
                  onRemove={handlePhotoRemove}
                  isUploading={uploadPhotoMutation.isPending}
                  isEditing={isEditing}
                />
                {!user.profileCompleted && (
                  <div className="absolute -top-2 -right-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent mb-1">
                    {user.name || 'User'}
                  </h1>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-300">
                    {user.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-purple-400" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phoneNumber && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-4 w-4 text-purple-400" />
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <Badge className="px-3 py-1 bg-gradient-to-r from-purple-600/40 to-purple-500/40 text-purple-100 border border-purple-400/50 backdrop-blur-sm shadow-lg shadow-purple-900/30">
                    {user.role}
                  </Badge>
                  {user.profileCompleted && (
                    <Badge className="px-3 py-1 bg-gradient-to-r from-emerald-600/40 to-green-500/40 text-green-100 border border-green-400/50 backdrop-blur-sm shadow-lg shadow-green-900/30">
                      <Check className="h-3 w-3 mr-1" />
                      Profile Complete
                    </Badge>
                  )}
                  {user.hasPassword && (
                    <Badge className="px-3 py-1 bg-gradient-to-r from-blue-600/40 to-cyan-500/40 text-blue-100 border border-blue-400/50 backdrop-blur-sm shadow-lg shadow-blue-900/30">
                      <Shield className="h-3 w-3 mr-1" />
                      Password Set
                    </Badge>
                  )}
                  <Badge className="px-3 py-1 bg-gradient-to-r from-slate-600/40 to-slate-500/40 text-slate-100 border border-slate-400/50 backdrop-blur-sm shadow-lg shadow-slate-900/30">
                    <Calendar className="h-3 w-3 mr-1" />
                    {user.createdAt
                      ? `Since ${new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
                      : 'New Member'}
                  </Badge>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button
                      type="submit"
                      form="profile-form"
                      color="primary"
                      size="lg"
                      disabled={updateProfileMutation.isPending}
                      className="min-w-[120px]"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={handleCancel}
                      disabled={updateProfileMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    color="primary"
                    size="lg"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <form
          id="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!isEditing) return;
            handleSubmit(onSubmit)(e);
          }}
          onKeyDown={(e) => {
            // Prevent form submission on Enter key when not editing
            if (e.key === 'Enter' && !isEditing) {
              e.preventDefault();
            }
          }}
          className="space-y-4"
        >
          {/* Personal Information */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  id="name"
                  label="Full Name"
                  {...register('name')}
                  error={errors.name?.message}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                />

                <div className="space-y-3">
                  <Label
                    htmlFor="phone"
                    className="text-white text-sm font-medium flex items-center gap-1.5"
                  >
                    <Phone className="h-4 w-4" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    defaultValue={user?.phoneNumber || ''}
                    disabled
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 italic">Phone number cannot be changed</p>
                </div>

                <FormInput
                  id="email"
                  label="Email Address"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  disabled={!isEditing}
                  placeholder="your@email.com"
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </CardContent>
          </Card>

          {/* Birth Details */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Birth Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormInput
                  id="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  {...register('dateOfBirth')}
                  error={errors.dateOfBirth?.message}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed [color-scheme:dark]"
                />

                <FormInput
                  id="timeOfBirth"
                  label="Time of Birth"
                  type="time"
                  {...register('timeOfBirth')}
                  error={errors.timeOfBirth?.message}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed [color-scheme:dark]"
                  helperText="24-hour format"
                />

                <FormInput
                  id="placeOfBirth"
                  label="Place of Birth"
                  placeholder="City, Country"
                  {...register('placeOfBirth')}
                  error={errors.placeOfBirth?.message}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed md:col-span-2 lg:col-span-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="bg-black/40 backdrop-blur-xl border-white/10">
            <CardHeader className="pb-4">
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <FormInput
                  id="currentAddress"
                  label="Current Address"
                  placeholder="Your current residential address"
                  {...register('currentAddress')}
                  error={errors.currentAddress?.message}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />

                <FormInput
                  id="permanentAddress"
                  label="Permanent Address"
                  placeholder="Your permanent address"
                  {...register('permanentAddress')}
                  error={errors.permanentAddress?.message}
                  disabled={!isEditing}
                  className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Account Security */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader className="pb-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-0.5">
                    {user.hasPassword ? 'Change Password' : 'Set Password'}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {user.hasPassword
                      ? 'Update your password to keep your account secure'
                      : 'Set a password to enable password-based login'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                color="neutral"
                onClick={() => router.push(ROUTES.SETTINGS)}
                className="whitespace-nowrap"
              >
                {user.hasPassword ? 'Change Password' : 'Set Password'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Remove Profile Photo Modal */}
        <RemoveProfileModal
          isOpen={showRemoveModal}
          onClose={() => setShowRemoveModal(false)}
          onConfirm={confirmPhotoRemove}
          isLoading={removePhotoMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}
