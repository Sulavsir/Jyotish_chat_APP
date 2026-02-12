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
import { Sparkles } from 'lucide-react';

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
    onError: (error: unknown) => {
      displayError(error as ApiError, 'Login failed. Please check your credentials.');
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
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Full-page background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/astrology.jpg)' }}
        aria-hidden
      />
      <div className="fixed inset-0 z-0 bg-slate-950/75 pointer-events-none" aria-hidden />

      <Navbar />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 lg:py-16">
        <div className={`w-full ${showRegistration ? 'max-w-3xl' : 'max-w-[400px]'}`}>
            {!showRegistration ? (
              <Card className="border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden">
                <CardHeader className="space-y-1 text-center pb-2 pt-8 lg:pt-10">
                  <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-white tracking-tight">
                    Jyotish Portal
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Sign in to your astrologer account
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5 pt-2 pb-8 lg:pb-10 px-6 lg:px-8">
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4"
                  >
                    <FormInput
                      id="identifier"
                      label="Email or Phone Number"
                      placeholder="Enter email or phone"
                      {...passwordForm.register('identifier')}
                      error={passwordForm.formState.errors.identifier?.message}
                      disabled={loginMutation.isPending}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
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
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                      required
                    />

                    <LoadingButton
                      type="submit"
                      isLoading={loginMutation.isPending}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl py-2.5 transition-colors"
                    >
                      Sign In
                    </LoadingButton>
                  </form>

                  <div className="space-y-3 text-center text-sm pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRegistration(true)}
                      className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                    >
                      I want to register as an Astrologer
                    </button>
                    <Link
                      href={ROUTES.LOGIN}
                      className="block text-slate-400 hover:text-white transition-colors"
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
                <div className="border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden">
                  <AstrologerRegistrationForm
                    onSuccess={() => setShowRegistration(false)}
                    onCancel={() => setShowRegistration(false)}
                  />
                </div>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegistration(false)}
                    className="text-amber-400 hover:text-amber-300 font-medium transition-colors text-sm"
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
