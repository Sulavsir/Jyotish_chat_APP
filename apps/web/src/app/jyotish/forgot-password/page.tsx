'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { ROUTES } from '@/constants';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@jyotish/ui';
import { LoadingButton, Navbar, OTPInput, OtpExpiryCountdown } from '@/components/ui';
import { Sparkles } from 'lucide-react';
import { authApi } from '@/lib/auth-api';
import {
  forgotPasswordSchema,
  resetPasswordWithOtpFormSchema,
  resetPasswordWithTokenFormSchema,
  type ForgotPasswordFormData,
  type ResetPasswordWithOtpFormData,
  type ResetPasswordWithTokenFormData,
} from '@/lib/validations';
import { displayError, displaySuccess, parseApiError } from '@/utils/error-handler';
import { OTP_EXPIRY_SECONDS } from '@/utils/otp.utils';
import type { ApiError } from '@/types/auth';

type Step = 'request' | 'otp' | 'token' | 'done';

export default function JyotishForgotPasswordPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [step, setStep] = useState<Step>(tokenFromUrl ? 'token' : 'request');
  const [doneMessage, setDoneMessage] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpPhoneNumber, setOtpPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(0);
  const [resetToken] = useState(() => tokenFromUrl ?? '');

  const requestForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  const tokenForm = useForm<ResetPasswordWithTokenFormData>({
    resolver: zodResolver(resetPasswordWithTokenFormSchema),
    defaultValues: { token: resetToken, password: '', confirmPassword: '' },
  });

  const resetForm = useForm<ResetPasswordWithOtpFormData>({
    resolver: zodResolver(resetPasswordWithOtpFormSchema),
    defaultValues: { otp: '', password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (tokenFromUrl && step === 'token') {
      tokenForm.setValue('token', tokenFromUrl);
    }
  }, [tokenFromUrl, step, tokenForm]);

  const requestResetMutation = useMutation({
    mutationFn: authApi.requestAstrologerPasswordReset,
    onSuccess: (data, variables) => {
      const message = data.message ?? '';
      if (data.method === 'email') {
        if (message) displaySuccess(message);
        setDoneMessage(message);
        setStep('done');
        return;
      }
      if (data.method === 'otp' && data.sessionId) {
        const cleaned =
          variables.identifier.includes('@')
            ? variables.identifier.trim()
            : variables.identifier.replace(/\D/g, '');
        setOtpSessionId(data.sessionId);
        setOtpPhoneNumber(cleaned);
        setOtpExpirySeconds(data.expiresIn ?? OTP_EXPIRY_SECONDS);
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setStep('otp');
        if (message) displaySuccess(message);
        return;
      }
      setDoneMessage(message);
      setStep('done');
    },
    onError: (error: ApiError) => {
      displayError(error);
    },
  });

  const resetWithTokenMutation = useMutation({
    mutationFn: authApi.resetAstrologerPasswordWithToken,
    onSuccess: (data) => {
      const message = data?.message ?? '';
      if (message) displaySuccess(message);
      setDoneMessage(message);
      setStep('done');
    },
    onError: (error: ApiError) => {
      displayError(error);
    },
  });

  const resetWithOtpMutation = useMutation({
    mutationFn: authApi.resetAstrologerPasswordWithOtp,
    onSuccess: (data) => {
      const message = data?.message ?? '';
      if (message) displaySuccess(message);
      setDoneMessage(message);
      setStep('done');
    },
    onError: (error: ApiError) => {
      setOtpError(parseApiError(error).message);
      displayError(error);
    },
  });

  useEffect(() => {
    if (otpExpirySeconds > 0 && step === 'otp') {
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
  }, [otpExpirySeconds, step]);

  const handleRequestSubmit = (data: ForgotPasswordFormData) => {
    requestResetMutation.mutate({ identifier: data.identifier.trim() });
  };

  const handleTokenSubmit = (data: ResetPasswordWithTokenFormData) => {
    resetWithTokenMutation.mutate({
      token: data.token,
      password: data.password,
      confirmPassword: data.confirmPassword,
    });
  };

  const handleResetWithOtpSubmit = (formData: ResetPasswordWithOtpFormData) => {
    const otpCode = formData.otp || otp.join('');
    if (otpCode.length !== 6) {
      setOtpError('Please enter all 6 digits');
      return;
    }
    if (!otpSessionId || !otpPhoneNumber) {
      displayError(
        { message: 'OTP session is missing. Please request a new code.', statusCode: 400 } as ApiError,
        'Invalid session'
      );
      return;
    }
    resetWithOtpMutation.mutate({
      phoneNumber: otpPhoneNumber,
      otp: otpCode,
      sessionId: otpSessionId,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
  };

  const handleOtpComplete = (otpString: string) => {
    setOtpError('');
    resetForm.setValue('otp', otpString);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/astrology.jpg)' }}
        aria-hidden
      />
      <div className="fixed inset-0 z-0 bg-slate-950/75 pointer-events-none" aria-hidden />

      <Navbar />

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border border-slate-700/80 bg-slate-900 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden">
            <CardHeader className="space-y-1 text-center pb-2 pt-8">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <CardTitle className="text-xl font-semibold text-white tracking-tight">
                Jyotish – Forgot Password
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                {step === 'done'
                  ? 'Next steps are below.'
                  : step === 'token'
                    ? 'Set your new password'
                    : 'Enter your email or phone to reset your password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8 pt-2 space-y-5">
              {step === 'request' && (
                <form onSubmit={requestForm.handleSubmit(handleRequestSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="identifier" className="text-white font-semibold text-sm">
                      Email or Phone
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="you@example.com or 98XXXXXXXX"
                      {...requestForm.register('identifier')}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                      autoFocus
                    />
                    {requestForm.formState.errors.identifier && (
                      <p className="text-xs text-red-400 mt-1">
                        {requestForm.formState.errors.identifier.message}
                      </p>
                    )}
                  </div>
                  <LoadingButton
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold h-12 rounded-xl"
                    isLoading={requestResetMutation.isPending}
                    loadingText="Sending..."
                  >
                    Send Reset Instructions
                  </LoadingButton>
                  <div className="text-center text-sm">
                    <Link
                      href={ROUTES.JYOTISH_LOGIN}
                      className="text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Back to Jyotish Login
                    </Link>
                  </div>
                </form>
              )}

              {step === 'token' && (
                <form onSubmit={tokenForm.handleSubmit(handleTokenSubmit)} className="space-y-4">
                  <input type="hidden" {...tokenForm.register('token')} />
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-semibold text-sm">
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      {...tokenForm.register('password')}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                    />
                    {tokenForm.formState.errors.password && (
                      <p className="text-xs text-red-400 mt-1">
                        {tokenForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-semibold text-sm">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      {...tokenForm.register('confirmPassword')}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                    />
                    {tokenForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1">
                        {tokenForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <LoadingButton
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold h-12 rounded-xl"
                    isLoading={resetWithTokenMutation.isPending}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </LoadingButton>
                  <div className="text-center text-sm">
                    <Link
                      href={ROUTES.JYOTISH_LOGIN}
                      className="text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      Back to Jyotish Login
                    </Link>
                  </div>
                </form>
              )}

              {step === 'otp' && (
                <form
                  onSubmit={resetForm.handleSubmit(handleResetWithOtpSubmit)}
                  className="space-y-5"
                >
                  <p className="text-sm text-slate-300 text-center">
                    Enter the 6-digit code sent to{' '}
                    <span className="font-semibold text-white">{otpPhoneNumber}</span>
                  </p>
                  <OtpExpiryCountdown secondsRemaining={otpExpirySeconds} />
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleOtpComplete}
                    error={otpError}
                    disabled={resetWithOtpMutation.isPending || otpExpirySeconds === 0}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-semibold text-sm">
                      New Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter new password"
                      {...resetForm.register('password')}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                    />
                    {resetForm.formState.errors.password && (
                      <p className="text-xs text-red-400 mt-1">
                        {resetForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-semibold text-sm">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      {...resetForm.register('confirmPassword')}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                    />
                    {resetForm.formState.errors.confirmPassword && (
                      <p className="text-xs text-red-400 mt-1">
                        {resetForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                  <LoadingButton
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold h-12 rounded-xl"
                    isLoading={resetWithOtpMutation.isPending}
                    loadingText="Resetting..."
                    disabled={otp.join('').length !== 6 || otpExpirySeconds === 0}
                  >
                    Verify OTP &amp; Reset Password
                  </LoadingButton>
                  <div className="flex justify-between text-sm">
                    <button
                      type="button"
                      onClick={() => setStep('request')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestResetMutation.mutate({ identifier: otpPhoneNumber })
                      }
                      disabled={
                        requestResetMutation.isPending ||
                        resetWithOtpMutation.isPending ||
                        otpExpirySeconds > 240
                      }
                      className="text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </form>
              )}

              {step === 'done' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-300">{doneMessage || 'Done.'}</p>
                  <Button
                    className="w-full h-12 font-semibold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950"
                    asChild
                  >
                    <Link href={ROUTES.JYOTISH_LOGIN}>Return to Jyotish Login</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="text-center mt-6">
            <Link
              href={ROUTES.JYOTISH_LOGIN}
              className="text-sm text-slate-400 hover:text-slate-300 transition-colors inline-flex items-center"
            >
              ← Back to Jyotish Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
