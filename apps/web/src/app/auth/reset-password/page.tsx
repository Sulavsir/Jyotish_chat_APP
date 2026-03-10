'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ROUTES } from '@/constants';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@jyotish/ui';
import { LoadingButton, Navbar, AppLogo } from '@/components/ui';
import { FormPasswordInput } from '@/components/form';
import spaceImage from '@/assets/images/space.jpg';
import { authApi } from '@/lib/auth-api';
import {
  resetPasswordWithTokenFormSchema,
  type ResetPasswordWithTokenFormData,
} from '@/lib/validations';
import { displayError, displaySuccess } from '@/utils/error-handler';
import type { ApiError } from '@/types/auth';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');

  const form = useForm<ResetPasswordWithTokenFormData>({
    resolver: zodResolver(resetPasswordWithTokenFormSchema),
    defaultValues: {
      token: token ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const resetMutation = useMutation({
    mutationFn: authApi.resetPasswordWithToken,
    onSuccess: (data) => {
      const message = data?.message ?? 'Password has been reset successfully.';
      displaySuccess(message);
      setDoneMessage(message);
      setDone(true);
    },
    onError: (error: ApiError) => {
      displayError(error);
    },
  });

  const handleSubmit = (data: ResetPasswordWithTokenFormData) => {
    resetMutation.mutate({
      token: data.token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex relative overflow-hidden">
        <Navbar />
        <div className="absolute inset-0">
          <Image src={spaceImage} alt="Cosmic Space" fill className="object-cover" quality={90} priority />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="w-full flex items-center justify-center px-4 py-12 relative z-10">
          <div className="w-full max-w-md">
            <Card className="bg-black/30 backdrop-blur-[10px] border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] overflow-hidden">
              <CardContent className="px-6 py-8 text-center space-y-4">
                <p className="text-red-400">Invalid or missing reset token.</p>
                <Button color="secondary" className="w-full h-12 font-bold rounded-lg" asChild>
                  <Link href={ROUTES.FORGOT_PASSWORD}>Request a new reset link</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <Navbar />

      <div className="absolute inset-0">
        <Image src={spaceImage} alt="Cosmic Space" fill className="object-cover" quality={90} priority />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="w-full flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <AppLogo href={ROUTES.HOME} height={56} className="inline-block mb-2" />
            <p className="text-gray-300 text-sm">Reset your password</p>
          </div>

          <Card className="bg-black/30 backdrop-blur-[10px] border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] overflow-hidden">
            <CardHeader className="space-y-2 pb-4 pt-6">
              <CardTitle className="text-3xl text-center font-bold text-white drop-shadow-lg">
                Reset Password
              </CardTitle>
              <CardDescription className="text-center text-gray-200 text-sm">
                {done ? 'Your password has been reset.' : 'Enter your new password below.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {!done ? (
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <input type="hidden" {...form.register('token')} />

                  <FormPasswordInput
                    id="password"
                    name="password"
                    label="New Password"
                    placeholder="Enter new password"
                    value={form.watch('password')}
                    onChange={(e) => form.setValue('password', e.target.value, { shouldValidate: true })}
                    onBlur={() => form.trigger('password')}
                    error={form.formState.errors.password?.message}
                    disabled={resetMutation.isPending}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
                    autoComplete="new-password"
                    required
                  />

                  <FormPasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    value={form.watch('confirmPassword')}
                    onChange={(e) => form.setValue('confirmPassword', e.target.value, { shouldValidate: true })}
                    onBlur={() => form.trigger('confirmPassword')}
                    error={form.formState.errors.confirmPassword?.message}
                    disabled={resetMutation.isPending}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
                    autoComplete="new-password"
                    required
                  />

                  <LoadingButton
                    type="submit"
                    color="secondary"
                    className="w-full h-12 font-bold text-base rounded-lg transform hover:scale-[1.02]"
                    isLoading={resetMutation.isPending}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </LoadingButton>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-300">{doneMessage}</p>
                  <Button color="secondary" className="w-full h-12 font-bold text-base rounded-lg" asChild>
                    <Link href={ROUTES.LOGIN}>Return to Login</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link
              href={ROUTES.HOME}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
