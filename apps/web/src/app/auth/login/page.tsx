'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ROUTES } from '@/constants';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jyotish/ui';
import spaceImage from '@/assets/images/space.jpg';
import { LoadingButton, OTPInput, LoadingScreenWithBackground, Navbar } from '@/components/ui';
import { FormInput, FormPasswordInput } from '@/components/form';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { useRedirectIfAuthenticated } from '@/hooks';
import type { ApiError } from '@/types/auth';
import { displayError, displaySuccess } from '@/utils/error-handler';
import { UserRole } from '@/types';
import {
  passwordLoginSchema,
  otpRequestSchema,
  type PasswordLoginFormData,
  type OTPRequestFormData,
} from '@/lib/validations';
import { Clock, Sparkles } from 'lucide-react';

type LoginMethod = 'password' | 'otp';
type OTPStep = 'request' | 'verify';

export default function LoginPage() {
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
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(0);

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
      displaySuccess('Welcome back!');

      // Fetch user details from /me endpoint
      try {
        const user = await authApi.getProfile();
        setAuth(user);

        const dashboardRoute =
          user.role === UserRole.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;
        window.location.href = dashboardRoute;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        displayError({ message: 'Failed to load user profile', statusCode: 500 }, 'Login failed');
      }
    },
    onError: (error: ApiError) => {
      displayError(error, 'Login failed');
    },
  });

  // Send OTP mutation
  const sendOTPMutation = useMutation({
    mutationFn: authApi.sendOTP,
    onSuccess: (response, variables) => {
      displaySuccess('OTP sent to your phone!');
      setOtpSessionId(response.sessionId);
      setOtpPhoneNumber(variables.phoneNumber);
      setOtpExpirySeconds(response.expiresIn); // Start countdown from expiresIn (300 seconds = 5 mins)
      setOtpStep('verify');
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
    },
    onError: (error: ApiError) => {
      displayError(error, 'Failed to send OTP');
    },
  });

  // OTP countdown timer
  useEffect(() => {
    if (otpExpirySeconds > 0 && otpStep === 'verify' && loginMethod === 'otp') {
      const timer = setInterval(() => {
        setOtpExpirySeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setOtpError('OTP has expired. Please request a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [otpExpirySeconds, otpStep, loginMethod]);

  // Verify OTP mutation
  const verifyOTPMutation = useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: async (data) => {
      displaySuccess(data.isNewUser ? 'Welcome to Chat Jyotish!' : 'Welcome back!');

      // Fetch user details from /me endpoint
      try {
        const user = await authApi.getProfile();
        setAuth(user);

        const dashboardRoute =
          user.role === UserRole.ASTROLOGER ? ROUTES.JYOTISH_DASHBOARD : ROUTES.DASHBOARD;
        window.location.href = dashboardRoute;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        displayError({ message: 'Failed to load user profile', statusCode: 500 }, 'Login failed');
      }
    },
    onError: (error: ApiError) => {
      setOtpError('Invalid OTP. Please try again.');
      displayError(error, 'Invalid OTP');
    },
  });

  // Password login handler
  const onPasswordSubmit = (data: PasswordLoginFormData) => {
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

  // Format countdown timer (MM:SS)
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-purple-900/30 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full min-w-0 max-w-md px-4">
        <Card className="border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden w-full">
          <CardHeader className="space-y-1 text-center pb-2 pt-6 sm:pt-8 px-5 sm:px-8">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400" />
              </div>
            </div>
            <CardTitle className="text-xl font-semibold text-white tracking-tight">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-2 pb-6 sm:pb-8 px-5 sm:px-6">
            {/* Login Method Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800/80 rounded-lg border border-slate-600/50">
              <button
                onClick={() => setLoginMethod('password')}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'password'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                Password
              </button>
              <button
                onClick={() => {
                  setLoginMethod('otp');
                  setOtpStep('request');
                }}
                className={`py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'otp'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                Phone + OTP
              </button>
            </div>

            {/* Password Login Form */}
            {loginMethod === 'password' && (
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-3">
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
            )}

            {/* OTP Login Form */}
            {loginMethod === 'otp' && (
              <div className="space-y-5">
                {otpStep === 'request' ? (
                  <form onSubmit={otpForm.handleSubmit(onOTPRequest)} className="space-y-5">
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
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20"
                      required
                    />

                    <LoadingButton
                      type="submit"
                      isLoading={sendOTPMutation.isPending}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl py-2.5 transition-colors"
                    >
                      Send OTP
                    </LoadingButton>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="space-y-3">
                      <p className="text-sm text-slate-400 text-center">
                        Enter the 6-digit code sent to{' '}
                        <span className="font-semibold text-white">{otpPhoneNumber}</span>
                      </p>

                      {/* OTP Countdown Timer */}
                      {otpExpirySeconds > 0 && (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-amber-400/90">
                            Your OTP will expire in
                            <Clock className="w-4 h-4" />
                            <span
                              className={`text-sm font-mono font-semibold ${
                                otpExpirySeconds < 60 ? 'text-red-300' : 'text-amber-300'
                              }`}
                            >
                              {formatCountdown(otpExpirySeconds)}
                            </span>
                          </div>
                        </div>
                      )}

                      <OTPInput
                        length={6}
                        value={otp}
                        onChange={setOtp}
                        onComplete={handleOtpComplete}
                        error={otpError}
                        disabled={verifyOTPMutation.isPending || otpExpirySeconds === 0}
                      />
                    </div>

                    <LoadingButton
                      onClick={() => handleVerifyOTP()}
                      isLoading={verifyOTPMutation.isPending}
                      disabled={otp.join('').length !== 6 || otpExpirySeconds === 0}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl py-2.5 transition-colors"
                    >
                      Verify OTP
                    </LoadingButton>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpStep('request')}
                        disabled={verifyOTPMutation.isPending || sendOTPMutation.isPending}
                        className="flex-1 text-sm text-slate-400 hover:text-white transition-colors"
                      >
                        ← Back
                      </button>

                      <LoadingButton
                        type="button"
                        onClick={() => sendOTPMutation.mutate({ phoneNumber: otpPhoneNumber })}
                        disabled={
                          sendOTPMutation.isPending ||
                          verifyOTPMutation.isPending ||
                          otpExpirySeconds > 240
                        }
                        isLoading={sendOTPMutation.isPending}
                        loadingText="Sending..."
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-sm text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Resend OTP
                      </LoadingButton>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Links */}
            <div className="space-y-3 text-center text-sm pt-2">
              {loginMethod === 'password' && (
                <p className="text-slate-400">
                  Are you new?{' '}
                  <span
                    onClick={() => {
                      setLoginMethod('otp');
                      setOtpStep('request');
                    }}
                    className="text-amber-400 font-medium cursor-pointer hover:text-amber-300 transition-colors"
                  >
                    Sign in with OTP
                  </span>
                </p>
              )}
              <Link
                href={ROUTES.JYOTISH_LOGIN}
                className="block text-slate-400 hover:text-white transition-colors"
              >
                Are you a Jyotish (Astrologer)?{' '}
                <span className="text-amber-400 font-medium hover:text-amber-300">Login Here</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
