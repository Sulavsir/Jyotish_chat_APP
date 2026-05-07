'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button, LoadingButton } from '@jyotish/ui';
import { Check, Sparkles, Zap, Clock, Infinity as InfinityIcon } from 'lucide-react';
import { ROUTES, QUERY_KEYS } from '@/constants';
import { Navbar } from '@/components/ui';
import { pricingService } from '@/services/pricing.service';
import type { PricingPlan, PricingPageTabFilter } from '@/types/pricing.types';
import { useAuthStore } from '@/store/auth-store';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

function PricingContent() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<PricingPageTabFilter>('all');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.PRICING.PLANS,
    queryFn: () => pricingService.getPlans(),
  });

  const plans = data?.plans || [];
  const loading = isLoading;

  const handleBuyClick = (plan: PricingPlan) => {
    if (!isAuthenticated) {
      router.push(ROUTES.LOGIN);
      return;
    }
    // Redirect to payment/checkout page with order details
    window.location.href = `${ROUTES.PAYMENT}?planId=${plan.id}&amount=${plan.priceInNrs}&coins=${plan.coins}`;
  };

  const filteredPlans = plans.filter((plan) => {
    if (selectedTab === 'packs') return !plan.isUnlimited;
    if (selectedTab === 'unlimited') return plan.isUnlimited;
    return true;
  });

  const calculateOriginalPrice = (price: number, discount: number | null) => {
    if (!discount) return null;
    return Math.round(price / (1 - discount / 100));
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cosmic Starfield Background */}
      <div className="absolute inset-0">
        {/* Main gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/30 to-black" />

        {/* Animated stars */}
        <div className="absolute inset-0">
          {/* Large stars */}
          {[...Array(50)].map((_, i) => (
            <div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`,
                opacity: 0.3 + Math.random() * 0.7,
              }}
            />
          ))}

          {/* Medium stars */}
          {[...Array(100)].map((_, i) => (
            <div
              key={`star-med-${i}`}
              className="absolute w-0.5 h-0.5 bg-purple-200 rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0.2 + Math.random() * 0.5,
              }}
            />
          ))}

          {/* Small stars */}
          {[...Array(200)].map((_, i) => (
            <div
              key={`star-small-${i}`}
              className="absolute w-px h-px bg-white rounded-full"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                opacity: 0.1 + Math.random() * 0.3,
              }}
            />
          ))}
        </div>

        {/* Purple nebula effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-40 -left-40 w-96 h-96 bg-purple-700/15 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Content wrapper */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-purple-500/30 mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">Explore Our Offers</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Choose Your{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h1>

              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Connect with experienced Jyotish astrologers. Balance is stored in NRs and used for
                chat sessions.
              </p>
          </div>

          {/* Tab Filter */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex rounded-lg bg-black/80 backdrop-blur-md border border-purple-500/30 p-1">
              {[
                { id: 'all', label: 'All Plans', icon: Sparkles },
                { id: 'packs', label: 'Chat Packs', icon: Zap },
                { id: 'unlimited', label: 'Unlimited', icon: InfinityIcon },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as PricingPageTabFilter)}
                    variant={selectedTab === tab.id ? 'default' : 'ghost'}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-md font-medium transition-all ${
                      selectedTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-2xl bg-black/60 border border-purple-500/20 animate-pulse backdrop-blur-md"
                />
              ))}
            </div>
          ) : (
            /* Pricing Cards */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPlans.map((plan) => {
                const originalPrice = calculateOriginalPrice(plan.priceInNrs, plan.discountPercent);

                return (
                  <div
                    key={plan.id}
                    className={`group relative rounded-2xl transition-all duration-300 hover:scale-105 backdrop-blur-md ${
                      plan.isFeatured
                        ? 'bg-gradient-to-b from-purple-900/40 via-black/80 to-black/90 border-2 border-purple-500/50 shadow-2xl shadow-purple-500/40'
                        : 'bg-gradient-to-b from-purple-900/20 via-black/70 to-black/80 border border-purple-500/30 hover:border-purple-500/50'
                    }`}
                  >
                    {/* Featured Badge */}
                    {plan.isFeatured && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold shadow-lg">
                          <Sparkles className="w-3.5 h-3.5" />
                          BEST VALUE
                        </div>
                      </div>
                    )}

                    {/* Discount Badge */}
                    {plan.discountPercent && (
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold">
                          {plan.discountPercent}% OFF
                        </div>
                      </div>
                    )}

                    <div className="p-8">
                      {/* Plan Icon */}
                      <div className="mb-6">
                        {plan.isUnlimited ? (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <InfinityIcon className="w-7 h-7 text-white" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                            <Zap className="w-7 h-7 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Plan Name */}
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>

                      {/* Description */}
                      {plan.description && (
                        <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                          {plan.description}
                        </p>
                      )}

                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-white">
                            NPR {plan.priceInNrs.toLocaleString()}
                          </span>
                          {originalPrice && (
                            <span className="text-xl text-gray-500 line-through">
                              NPR {originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-purple-400">
                          {plan.isUnlimited ? (
                            <>
                              <InfinityIcon className="w-4 h-4" />
                              <span className="text-sm">Unlimited chats</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              <span className="text-sm">Balance: {plan.coins} NRs</span>
                            </>
                          )}
                        </div>
                        {plan.validityInDays && (
                          <div className="flex items-center gap-2 mt-1 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">
                              Valid for {plan.validityInDays} day
                              {plan.validityInDays > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-8">
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-purple-300" />
                          </div>
                          <span className="text-white text-sm">
                            {plan.isUnlimited
                              ? 'Unlimited chat sessions'
                              : `Balance of ${plan.coins} NRs for chat sessions`}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-purple-300" />
                          </div>
                          <span className="text-white text-sm">One jyotish at a time</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-purple-300" />
                          </div>
                          <span className="text-white text-sm">
                            {plan.validityInDays
                              ? `${plan.validityInDays} day validity`
                              : 'Lifetime validity'}
                          </span>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-purple-300" />
                          </div>
                          <span className="text-white text-sm">24/7 support</span>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <LoadingButton
                        onClick={() => handleBuyClick(plan)}
                        className={`w-full py-3.5 rounded-xl font-semibold ${
                          plan.isFeatured
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30'
                            : 'bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30'
                        }`}
                      >
                        Buy Now
                      </LoadingButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPlans.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No Plans Available</h3>
              <p className="text-gray-300">Check back soon for exciting offers!</p>
            </div>
          )}


          {/* Info Section */}
          <div className="mt-20 text-center">
            <div className="max-w-4xl mx-auto p-8 rounded-2xl bg-black/70 border border-purple-500/30 backdrop-blur-md">
              <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <h4 className="text-white font-semibold mb-2">Choose a Plan</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Select the plan that best fits your needs
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <h4 className="text-white font-semibold mb-2">Connect with Jyotish</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Start chatting with any available astrologer
                  </p>
                </div>
                <div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-3 shadow-lg shadow-purple-500/30">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <h4 className="text-white font-semibold mb-2">Get Guidance</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    Receive personalized astrological insights
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Public view: show standalone pricing page with public navbar
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        <Navbar />
        <PricingContent />
      </div>
    );
  }

  // Authenticated clients: render pricing inside the dashboard layout (no extra navbar)
  return (
    <DashboardLayout>
      <PricingContent />
    </DashboardLayout>
  );
}
