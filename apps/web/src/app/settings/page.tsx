'use client';

import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@jyotish/ui';
import { FormPasswordInput } from '@/components/form';
import { authApi } from '@/lib/auth-api';
import { useRequireAuth } from '@/hooks';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { displayError, displaySuccess } from '@/utils/error-handler';
import type { ApiError } from '@/types/auth';
import {
  changePasswordSchema,
  setPasswordSchema,
  type ChangePasswordFormData,
  type SetPasswordFormData,
} from '@/lib/validations';

export default function SettingsPage() {
  const { user } = useRequireAuth();

  // Change password form (for users with existing password)
  const changePasswordForm = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Set password form (for users without password)
  const setPasswordForm = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      displaySuccess('Password changed successfully!');
      changePasswordForm.reset();
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to change password');
    },
  });

  // Set password mutation
  const setPasswordMutation = useMutation({
    mutationFn: authApi.setPasswordForExistingUser,
    onSuccess: () => {
      displaySuccess('Password set successfully!');
      setPasswordForm.reset();
      window.location.reload();
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to set password');
    },
  });

  const onChangePasswordSubmit = (data: ChangePasswordFormData) => {
    changePasswordMutation.mutate(data);
  };

  const onSetPasswordSubmit = (data: SetPasswordFormData) => {
    setPasswordMutation.mutate(data.password);
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            ⚙️ Settings
          </h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Change/Set Password Section */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🔐 {user.hasPassword ? 'Change Password' : 'Set Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.hasPassword ? (
              // Change password form (requires current password)
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
                  onChange={(e) =>
                    changePasswordForm.setValue('currentPassword', e.target.value)
                  }
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
                  onChange={(e) =>
                    changePasswordForm.setValue('confirmPassword', e.target.value)
                  }
                  onBlur={() => changePasswordForm.trigger('confirmPassword')}
                  error={changePasswordForm.formState.errors.confirmPassword?.message}
                  disabled={changePasswordMutation.isPending}
                  autoComplete="new-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />

                <Button
                  type="submit"
                  color="primary"
                  disabled={changePasswordMutation.isPending}
                  className="w-full"
                >
                  {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                </Button>
              </form>
            ) : (
              // Set password form (no current password required)
              <form
                onSubmit={setPasswordForm.handleSubmit(onSetPasswordSubmit)}
                className="space-y-4 max-w-md"
              >
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    ℹ️ You currently don&apos;t have a password set. Set one now to enable
                    password-based login.
                  </p>
                </div>

                <FormPasswordInput
                  id="password"
                  name="password"
                  label="New Password"
                  placeholder="Enter new password"
                  value={setPasswordForm.watch('password')}
                  onChange={(e) => setPasswordForm.setValue('password', e.target.value)}
                  onBlur={() => setPasswordForm.trigger('password')}
                  error={setPasswordForm.formState.errors.password?.message}
                  disabled={setPasswordMutation.isPending}
                  autoComplete="new-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />

                <FormPasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  value={setPasswordForm.watch('confirmPassword')}
                  onChange={(e) => setPasswordForm.setValue('confirmPassword', e.target.value)}
                  onBlur={() => setPasswordForm.trigger('confirmPassword')}
                  error={setPasswordForm.formState.errors.confirmPassword?.message}
                  disabled={setPasswordMutation.isPending}
                  autoComplete="new-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  required
                />

                <Button
                  type="submit"
                  color="primary"
                  disabled={setPasswordMutation.isPending}
                  className="w-full"
                >
                  {setPasswordMutation.isPending ? 'Setting Password...' : 'Set Password'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Other Settings Sections */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              🔔 Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">Notification settings coming soon...</p>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">🌐 Language</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">Language settings coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
