'use client';
import {
  HeroSection,
  HoroscopeFeatureSection,
  HowItWorksSection,
  ServicesSection,
  WhyChooseUsSection,
  CTASection,
  Footer,
} from '@/components/home';
import { useRedirectIfAuthenticated } from '@/hooks';
import { LoadingScreenWithBackground } from '@/components/ui';

export default function Home() {
  const { isCheckingAuth } = useRedirectIfAuthenticated();

  // Show loading state briefly while checking auth
  if (isCheckingAuth) {
    return <LoadingScreenWithBackground message="Loading..." />;
  }

  return (
    <div className="min-h-screen bg-black">
      <HeroSection />
      <HoroscopeFeatureSection />
      <HowItWorksSection />
      <ServicesSection />
      <WhyChooseUsSection />
      <CTASection />
      <Footer />

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes gradient-x {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.animate-spin-slow) {
          animation: spin-slow 60s linear infinite;
        }

        :global(.animate-gradient-x) {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }

        :global(.animate-fade-in-up) {
          animation: fade-in-up 0.8s ease-out forwards;
        }

        :global(.animation-delay-200) {
          animation-delay: 0.2s;
          opacity: 0;
        }

        :global(.animation-delay-400) {
          animation-delay: 0.4s;
          opacity: 0;
        }

        :global(.animation-delay-600) {
          animation-delay: 0.6s;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
