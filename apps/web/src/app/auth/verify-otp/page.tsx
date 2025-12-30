'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import { ROUTES, TOAST_MESSAGES } from '@/constants';
import {
  Button,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@jyotish/ui';
import { toast } from 'sonner';
import spaceImage from '@/assets/images/space.jpg';
import { authApi } from '@/lib/auth-api';
import { useAuthStore } from '@/store/auth-store';
import type { ApiError } from '@/types/auth';
import { OTPInput } from '@/components/ui/OTPInput';

export default function VerifyOTPPage() {
  const router = useRouter();
  const { otpSessionId, phoneNumber, setTempToken } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    // Check if user came from login page (after phone check)
    if (!otpSessionId || !phoneNumber) {
      router.push(ROUTES.LOGIN);
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router, otpSessionId, phoneNumber]);

  const verifyOTPMutation = useMutation({
    mutationFn: authApi.verifyOTP,
    onSuccess: (data) => {
      toast.success(TOAST_MESSAGES.SUCCESS.OTP_VERIFIED);
      // Store temp token in Zustand
      setTempToken(data.tempToken);

      if (data.isNewUser) {
        // New user - go to set password
        router.push(ROUTES.SET_PASSWORD);
      } else {
        // Existing user without password? Shouldn't happen, but redirect to login
        toast.error('Account already exists. Please use login.');
        router.push(ROUTES.LOGIN);
      }
    },
    onError: (error: ApiError) => {
      const message = error.message || TOAST_MESSAGES.ERROR.OTP_INVALID;
      setError(message);
      toast.error(message);
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
    },
  });

  const sendOTPMutation = useMutation({
    mutationFn: authApi.sendOTP,
    onSuccess: (data) => {
      toast.success('OTP resent successfully!');
      useAuthStore.getState().setOtpSession(data.sessionId, phoneNumber!);
      setResendTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || 'Failed to resend OTP');
    },
  });

  const handleOtpChange = (newOtp: string[]) => {
    setOtp(newOtp);
    setError('');
  };

  const handleOtpComplete = (otpCode: string) => {
    handleSubmit(otpCode);
  };

  const handleSubmit = (otpValue?: string) => {
    const otpCode = otpValue || otp.join('');

    if (otpCode.length !== 6) {
      const errorMsg = 'Please enter complete OTP';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!otpSessionId || !phoneNumber) {
      router.push(ROUTES.LOGIN);
      return;
    }

    verifyOTPMutation.mutate({
      phoneNumber,
      otp: otpCode,
      sessionId: otpSessionId,
    });
  };

  const handleResend = () => {
    if (!phoneNumber) {
      router.push(ROUTES.LOGIN);
      return;
    }

    sendOTPMutation.mutate({ phoneNumber });
  };

  const maskedPhone = phoneNumber ? `${phoneNumber.slice(0, 3)}-***-${phoneNumber.slice(-4)}` : '';

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
            <p className="text-gray-300 text-sm">Verify your phone number</p>
          </div>

          {/* OTP Card */}
          <Card className="bg-black/30 backdrop-blur-[10px] border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] overflow-hidden">
            <CardHeader className="space-y-2 pb-4 pt-6">
              <CardTitle className="text-3xl text-center font-bold text-white drop-shadow-lg">
                Enter OTP
              </CardTitle>
              <CardDescription className="text-center text-gray-200 text-sm">
                We&apos;ve sent a 6-digit code to
                <br />
                <span className="font-semibold text-purple-300">{maskedPhone}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                {/* OTP Input Component */}
                <OTPInput
                  value={otp}
                  onChange={handleOtpChange}
                  onComplete={handleOtpComplete}
                  disabled={verifyOTPMutation.isPending}
                  error={error}
                />

                {/* Verify Button */}
                <Button
                  type="button"
                  color="secondary"
                  onClick={() => handleSubmit()}
                  className="w-full h-12 mt-2 font-bold text-base rounded-lg transform hover:scale-[1.02]"
                  disabled={verifyOTPMutation.isPending || otp.some((d) => !d)}
                >
                  {verifyOTPMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Verifying...
                    </span>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                {/* Resend OTP */}
                <div className="text-center text-sm mt-4">
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      disabled={sendOTPMutation.isPending}
                      className="text-purple-400 hover:text-purple-300 font-semibold transition-colors disabled:opacity-50"
                    >
                      {sendOTPMutation.isPending ? 'Resending...' : 'Resend OTP'}
                    </button>
                  ) : (
                    <span className="text-gray-400">
                      Resend OTP in <span className="font-semibold text-white">{resendTimer}s</span>
                    </span>
                  )}
                </div>

                {/* Change Number */}
                <div className="text-center text-sm">
                  <Link
                    href={ROUTES.LOGIN}
                    className="text-gray-300 hover:text-gray-200 transition-colors"
                  >
                    Change phone number
                  </Link>
                </div>
              </div>
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
