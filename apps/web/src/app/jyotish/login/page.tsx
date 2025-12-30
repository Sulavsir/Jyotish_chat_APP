'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES, USER_ROLES } from '@/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jyotish/ui';
import spaceImage from '@/assets/images/space.jpg';
import { LoadingButton, OTPInput, LoadingScreenWithBackground } from '@/components/ui';
import { FormInput, FormPasswordInput } from '@/components/form';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { useRedirectIfAuthenticated } from '@/hooks';
import type { ApiError } from '@/types/auth';
import { displayError, displaySuccess } from '@/utils/error-handler';
import {
  passwordLoginSchema,
  otpRequestSchema,
  type PasswordLoginFormData,
  type OTPRequestFormData,
} from '@/lib/validations';

type LoginMethod = 'password' | 'otp';
type OTPStep = 'request' | 'verify';

export default function JyotishLoginPage() {
  const { setAuth } = useAuthStore();
  const { isCheckingAuth } = useRedirectIfAuthenticated();

  // Login method tabs
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('password');

  // OTP state
  const [otpStep, setOtpStep] = useState<OTPStep>('request');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpPhoneNumber, setOtpPhoneNumber] = useState('');

  // Password login form
  const passwordForm = useForm<PasswordLoginFormData>({
    resolver: zodResolver(passwordLoginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // OTP request form
  const otpForm = useForm<OTPRequestFormData>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: {
      phoneNumber: '',
    },
  });

  // Password login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      // Fetch user details from /me endpoint
      try {
        const user = await authApi.getProfile();
        
        // Check if user is an astrologer
        if (user.role !== USER_ROLES.ASTROLOGER) {
          displayError({ message: 'This login is for Jyotish (Astrologers) only' } as ApiError);
          return;
        }

        displaySuccess('Welcome back, Jyotish!');
        setAuth(user);
        window.location.href = ROUTES.JYOTISH_DASHBOARD;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        displayError({ message: 'Failed to load user profile', statusCode: 500 } as ApiError, 'Login failed');
      }
    },
    onError: (error: ApiError) => {
      displayError(error, 'Login failed');
    },
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: (data: { phoneNumber: string }) =>
      authApi.sendOTP({ ...data, role: USER_ROLES.ASTROLOGER }),
    onSuccess: (response, variables) => {
      displaySuccess('OTP sent to your phone!');
      setOtpSessionId(response.sessionId);
      setOtpPhoneNumber(variables.phoneNumber);
      setOtpStep('verify');
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to send OTP');
    },
  });

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: (data: { phoneNumber: string; otp: string; sessionId: string }) =>
      authApi.verifyOTP({ ...data, role: USER_ROLES.ASTROLOGER }),
    onSuccess: async (data) => {
      // Fetch user details from /me endpoint
      try {
        const user = await authApi.getProfile();
        
        // Check if user is an astrologer
        if (user.role !== USER_ROLES.ASTROLOGER) {
          displayError({ message: 'This login is for Jyotish (Astrologers) only' } as ApiError);
          return;
        }

        displaySuccess(data.isNewUser ? 'Welcome to Chat Jyotish!' : 'Welcome back, Jyotish!');
        setAuth(user);
        window.location.href = ROUTES.JYOTISH_DASHBOARD;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        displayError({ message: 'Failed to load user profile', statusCode: 500 } as ApiError, 'Login failed');
      }
    },
    onError: (error: ApiError) => {
      setOtpError('Invalid OTP. Please try again.');
      displayError(error, 'Invalid OTP');
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

  // OTP request handler
  const onOTPRequest = (data: OTPRequestFormData) => {
    sendOTPMutation.mutate({ phoneNumber: data.phoneNumber });
  };

  // OTP verification handler
  const handleVerifyOTP = (otpString?: string) => {
    const otpCode = otpString || otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }

    verifyOTPMutation.mutate({
      phoneNumber: otpPhoneNumber,
      otp: otpCode,
      sessionId: otpSessionId,
    });
  };

  // Auto-submit when OTP is complete
  const handleOtpComplete = (otpString: string) => {
    setOtpError('');
    handleVerifyOTP(otpString);
  };

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.slice(0, 10);
  };

  // Show loading state while checking authentication (after all hooks)
  if (isCheckingAuth) {
    return <LoadingScreenWithBackground message="Loading..." />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="bg-black/40 backdrop-blur-lg border-orange-500/30">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-3xl font-bold text-white">Jyotish Portal 🔮</CardTitle>
            <CardDescription className="text-gray-300">
              Sign in to your astrologer account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login Method Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-black/30 rounded-lg">
              <button
                onClick={() => setLoginMethod('password')}
                className={`py-2 px-4 rounded-md transition-all ${
                  loginMethod === 'password'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => {
                  setLoginMethod('otp');
                  setOtpStep('request');
                }}
                className={`py-2 px-4 rounded-md transition-all ${
                  loginMethod === 'otp'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Phone + OTP
              </button>
            </div>

            {/* Password Login Form */}
            {loginMethod === 'password' && (
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
            )}

            {/* OTP Login Form */}
            {loginMethod === 'otp' && (
              <div className="space-y-4">
                {otpStep === 'request' ? (
                  <form onSubmit={otpForm.handleSubmit(onOTPRequest)} className="space-y-4">
                    <FormInput
                      id="phoneNumber"
                      label="Phone Number"
                      type="tel"
                      placeholder="98XXXXXXXX"
                      {...otpForm.register('phoneNumber', {
                        onChange: (e) => {
                          const formatted = formatPhoneNumber(e.target.value);
                          otpForm.setValue('phoneNumber', formatted);
                        },
                      })}
                      error={otpForm.formState.errors.phoneNumber?.message}
                      disabled={sendOTPMutation.isPending}
                      maxLength={10}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                    />

                    <LoadingButton
                      type="submit"
                      isLoading={sendOTPMutation.isPending}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                    >
                      Send OTP
                    </LoadingButton>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-300 text-center">
                        Enter the 6-digit code sent to{' '}
                        <span className="font-semibold text-white">{otpPhoneNumber}</span>
                      </p>
                      <OTPInput
                        length={6}
                        value={otp}
                        onChange={setOtp}
                        onComplete={handleOtpComplete}
                        error={otpError}
                        disabled={verifyOTPMutation.isPending}
                      />
                    </div>

                    <LoadingButton
                      onClick={() => handleVerifyOTP()}
                      isLoading={verifyOTPMutation.isPending}
                      disabled={otp.join('').length !== 6}
                      className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                    >
                      Verify OTP
                    </LoadingButton>

                    <button
                      type="button"
                      onClick={() => setOtpStep('request')}
                      className="w-full text-sm text-gray-300 hover:text-white transition-colors"
                      disabled={verifyOTPMutation.isPending}
                    >
                      ← Back to phone number
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Links */}
            <div className="space-y-2 text-center text-sm">
              {loginMethod === 'password' && (
                <p className="text-gray-400">
                  Are you new?{' '}
                  <span
                    onClick={() => {
                      setLoginMethod('otp');
                      setOtpStep('request');
                    }}
                    className="text-blue-200 font-semibold cursor-pointer hover:text-blue-100 transition-colors"
                  >
                    Click here
                  </span>
                </p>
              )}
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
