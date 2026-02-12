'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES, USER_ROLES } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jyotish/ui';
import { LoadingButton, LoadingScreenWithBackground, Navbar } from '@/components/ui';
import { FormInput, FormPasswordInput } from '@/components/form';
import { useAuthStore } from '@/store/auth-store';
import { useRedirectIfAuthenticated } from '@/hooks';
import type { ApiError } from '@/types/auth';
import { displayError, displaySuccess } from '@/utils/error-handler';
import { passwordLoginSchema, type PasswordLoginFormData } from '@/lib/validations';
import { authApi } from '@/lib/auth-api';
import { AstrologerRegistrationForm } from '@/components/features/astrologer/AstrologerRegistrationForm';

export default function JyotishLoginPage() {
  const { setAuth } = useAuthStore();
  const { isCheckingAuth } = useRedirectIfAuthenticated();
  const [showRegistration, setShowRegistration] = useState(false);

  const passwordForm = useForm<PasswordLoginFormData>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.loginAstrologer,
    onSuccess: async (response) => {
      const astrologer = response.astrologer;

      if (!astrologer) {
        displayError({ message: 'Failed to load astrologer profile', statusCode: 500 } as ApiError);
        return;
      }

      displaySuccess('Welcome back, Jyotish!');

      try {
        const fullAstrologer = await authApi.getAstrologerProfile();
        setAuth(fullAstrologer);
      } catch (error) {
        console.error('Failed to fetch full astrologer profile after login, using basic data:', error);
        setAuth({
          ...astrologer,
          role: USER_ROLES.ASTROLOGER,
        });
      }

      window.location.href = ROUTES.JYOTISH_DASHBOARD;
    },
    onError: (error: any) => {
      displayError(error, 'Login failed. Please check your credentials.');
    },
  });

  const onPasswordSubmit = (data: PasswordLoginFormData) => {
    const cleanedIdentifier = data.identifier.includes('@')
      ? data.identifier.trim()
      : data.identifier.replace(/\D/g, '');

    loginMutation.mutate({
      identifier: cleanedIdentifier,
      password: data.password,
    });
  };

  if (isCheckingAuth) {
    return <LoadingScreenWithBackground message="Loading..." />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f0e14]">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/astrology.jpg)' }}
        aria-hidden
      />
      <div className="fixed inset-0 z-0 bg-black/55 pointer-events-none" aria-hidden />

      <Navbar />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
        <div className={`w-full ${showRegistration ? 'max-w-3xl' : 'max-w-sm'}`}>
          {!showRegistration ? (
            <Card className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
              <CardHeader className="space-y-1 text-center pb-2">
                <CardTitle className="text-xl font-semibold text-[#fafaf9] tracking-tight">
                  Jyotish Portal
                </CardTitle>
                <CardDescription className="text-[#78716c] text-sm">
                  Sign in to your astrologer account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 pt-2">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormInput
                    id="identifier"
                    label="Email or Phone Number"
                    placeholder="Enter email or phone"
                    {...passwordForm.register('identifier')}
                    error={passwordForm.formState.errors.identifier?.message}
                    disabled={loginMutation.isPending}
                    className="bg-white/[0.04] border-white/[0.08] text-[#fafaf9] placeholder:text-[#78716c] focus:border-amber-500/40"
                    required
                  />

                  <FormPasswordInput
                    id="password"
                    name="password"
                    label="Password"
                    placeholder="Enter your password"
                    value={passwordForm.watch('password')}
                    onChange={(e) => passwordForm.setValue('password', e.target.value)}
                    onBlur={() => passwordForm.trigger('password')}
                    error={passwordForm.formState.errors.password?.message}
                    disabled={loginMutation.isPending}
                    className="bg-white/[0.04] border-white/[0.08] text-[#fafaf9] placeholder:text-[#78716c] focus:border-amber-500/40"
                    required
                  />

                  <LoadingButton
                    type="submit"
                    isLoading={loginMutation.isPending}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-[#0f0e14] font-medium rounded-lg"
                  >
                    Sign In
                  </LoadingButton>
                </form>

                <div className="space-y-2 text-center text-sm">
                  <button
                    type="button"
                    onClick={() => setShowRegistration(true)}
                    className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                  >
                    I want to register as an Astrologer
                  </button>
                  <Link
                    href={ROUTES.LOGIN}
                    className="block text-[#a8a29e] hover:text-[#fafaf9] transition-colors"
                  >
                    Are you a client?{' '}
                    <span className="text-amber-400 font-medium hover:text-amber-300">
                      Client Login
                    </span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <AstrologerRegistrationForm
                onSuccess={() => setShowRegistration(false)}
                onCancel={() => setShowRegistration(false)}
              />
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setShowRegistration(false)}
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
