'use client';

import { JyotishLayout } from '@/components/layouts/JyotishLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@jyotish/ui';
import { FormPasswordInput } from '@/components/form';
import { astrologerApi } from '@/lib/astrologer-api';
import { useAuthStore } from '@/store/auth-store';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES, ROUTES } from '@/constants';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { displayError, displaySuccess } from '@/utils/error-handler';
import type { ApiError } from '@/types/auth';
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validations';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export default function JyotishSettingsPage() {
  const { user } = useRequireAuth({ requiredRole: USER_ROLES.ASTROLOGER });

  // Change password form - Astrologers always have passwords
  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Change password mutation - Using astrologer-specific API
  const changePasswordMutation = useMutation({
    mutationFn: astrologerApi.changePassword,
    onSuccess: (response: { message: string; astrologer?: Record<string, unknown> }) => {
      displaySuccess('Password changed successfully!');
      changePasswordForm.reset();
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to change password');
    },
  });

  const onChangePasswordSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  if (!user) {
    return null;
  }

  return (
    <JyotishLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            ⚙️ Settings
          </h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Change Password Section */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">🔐 Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={changePasswordForm.handleSubmit(onChangePasswordSubmit)}
              className="space-y-4 max-w-md"
            >
              <FormPasswordInput
                id="currentPassword"
                name="currentPassword"
                label="Current Password"
                placeholder="Enter current password"
                value={changePasswordForm.watch('currentPassword')}
                onChange={(e) => changePasswordForm.setValue('currentPassword', e.target.value)}
                onBlur={() => changePasswordForm.trigger('currentPassword')}
                error={changePasswordForm.formState.errors.currentPassword?.message}
                disabled={changePasswordMutation.isPending}
                autoComplete="current-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />

              <FormPasswordInput
                id="newPassword"
                name="newPassword"
                label="New Password"
                placeholder="Enter new password"
                value={changePasswordForm.watch('newPassword')}
                onChange={(e) => changePasswordForm.setValue('newPassword', e.target.value)}
                onBlur={() => changePasswordForm.trigger('newPassword')}
                error={changePasswordForm.formState.errors.newPassword?.message}
                disabled={changePasswordMutation.isPending}
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />

              <FormPasswordInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={changePasswordForm.watch('confirmPassword')}
                onChange={(e) => changePasswordForm.setValue('confirmPassword', e.target.value)}
                onBlur={() => changePasswordForm.trigger('confirmPassword')}
                error={changePasswordForm.formState.errors.confirmPassword?.message}
                disabled={changePasswordMutation.isPending}
                autoComplete="new-password"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />

              <Button
                type="submit"
                disabled={changePasswordMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold"
              >
                {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Notification Settings Section */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              Configure your notification preferences for chats, appointments, and more.
            </p>
            <Link href={`${ROUTES.JYOTISH_SETTINGS}/notifications`}>
              <Button variant="outline" className="text-white">
                Manage Notification Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Language Settings (Coming Soon) */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">🌐 Language</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">Language settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </JyotishLayout>
  );
}
