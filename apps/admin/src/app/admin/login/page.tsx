'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAdminStore } from '@/store/admin-store';
import { adminApi } from '@/lib/admin-api';
import { Button, Input, Label } from '@jyotish/ui';
import { ADMIN_ROUTES } from '@/constants';
import { adminLoginSchema, type AdminLoginFormData } from '@/constants/validators.constants';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdmin } = useAdminStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const form = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await adminApi.login(data);

      if (response?.admin) {
        setAdmin(response.admin);
        router.push(ADMIN_ROUTES.DASHBOARD);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const errorMessage =
        err?.response?.data?.error?.message || 'Invalid credentials. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-space-black via-deep-purple to-space-black -z-10" />

      {/* Stars Animation */}
      <div className="absolute inset-0 stars -z-10" />
      <div className="absolute inset-0 stars2 -z-10" />
      <div className="absolute inset-0 stars3 -z-10" />

      {/* Cosmic Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-cosmic-purple/20 rounded-full blur-3xl animate-float -z-10" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-nebula-pink/20 rounded-full blur-3xl animate-float-delayed -z-10" />

      {/* Login Card */}
      <div className="cosmic-card w-full max-w-md p-8 rounded-2xl relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cosmic-purple to-nebula-pink flex items-center justify-center glow">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">
            Cosmic Control Center
          </h1>
          <p className="text-slate-400">Admin Panel - Jyotish Platform</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              disabled={isSubmitting}
              {...form.register('email')}
              className="relative z-20"
            />
            {form.formState.errors.email && (
              <p className="text-sm font-medium text-red-400">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...form.register('password')}
              className="relative z-20"
            />
            {form.formState.errors.password && (
              <p className="text-sm font-medium text-red-400">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full relative z-20" disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Jyotish Platform. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
