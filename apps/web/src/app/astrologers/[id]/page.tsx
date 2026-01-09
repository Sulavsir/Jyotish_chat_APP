'use client';

/**
 * Astrologer Profile Page
 * View detailed astrologer profile
 */

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
import { RequestInstantChatButton } from '@/components/features/instant-chat/RequestInstantChatButton';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { getImageUrl } from '@/utils/image.utils';

export default function AstrologerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const astrologerId = params.id as string;

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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-300 mt-4">Loading profile...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !astrologer) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 text-lg mb-4">Failed to load astrologer profile</p>
            <Button onClick={() => router.push(ROUTES.ASTROLOGERS)} className="bg-purple-600">
              Back to Astrologers
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
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

        {/* Profile Header */}
        <Card className="bg-black/40 backdrop-blur-md border-white/10">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="h-32 w-32">
                <AvatarImage src={getImageUrl(astrologer.profilePhoto) || undefined} />
                <AvatarFallback className="bg-purple-600 text-white text-4xl">
                  {astrologer.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{astrologer.name}</h1>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`${
                          astrologer.category === 'PREMIUM'
                            ? 'border-yellow-500 text-yellow-500'
                            : astrologer.category === 'PROFESSIONAL'
                              ? 'border-blue-500 text-blue-500'
                              : 'border-gray-500 text-gray-500'
                        }`}
                      >
                        {ASTROLOGER_CATEGORY_LABELS[astrologer.category]}
                      </Badge>
                      {astrologer.isOnline && (
                        <Badge className="bg-green-600 text-white">
                          <div className="h-2 w-2 rounded-full bg-white animate-pulse mr-2" />
                          Online
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <RequestInstantChatButton />
                    <Button
                      onClick={() => router.push(ROUTES.PRICING)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < Math.floor(astrologer.rating || 0)
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-500'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-white font-semibold text-lg">
                    {(astrologer.rating ?? 0).toFixed(1)}
                  </span>
                </div>

                {/* Bio */}
                {astrologer.bio && (
                  <p className="text-gray-300 mt-4 leading-relaxed">{astrologer.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Consultations</p>
                  <p className="text-2xl font-bold text-white">{astrologer.totalConsultations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Experience</p>
                  <p className="text-2xl font-bold text-white">
                    {astrologer.experience || 0} years
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-yellow-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-600/20 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Rating</p>
                  <p className="text-2xl font-bold text-white">
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
                  ₹{astrologer.appointmentFee || 0}
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
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white ml-2">{astrologer.phone}</span>
                </div>
                {astrologer.email && (
                  <div>
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2">{astrologer.email}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
