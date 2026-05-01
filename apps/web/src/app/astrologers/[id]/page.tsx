'use client';

/**
 * Astrologer Profile Page
 * View detailed astrologer profile
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Star, Calendar, Award, Languages, Clock, TrendingUp, ArrowLeft } from 'lucide-react';
import { astrologerService } from '@/services/astrologer.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { ROUTES } from '@/constants/route.constants';
import { ASTROLOGER_CATEGORY_LABELS } from '@/types/astrologer';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@jyotish/ui';
import { SendMessageButton } from '@/components/features/astrologer-profile/SendMessageButton';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { getImageUrl } from '@/utils/image.utils';
import { ASTROLOGER_CATEGORY } from '@/constants/appointment.constants';
import { useAuthStore } from '@/store/auth-store';
import { Navbar } from '@/components/ui';
import { BookAppointmentModal } from '@/components/features/appointment';

function AstrologerProfileContent() {
  const params = useParams();
  const router = useRouter();
  const astrologerId = params.id as string;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isBookAppointmentOpen, setIsBookAppointmentOpen] = useState(false);

  const COUNTRY_LABELS: Record<string, string> = {
    NP: 'Nepal',
    IN: 'India',
    US: 'United States',
    GB: 'United Kingdom',
  };

  const formatCountry = (value?: string | null): string => {
    if (!value) return 'Nepal';
    const trimmed = value.trim();
    if (!trimmed) return 'Nepal';
    const upper = trimmed.toUpperCase();
    if (COUNTRY_LABELS[upper]) return COUNTRY_LABELS[upper];
    return trimmed;
  };

  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: QUERY_KEYS.ASTROLOGERS.DETAIL(astrologerId),
    queryFn: () => astrologerService.getPublicProfile(astrologerId),
    enabled: !!astrologerId,
  });

  const astrologer = profileData?.astrologer;

  const handleBookAppointment = () => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }
    setIsBookAppointmentOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-gray-300 mt-4">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !astrologer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">Failed to load astrologer profile</p>
          <Button onClick={() => router.push(ROUTES.ASTROLOGERS)} className="bg-purple-600">
            Back to Astrologers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          onClick={() => router.push(ROUTES.ASTROLOGERS)}
          variant="ghost"
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Astrologers
        </Button>

        {/* Profile Header with Animations */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-32 w-32 ring-4 ring-purple-500/20 hover:ring-purple-500/40 transition-all duration-300 animate-in zoom-in-95 delay-75">
                <AvatarImage src={getImageUrl(astrologer.profilePhoto) || undefined} />
                <AvatarFallback className="bg-purple-600 text-white text-4xl">
                  {astrologer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 animate-in fade-in slide-in-from-left-4 delay-150">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent animate-gradient">
                      {astrologer.name}
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`transition-all duration-300 hover:scale-105 ${
                          astrologer.category === 'PREMIUM'
                            ? 'border-yellow-500 text-yellow-500 hover:bg-yellow-500/10'
                            : astrologer.category === 'PROFESSIONAL'
                              ? 'border-blue-500 text-blue-500 hover:bg-blue-500/10'
                              : 'border-gray-500 text-gray-500 hover:bg-gray-500/10'
                        }`}
                      >
                        {ASTROLOGER_CATEGORY_LABELS[astrologer.category]}
                      </Badge>
                      {astrologer.isOnline && (
                        <Badge className="bg-green-600 text-white animate-pulse hover:bg-green-500 transition-colors">
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2" />
                          Online
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons with Animations */}
                  <div className="flex gap-3 animate-in fade-in slide-in-from-right-4 delay-300">
                    {/* Show Send Message button for all astrologers */}
                    <SendMessageButton
                      astrologerId={astrologer.id}
                      astrologerName={astrologer.name}
                      chatMessageFee={astrologer.chatMessageFee}
                      className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    />
                    {/* Show Book Appointment only for PROFESSIONAL and PREMIUM astrologers (not ORDINARY) */}
                    {(astrologer.category === ASTROLOGER_CATEGORY.PROFESSIONAL ||
                      astrologer.category === ASTROLOGER_CATEGORY.PREMIUM) && (
                      <Button
                        onClick={handleBookAppointment}
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:border-white/40"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Appointment
                      </Button>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-4 animate-in fade-in slide-in-from-left-4 delay-300">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 transition-all duration-300 hover:scale-110 ${
                          i < Math.floor(astrologer.rating || 0)
                            ? 'text-yellow-500 fill-yellow-500 animate-pulse'
                            : 'text-gray-500'
                        }`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      />
                    ))}
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {(astrologer.rating ?? 0).toFixed(1)}
                  </span>
                </div>

                {/* Bio */}
                {astrologer.bio && (
                  <p className="text-gray-300 mt-4 leading-relaxed animate-in fade-in slide-in-from-left-4 delay-500">
                    {astrologer.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid with Animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20 animate-in fade-in slide-in-from-bottom-4 delay-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600/20 rounded-lg hover:bg-purple-600/30 transition-all duration-300 hover:scale-110">
                  <TrendingUp className="h-6 w-6 text-purple-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Consultations</p>
                  <p className="text-2xl font-bold text-white bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    {astrologer.totalConsultations}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20 animate-in fade-in slide-in-from-bottom-4 delay-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg hover:bg-blue-600/30 transition-all duration-300 hover:scale-110">
                  <Clock className="h-6 w-6 text-blue-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Experience</p>
                  <p className="text-2xl font-bold text-white bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    {astrologer.experience || 0} years
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20 animate-in fade-in slide-in-from-bottom-4 delay-400">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-600/20 rounded-lg hover:bg-yellow-600/30 transition-all duration-300 hover:scale-110">
                  <Award className="h-6 w-6 text-yellow-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <p className="text-2xl font-bold text-white bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                    {(astrologer.rating ?? 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Specializations */}
          {astrologer.specialization && astrologer.specialization.length > 0 && (
            <Card className="bg-black/40 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {astrologer.specialization.map((spec, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-purple-600/20 text-purple-300"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Languages */}
          {astrologer.languages && astrologer.languages.length > 0 && (
            <Card className="bg-black/40 backdrop-blur-md border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {astrologer.languages.map((lang, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-600/20 text-blue-300">
                      {lang}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  Nrs.{astrologer.appointmentFee || 0}
                </span>
                <span className="text-gray-400">per session</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Schedule a dedicated session at your convenience
              </p>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400">Country:</span>
                  <span className="text-white ml-2">{formatCountry(astrologer.country)}</span>
                </div>
                <p className="text-gray-500 text-sm pt-1">
                  Phone and email are not shown here; they may be shared when you book an
                  appointment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {isAuthenticated && (
        <BookAppointmentModal
          isOpen={isBookAppointmentOpen}
          onClose={() => setIsBookAppointmentOpen(false)}
          onSuccess={() => setIsBookAppointmentOpen(false)}
        />
      )}
    </>
  );
}

export default function AstrologerProfilePage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Public view: standalone page with navbar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black relative">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-24">
          <AstrologerProfileContent />
        </main>
      </div>
    );
  }

  // Authenticated clients: render inside dashboard layout
  return (
    <DashboardLayout>
      <AstrologerProfileContent />
    </DashboardLayout>
  );
}
