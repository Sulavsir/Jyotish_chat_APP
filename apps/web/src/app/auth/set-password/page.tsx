'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { ROUTES, TOAST_MESSAGES } from '@/constants';
import { Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jyotish/ui';
import { toast } from 'sonner';
import spaceImage from '@/assets/images/space.jpg';
import { PasswordInput, LoadingButton, FormError } from '@/components/ui';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import type { ApiError } from '@/types/auth';
import { parseApiError, displayError, displaySuccess } from '@/utils/error-handler';

export default function SetPasswordPage() {
  const router = useRouter();
  const { tempToken, setAuth, clearOtpSession } = useAuthStore();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({ password: '', confirmPassword: '' });
  const [isHydrated, setIsHydrated] = useState(false);

  const setPasswordMutation = useMutation({
    mutationFn: authApi.setPassword,
    onSuccess: async (data) => {
      displaySuccess(TOAST_MESSAGES.SUCCESS.PASSWORD_SET);

      // Fetch user details from /me endpoint
      try {
        const user = await authApi.getProfile();
        setAuth(user);

        // Clear OTP session data
        clearOtpSession();

        // Navigate to dashboard (profile can be completed from profile page)
        router.push(ROUTES.DASHBOARD);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        displayError({ message: 'Failed to load user profile', statusCode: 500 } as ApiError, TOAST_MESSAGES.ERROR.GENERIC);
      }
    },
    onError: (error: ApiError) => {
      const { message, fieldErrors } = parseApiError(error);
      displayError(error, TOAST_MESSAGES.ERROR.GENERIC);

      // Set field-specific errors if available
      if (Object.keys(fieldErrors).length > 0) {
        setErrors({
          password: fieldErrors.password || '',
          confirmPassword: fieldErrors.confirmPassword || '',
        });
      } else {
        // Generic error - show on password field
        setErrors({
          password: message,
          confirmPassword: '',
        });
      }
    },
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only redirect after hydration is complete

    if (isHydrated && !tempToken) {
      console.warn('No tempToken found, redirecting to login');
      router.push(ROUTES.LOGIN);
    }
  }, [router, tempToken, isHydrated]);

  // Show loading while hydrating (after all hooks)
  if (!isHydrated) {
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors = { password: '', confirmPassword: '' };
    let isValid = true;

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
      isValid = false;
    } else if (!/(?=.*[A-Z])/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
      isValid = false;
    } else if (!/(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = TOAST_MESSAGES.ERROR.PASSWORD_MISMATCH;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!tempToken) {
      router.push(ROUTES.LOGIN);
      return;
    }

    setPasswordMutation.mutate({
      tempToken,
      password,
      confirmPassword,
    });
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <Image
          src={spaceImage}
          alt="Cosmic Space"
          fill
          className="object-cover"
          quality={90}
          priority
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Center Form */}
      <div className="w-full flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_30px_rgba(220,20,60,0.6)] mb-2">
              Chat Jyotish
            </h1>
            <p className="text-gray-300 text-sm">Secure your account</p>
          </div>

          {/* Set Password Card */}
          <Card className="bg-black/30 backdrop-blur-[10px] border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] overflow-hidden">
            <CardHeader className="space-y-2 pb-4 pt-6">
              <CardTitle className="text-3xl text-center font-bold text-white drop-shadow-lg">
                Create Password
              </CardTitle>
              <CardDescription className="text-center text-gray-200 text-sm">
                Create a strong password for your account
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-white font-semibold text-sm tracking-wide"
                  >
                    Password
                  </Label>
                  <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={setPasswordMutation.isPending}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
                    error={errors.password}
                    // autoFocus
                  />
                  {!errors.password && (
                    <p className="text-xs text-gray-400 mt-1">
                      Must be 8+ characters with uppercase, lowercase & number
                    </p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-white font-semibold text-sm tracking-wide"
                  >
                    Confirm Password
                  </Label>
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={setPasswordMutation.isPending}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
                    error={errors.confirmPassword}
                  />
                </div>

                {/* Submit Button */}
                <LoadingButton
                  type="submit"
                  color="secondary"
                  className="w-full h-12 mt-2 font-bold text-base rounded-lg transform hover:scale-[1.02]"
                  isLoading={setPasswordMutation.isPending}
                  loadingText="Creating Account..."
                >
                  Continue
                </LoadingButton>
              </form>
            </CardContent>
          </Card>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link
              href={ROUTES.HOME}
              className="text-sm text-gray-400 hover:text-gray-300 transition-colors inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
