'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES, USER_ROLES } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jyotish/ui';
import spaceImage from '@/assets/images/space.jpg';
import { LoadingButton, LoadingScreenWithBackground, Navbar } from '@/components/ui';
import { FormInput, FormPasswordInput } from '@/components/form';
import { useAuthStore } from '@/store/auth-store';
import { useRedirectIfAuthenticated } from '@/hooks';
import type { ApiError } from '@/types/auth';
import { displayError, displaySuccess } from '@/utils/error-handler';
import { passwordLoginSchema, type PasswordLoginFormData } from '@/lib/validations';
import { authApi } from '@/lib/auth-api';

export default function JyotishLoginPage() {
  const { setAuth } = useAuthStore();
  const { isCheckingAuth } = useRedirectIfAuthenticated();

  // Password login form
  const passwordForm = useForm<PasswordLoginFormData>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // Astrologer login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.loginAstrologer,
    onSuccess: async (response) => {
      const astrologer = response.astrologer;

      if (!astrologer) {
        displayError({ message: 'Failed to load astrologer profile', statusCode: 500 } as ApiError);
        return;
      }

      displaySuccess('Welcome back, Jyotish!');

      // Set auth with astrologer data mapped to user format
      setAuth({
        id: astrologer.id,
        email: astrologer.email || '',
        phone: astrologer.phone,
        name: astrologer.name,
        role: USER_ROLES.ASTROLOGER,
        profilePhoto: astrologer.profilePhoto,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      window.location.href = ROUTES.JYOTISH_DASHBOARD;
    },
    onError: (error: any) => {
      // displayError will handle parsing the axios error automatically
      displayError(error, 'Login failed. Please check your credentials.');
    },
  });

  // Password login handler
  const onPasswordSubmit = (data: PasswordLoginFormData) => {
    // Clean identifier (remove formatting if it's a phone)
    const cleanedIdentifier = data.identifier.includes('@')
      ? data.identifier.trim()
      : data.identifier.replace(/\D/g, '');

    loginMutation.mutate({
      identifier: cleanedIdentifier,
      password: data.password,
    });
  };

  // Show loading state while checking authentication (after all hooks)
  if (isCheckingAuth) {
    return <LoadingScreenWithBackground message="Loading..." />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={spaceImage}
          alt="Space background"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-orange-900/30 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4 py-20">
        <Card className="bg-black/40 backdrop-blur-lg border-orange-500/30">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-white">Jyotish Portal 🔮</CardTitle>
            <CardDescription className="text-gray-300">
              Sign in to your astrologer account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Password Login Form */}
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormInput
                id="identifier"
                label="Email or Phone Number"
                placeholder="Enter email or phone"
                {...passwordForm.register('identifier')}
                error={passwordForm.formState.errors.identifier?.message}
                disabled={loginMutation.isPending}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
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
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                required
              />

              <LoadingButton
                type="submit"
                isLoading={loginMutation.isPending}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
              >
                Sign In
              </LoadingButton>
            </form>

            {/* Links */}
            <div className="space-y-2 text-center text-sm">
              <p className="text-gray-400">Credentials provided by admin only</p>
              <Link
                href={ROUTES.LOGIN}
                className="block text-gray-300 hover:text-white transition-colors"
              >
                Are you a client?{' '}
                <span className="text-orange-400 font-semibold">Client Login</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
