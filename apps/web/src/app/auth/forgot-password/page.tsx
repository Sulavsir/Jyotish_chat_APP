'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import { toast } from 'sonner';
import spaceImage from '@/assets/images/space.jpg';
import { Navbar, AppLogo } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // Validate 10-digit Nepali phone number
    if (cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    if (!cleanPhone.match(/^(98|97)\d{8}$/)) {
      toast.error('Please enter a valid Nepali number starting with 98 or 97');
      return;
    }

    // TODO: Implement forgot password API
    toast.info('Password reset feature coming soon!');
    setIsSubmitted(true);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    // Limit to 10 digits
    return cleaned.slice(0, 10);
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Navbar */}
      <Navbar />

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
            <AppLogo href={ROUTES.HOME} height={56} className="inline-block mb-2" />
            <p className="text-gray-300 text-sm">Reset your password</p>
          </div>

          {/* Forgot Password Card */}
          <Card className="bg-black/30 backdrop-blur-[10px] border border-white/10 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.8)] overflow-hidden">
            <CardHeader className="space-y-2 pb-4 pt-6">
              <CardTitle className="text-3xl text-center font-bold text-white drop-shadow-lg">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-center text-gray-200 text-sm">
                {isSubmitted
                  ? 'Check your phone for reset instructions'
                  : 'Enter your phone number to reset your password'}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="phone"
                      className="text-white font-semibold text-sm tracking-wide"
                    >
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="98XXXXXXXX (10 digits)"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      maxLength={10}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-500/50 focus:ring-purple-500/20 h-12 rounded-lg"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    color="secondary"
                    className="w-full h-12 font-bold text-base rounded-lg transform hover:scale-[1.02]"
                  >
                    Send Reset Link
                  </Button>

                  <div className="text-center text-sm">
                    <Link
                      href={ROUTES.LOGIN}
                      className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </form>
              ) : (
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
                  <p className="text-gray-300">
                    If an account exists with this phone number, you&apos;ll receive password reset
                    instructions shortly.
                  </p>
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
