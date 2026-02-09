'use client';

/**
 * Astrologers Listing Page
 * Browse and filter astrologers (public page, enhanced when logged in)
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Filter, Search, Users, TrendingUp, RefreshCw, Star } from 'lucide-react';
import { astrologerService } from '@/services/astrologer.service';
import { QUERY_KEYS } from '@/constants/query-keys.constants';
import { ROUTE_BUILDERS } from '@/constants/route.constants';
import {
  AstrologerCategory,
  ASTROLOGER_CATEGORY_LABELS,
  type AstrologerListParams,
} from '@/types/astrologer';
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
} from '@jyotish/ui';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { getImageUrl } from '@/utils/image.utils';
import { StarRating } from '@/components/features/ratings';
import { AstrologerGridSkeleton } from '@/components/ui/AstrologerCardSkeleton';
import { useAuthStore } from '@/store/auth-store';
import { Navbar } from '@/components/ui';

function AstrologersContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<AstrologerListParams>({
    page: 1,
    limit: 12,
    sortBy: 'rating',
    sortOrder: 'desc',
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch astrologers
  const {
    data: astrologersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: QUERY_KEYS.ASTROLOGERS.LIST(filters),
    queryFn: () => astrologerService.listAstrologers(filters),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: QUERY_KEYS.ASTROLOGERS.STATS,
    queryFn: () => astrologerService.getStats(),
  });

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof AstrologerListParams, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'rating',
      sortOrder: 'desc',
    });
    setSearchTerm('');
  };

  const handleViewProfile = (astrologerId: string) => {
    router.push(ROUTE_BUILDERS.ASTROLOGER_PROFILE(astrologerId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-white mb-2">Find Your Astrologer</h1>
        <p className="text-gray-300">Connect with experienced astrologers for guidance</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Astrologers</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <Users className="h-10 w-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-green-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Online Now</p>
                  <p className="text-3xl font-bold text-white">{stats.online}</p>
                </div>
                <div className="h-5 w-5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-yellow-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Premium</p>
                  <p className="text-3xl font-bold text-white">{stats.byCategory.PREMIUM || 0}</p>
                </div>
                <Star className="h-10 w-10 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 hover:border-blue-500/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Professional</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.byCategory.PROFESSIONAL || 0}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="bg-black/40 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, specialization, or language..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                />
                <Button onClick={handleSearch} className="bg-purple-600 hover:bg-purple-700">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={filters.category || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'category',
                    e.target.value ? (e.target.value as AstrologerCategory) : undefined
                  )
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="">All Categories</option>
                {Object.entries(ASTROLOGER_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key} className="bg-gray-900">
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Online Status Filter */}
            <div>
              <select
                value={filters.isOnline === undefined ? '' : filters.isOnline.toString()}
                onChange={(e) =>
                  handleFilterChange(
                    'isOnline',
                    e.target.value === '' ? undefined : e.target.value === 'true'
                  )
                }
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="">All Status</option>
                <option value="true" className="bg-gray-900">
                  Online Only
                </option>
                <option value="false" className="bg-gray-900">
                  Offline
                </option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={filters.sortBy || 'rating'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white"
              >
                <option value="rating" className="bg-gray-900">
                  Rating
                </option>
                <option value="experience" className="bg-gray-900">
                  Experience
                </option>
                <option value="appointmentFee" className="bg-gray-900">
                  Appointment Fee
                </option>
                <option value="totalConsultations" className="bg-gray-900">
                  Consultations
                </option>
              </select>
            </div>

            {/* Min Rating */}
            <div>
              <Input
                type="number"
                placeholder="Min Rating"
                min="0"
                max="5"
                step="0.1"
                value={filters.minRating || ''}
                onChange={(e) =>
                  handleFilterChange(
                    'minRating',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleClearFilters}
                variant="outline"
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Clear
              </Button>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Astrologers Grid */}
      {isLoading ? (
        <AstrologerGridSkeleton count={9} />
      ) : astrologersData?.astrologers?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-300 text-lg">No astrologers found matching your criteria.</p>
          <Button onClick={handleClearFilters} className="mt-4 bg-purple-600 hover:bg-purple-700">
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(astrologersData?.astrologers || []).map((astrologer) => (
              <Card
                key={astrologer.id}
                className="bg-black/40 backdrop-blur-md border-white/10 hover:border-purple-500/50 transition-all cursor-pointer"
                onClick={() => handleViewProfile(astrologer.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={getImageUrl(astrologer.profilePhoto) || undefined} />
                      <AvatarFallback className="bg-purple-600 text-white text-lg">
                        {astrologer.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{astrologer.name}</h3>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${
                              astrologer.category === AstrologerCategory.PREMIUM
                                ? 'border-yellow-500 text-yellow-500'
                                : astrologer.category === AstrologerCategory.PROFESSIONAL
                                  ? 'border-blue-500 text-blue-500'
                                  : 'border-gray-500 text-gray-500'
                            }`}
                          >
                            {ASTROLOGER_CATEGORY_LABELS[astrologer.category]}
                          </Badge>
                        </div>
                        {astrologer.isOnline && (
                          <div className="flex items-center gap-1">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs text-green-500">Online</span>
                          </div>
                        )}
                      </div>

                      {astrologer.address && (
                        <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
                          📍 {astrologer.address}
                        </p>
                      )}
                      {astrologer.bio && (
                        <p className="text-gray-400 text-sm mt-2 line-clamp-2">{astrologer.bio}</p>
                      )}

                      <div className="mt-3 space-y-2">
                        <StarRating
                          rating={astrologer.rating ?? 0}
                          totalRatings={astrologer.totalConsultations}
                          size="sm"
                          showCount={true}
                        />

                        {astrologer.experience && (
                          <p className="text-gray-400 text-sm">
                            {astrologer.experience} years experience
                          </p>
                        )}

                        {astrologer.specialization && astrologer.specialization.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {astrologer.specialization.slice(0, 3).map((spec, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="bg-purple-600/20 text-purple-300 text-xs"
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                          <div>
                            <p className="text-gray-400 text-xs">Appointment Fee</p>
                            <p className="text-white font-semibold">
                              Nrs.{astrologer.appointmentFee || 0}
                            </p>
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewProfile(astrologer.id);
                            }}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {astrologersData?.pagination && astrologersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={() => handleFilterChange('page', (filters.page || 1) - 1)}
                disabled={filters.page === 1}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Previous
              </Button>
              <span className="text-white px-4">
                Page {astrologersData.pagination.page} of {astrologersData.pagination.totalPages}
              </span>
              <Button
                onClick={() => handleFilterChange('page', (filters.page || 1) + 1)}
                disabled={!astrologersData.pagination.hasMore}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AstrologersPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Public view: standalone page with navbar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black relative">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-24">
          <AstrologersContent />
        </main>
      </div>
    );
  }

  // Authenticated clients: render inside dashboard layout
  return (
    <DashboardLayout>
      <AstrologersContent />
    </DashboardLayout>
  );
}
