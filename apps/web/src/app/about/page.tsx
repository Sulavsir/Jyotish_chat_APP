'use client';

import { Navbar } from '@/components/ui';
import { Sparkles, Users, MessageCircle, Zap, Shield, Clock, Star, Heart } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/constants';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cosmic Background */}
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
          <div className="absolute bottom-40 -left-40 w-96 h-96 bg-purple-700/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Content */}
      <div className="relative pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 border border-purple-500/30 mb-6 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm font-medium">About Jyotish</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Your Gateway to{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Cosmic Wisdom
              </span>
            </h1>

            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Jyotish connects you with verified expert astrologers for personalized guidance,
              real-time consultations, and insights drawn from ancient Vedic wisdom.
            </p>
          </div>

          {/* What is Jyotish */}
          <div className="mb-20">
            <div className="bg-gradient-to-b from-purple-900/20 via-black/70 to-black/80 border border-purple-500/30 rounded-2xl p-8 md:p-12 backdrop-blur-md">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                <Star className="w-8 h-8 text-purple-400" />
                What is Jyotish?
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                Jyotish, also known as Vedic Astrology, is an ancient Indian system of astrology
                that has been practiced for over 5,000 years. It&apos;s based on the belief that the
                positions of celestial bodies at the time of your birth influence your personality,
                life path, and destiny.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                Our platform brings this timeless wisdom into the modern age, making it accessible
                to anyone seeking guidance, clarity, or a deeper understanding of their life&apos;s journey.
              </p>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              How Does Jyotish Work?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Users,
                  title: '1. Create Account',
                  description: 'Sign up in seconds with your phone number and basic details.',
                },
                {
                  icon: Zap,
                  title: '2. Choose a Plan',
                  description: 'Select from our flexible pricing plans - pay per chat or go unlimited.',
                },
                {
                  icon: MessageCircle,
                  title: '3. Connect Instantly',
                  description: 'Browse available astrologers and start chatting immediately.',
                },
                {
                  icon: Sparkles,
                  title: '4. Get Guidance',
                  description: 'Receive personalized insights and answers to your questions.',
                },
              ].map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={index}
                    className="bg-black/70 border border-purple-500/30 rounded-xl p-6 backdrop-blur-md hover:border-purple-500/50 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/30">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-white text-center mb-12">
              Why Choose Jyotish?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: 'Verified Astrologers',
                  description: 'All our astrologers are carefully vetted and verified for authenticity and expertise.',
                },
                {
                  icon: Clock,
                  title: '24/7 Availability',
                  description: 'Access guidance whenever you need it. Our astrologers are available around the clock.',
                },
                {
                  icon: MessageCircle,
                  title: 'Real-time Chat',
                  description: 'Instant messaging with astrologers. No waiting, no scheduling - just connect and chat.',
                },
                {
                  icon: Zap,
                  title: 'Flexible Pricing',
                  description: 'Choose from pay-per-chat options or unlimited plans. No hidden fees.',
                },
                {
                  icon: Heart,
                  title: 'Personalized Guidance',
                  description: 'Every consultation is tailored to your unique birth chart and life circumstances.',
                },
                {
                  icon: Star,
                  title: 'Ancient Wisdom',
                  description: 'Based on 5,000+ years of Vedic astrological knowledge and tradition.',
                },
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="bg-gradient-to-b from-purple-900/20 via-black/70 to-black/80 border border-purple-500/30 rounded-xl p-6 backdrop-blur-md hover:scale-105 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How to Use */}
          <div className="mb-20">
            <div className="bg-black/70 border border-purple-500/30 rounded-2xl p-8 md:p-12 backdrop-blur-md">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">
                Getting Started is Easy
              </h2>

              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Sign Up</h3>
                    <p className="text-gray-300">
                      Create your account using your phone number. We&apos;ll send you an OTP to verify.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Complete Your Profile</h3>
                    <p className="text-gray-300">
                      Add your birth details (date, time, place) for accurate astrological readings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Purchase Coins or Plan</h3>
                    <p className="text-gray-300">
                      Buy chat coins (1 coin = 1 chat) or subscribe to an unlimited plan. NPR 100 = 1 coin.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Browse Astrologers</h3>
                    <p className="text-gray-300">
                      Check the list of online astrologers. View their profiles, specializations, and ratings.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    5
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Start Chatting</h3>
                    <p className="text-gray-300">
                      Click &quot;Start Chat&quot; and begin your conversation. You can either send an instant request
                      or broadcast to all available astrologers.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    6
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-2">Get Your Answers</h3>
                    <p className="text-gray-300">
                      Chat in real-time, ask questions, and receive personalized astrological guidance.
                      Your chat history is saved for future reference.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-900/40 via-black/60 to-purple-900/40 border border-purple-500/40 rounded-2xl p-12 backdrop-blur-md">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to Discover Your Cosmic Path?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of users who have found clarity and guidance through Jyotish.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={ROUTES.LOGIN}
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                >
                  Get Started Now
                </Link>
                <Link
                  href={ROUTES.PRICING}
                  className="px-8 py-4 rounded-xl bg-black/60 border border-purple-500/40 text-white font-semibold hover:bg-purple-500/10 transition-all backdrop-blur-md"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

