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
import { FormPasswordInput } from '@/components/form';
import { Sparkles } from 'lucide-react';
import { authApi } from '@/lib/auth-api';
import {
  forgotPasswordSchema,
  newPasswordFormSchema,
  resetPasswordWithTokenFormSchema,
  type ForgotPasswordFormData,
  type NewPasswordFormData,
  type ResetPasswordWithTokenFormData,
} from '@/lib/validations';
import { displayError, displaySuccess, parseApiError } from '@/utils/error-handler';
import { OTP_EXPIRY_SECONDS } from '@/utils/otp.utils';
import type { ApiError } from '@/types/auth';

type Step = 'request' | 'otp' | 'reset' | 'token' | 'done';

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
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');
  const [resetToken] = useState(() => tokenFromUrl ?? '');

  const requestForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  const tokenForm = useForm<ResetPasswordWithTokenFormData>({
    resolver: zodResolver(resetPasswordWithTokenFormSchema),
    defaultValues: { token: resetToken, password: '', confirmPassword: '' },
  });

  const passwordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
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
        const cleaned = variables.identifier.includes('@')
          ? variables.identifier.trim()
          : variables.identifier.replace(/\D/g, '');
        setOtpSessionId(data.sessionId);
        setOtpPhoneNumber(cleaned);
        setOtpExpirySeconds(data.expiresIn ?? OTP_EXPIRY_SECONDS);
        setOtp(['', '', '', '', '', '']);
        setOtpError('');
        setVerifiedOtpCode('');
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

  const verifyOtpMutation = useMutation({
    mutationFn: authApi.verifyAstrologerPasswordResetOtp,
    onSuccess: () => {
      const otpCode = otp.join('');
      setVerifiedOtpCode(otpCode);
      displaySuccess('OTP verified! Set your new password.');
      setStep('reset');
    },
    onError: (error: ApiError) => {
      setOtpError(parseApiError(error).message);
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
      const message = data?.message ?? 'Password has been reset successfully.';
      if (message) displaySuccess(message);
      setDoneMessage(message);
      setStep('done');
    },
    onError: (error: ApiError) => {
      displayError(error);
    },
  });

  useEffect(() => {
    if (otpExpirySeconds > 0 && (step === 'otp' || step === 'reset')) {
      const timer = setInterval(() => {
        setOtpExpirySeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (step === 'otp') {
              setOtpError('OTP has expired. Please request a new one.');
            }
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

  const handleVerifyOtp = () => {
    const otpCode = otp.join('');
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
    verifyOtpMutation.mutate({
      phoneNumber: otpPhoneNumber,
      otp: otpCode,
      sessionId: otpSessionId,
    });
  };

  const handleResetPassword = (formData: NewPasswordFormData) => {
    if (!otpSessionId || !otpPhoneNumber || !verifiedOtpCode) {
      displayError(
        { message: 'OTP session is missing. Please start over.', statusCode: 400 } as ApiError,
        'Invalid session'
      );
      setStep('request');
      return;
    }
    resetWithOtpMutation.mutate({
      phoneNumber: otpPhoneNumber,
      otp: verifiedOtpCode,
      sessionId: otpSessionId,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
  };

  const handleOtpComplete = (_otpString: string) => {
    setOtpError('');
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
                {step === 'request' && 'Enter your email or phone to reset your password'}
                {step === 'otp' && 'Verify the OTP sent to your phone'}
                {step === 'reset' && 'Set your new password'}
                {step === 'token' && 'Set your new password'}
                {step === 'done' && 'Next steps are below.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8 pt-2 space-y-5">
              {/* Step 1: Request Reset */}
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

              {/* Step 2 (token): Reset via email link */}
              {step === 'token' && (
                <form onSubmit={tokenForm.handleSubmit(handleTokenSubmit)} className="space-y-4">
                  <input type="hidden" {...tokenForm.register('token')} />
                  <FormPasswordInput
                    id="password"
                    name="password"
                    label="New Password"
                    placeholder="Enter new password"
                    value={tokenForm.watch('password')}
                    onChange={(e) => tokenForm.setValue('password', e.target.value, { shouldValidate: true })}
                    onBlur={() => tokenForm.trigger('password')}
                    error={tokenForm.formState.errors.password?.message}
                    disabled={resetWithTokenMutation.isPending}
                    className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                    autoComplete="new-password"
                  />
                  <FormPasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm New Password"
                    placeholder="Confirm new password"
                    value={tokenForm.watch('confirmPassword')}
                    onChange={(e) => tokenForm.setValue('confirmPassword', e.target.value, { shouldValidate: true })}
                    onBlur={() => tokenForm.trigger('confirmPassword')}
                    error={tokenForm.formState.errors.confirmPassword?.message}
                    disabled={resetWithTokenMutation.isPending}
                    className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                    autoComplete="new-password"
                  />
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

              {/* Step 2 (OTP): Verify OTP */}
              {step === 'otp' && (
                <div className="space-y-5">
                  <div className="space-y-3">
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
                      disabled={verifyOtpMutation.isPending || otpExpirySeconds === 0}
                    />
                  </div>

                  <LoadingButton
                    type="button"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold h-12 rounded-xl"
                    isLoading={verifyOtpMutation.isPending}
                    loadingText="Verifying..."
                    disabled={otp.join('').length !== 6 || otpExpirySeconds === 0}
                    onClick={handleVerifyOtp}
                  >
                    Verify OTP
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
                        verifyOtpMutation.isPending ||
                        otpExpirySeconds > 240
                      }
                      className="text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 (OTP verified): Set new password */}
              {step === 'reset' && (
                <form
                  onSubmit={passwordForm.handleSubmit(handleResetPassword)}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      OTP verified
                    </div>
                  </div>

                  <div className="space-y-3">
                    <FormPasswordInput
                      id="password"
                      name="password"
                      label="New Password"
                      placeholder="Enter new password"
                      value={passwordForm.watch('password')}
                      onChange={(e) => passwordForm.setValue('password', e.target.value, { shouldValidate: true })}
                      onBlur={() => passwordForm.trigger('password')}
                      error={passwordForm.formState.errors.password?.message}
                      disabled={resetWithOtpMutation.isPending}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                      autoComplete="new-password"
                    />
                    <FormPasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      label="Confirm New Password"
                      placeholder="Confirm new password"
                      value={passwordForm.watch('confirmPassword')}
                      onChange={(e) => passwordForm.setValue('confirmPassword', e.target.value, { shouldValidate: true })}
                      onBlur={() => passwordForm.trigger('confirmPassword')}
                      error={passwordForm.formState.errors.confirmPassword?.message}
                      disabled={resetWithOtpMutation.isPending}
                      className="bg-slate-800/80 border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 rounded-lg"
                      autoComplete="new-password"
                    />
                  </div>

                  <LoadingButton
                    type="submit"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold h-12 rounded-xl"
                    isLoading={resetWithOtpMutation.isPending}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </LoadingButton>

                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => setStep('request')}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      ← Start Over
                    </button>
                  </div>
                </form>
              )}

              {/* Done */}
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
