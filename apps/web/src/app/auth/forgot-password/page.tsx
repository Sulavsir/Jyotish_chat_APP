'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { LoadingButton, Navbar, AppLogo, OTPInput, OtpExpiryCountdown } from '@/components/ui';
import { FormPasswordInput } from '@/components/form';
import spaceImage from '@/assets/images/space.jpg';
import { authApi } from '@/lib/auth-api';
import {
  forgotPasswordSchema,
  newPasswordFormSchema,
  type ForgotPasswordFormData,
  type NewPasswordFormData,
} from '@/lib/validations';
import { displayError, displaySuccess, parseApiError } from '@/utils/error-handler';
import { OTP_EXPIRY_SECONDS } from '@/utils/otp.utils';
import type { ApiError } from '@/types/auth';

type ForgotPasswordStep = 'request' | 'otp' | 'reset' | 'done';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ForgotPasswordStep>('request');
  const [doneMessage, setDoneMessage] = useState('');
  const [otpSessionId, setOtpSessionId] = useState('');
  const [otpPhoneNumber, setOtpPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(0);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');

  const requestForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const passwordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const requestResetMutation = useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: (data, variables) => {
      const message = data.message ?? '';
      if (data.method === 'email') {
        if (message) displaySuccess(message);
        setDoneMessage(message);
        setStep('done');
        return;
      }

      if (data.method === 'otp' && data.sessionId) {
        const cleanedIdentifier = variables.identifier.includes('@')
          ? variables.identifier.trim()
          : variables.identifier.replace(/\D/g, '');

        setOtpSessionId(data.sessionId);
        setOtpPhoneNumber(cleanedIdentifier);
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
    mutationFn: authApi.verifyPasswordResetOtp,
    onSuccess: (_data) => {
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

  const resetWithOtpMutation = useMutation({
    mutationFn: authApi.resetPasswordWithOtp,
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
    requestResetMutation.mutate({
      identifier: data.identifier.trim(),
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
        { message: 'OTP session is missing. Please request a new code.', statusCode: 400 },
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
        { message: 'OTP session is missing. Please start over.', statusCode: 400 },
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

  const handleOtpComplete = (otpString: string) => {
    setOtpError('');
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      <Navbar />

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

      <div className="w-full flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <AppLogo href={ROUTES.HOME} height={56} className="inline-block mb-2" />
            <p className="text-gray-300 text-sm">Reset your password</p>
          </div>

          <Card className="bg-black/30 backdrop-blur-[10px] border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] overflow-hidden">
            <CardHeader className="space-y-2 pb-4 pt-6">
              <CardTitle className="text-3xl text-center font-bold text-white drop-shadow-lg">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-center text-gray-200 text-sm">
                {step === 'request' && 'Enter your email or phone to reset your password'}
                {step === 'otp' && 'Verify the OTP sent to your phone'}
                {step === 'reset' && 'Set your new password'}
                {step === 'done' && 'Next steps are below.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {/* Step 1: Request Reset */}
              {step === 'request' && (
                <form
                  onSubmit={requestForm.handleSubmit(handleRequestSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label
                      htmlFor="identifier"
                      className="text-white font-semibold text-sm tracking-wide"
                    >
                      Email or Phone
                    </Label>
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="you@example.com or 98XXXXXXXX"
                      {...requestForm.register('identifier')}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
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
                    color="secondary"
                    className="w-full h-12 font-bold text-base rounded-lg transform hover:scale-[1.02]"
                    isLoading={requestResetMutation.isPending}
                    loadingText="Sending..."
                  >
                    Send Reset Instructions
                  </LoadingButton>

                  <div className="text-center text-sm">
                    <Link
                      href={ROUTES.LOGIN}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </form>
              )}

              {/* Step 2: Verify OTP */}
              {step === 'otp' && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <p className="text-sm text-gray-200 text-center">
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
                    color="secondary"
                    className="w-full h-12 font-bold text-base rounded-lg transform hover:scale-[1.02]"
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
                      className="text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestResetMutation.mutate({
                          identifier: otpPhoneNumber,
                        })
                      }
                      disabled={
                        requestResetMutation.isPending ||
                        verifyOtpMutation.isPending ||
                        otpExpirySeconds > 240
                      }
                      className="text-purple-300 hover:text-purple-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Set New Password */}
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
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
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
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
                      autoComplete="new-password"
                    />
                  </div>

                  <LoadingButton
                    type="submit"
                    color="secondary"
                    className="w-full h-12 font-bold text-base rounded-lg transform hover:scale-[1.02]"
                    isLoading={resetWithOtpMutation.isPending}
                    loadingText="Resetting..."
                  >
                    Reset Password
                  </LoadingButton>

                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => setStep('request')}
                      className="text-gray-300 hover:text-gray-100 transition-colors"
                    >
                      ← Start Over
                    </button>
                  </div>
                </form>
              )}

              {/* Step 4: Done */}
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
                  <p className="text-gray-300">{doneMessage || 'Done.'}</p>
                  <Button
                    color="secondary"
                    className="w-full h-12 font-bold text-base rounded-lg"
                    asChild
                  >
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
