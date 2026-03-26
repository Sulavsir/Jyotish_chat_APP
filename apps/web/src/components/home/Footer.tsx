import Link from 'next/link';
import { ROUTES } from '@/constants';
import { TwinklingStars } from '@/components/ui/TwinklingStars';
import { AppLogo } from '@/components/ui/AppLogo';

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-black via-blue-950/20 via-purple-950/20 to-red-950/20 text-gray-400 py-8 border-t border-gray-800 overflow-hidden">
      <TwinklingStars count={40} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-4 gap-x-8">
          {/* Row 1 on desktop: logo and section titles on one line */}
          <div className="flex items-center min-h-[2rem] order-1">
            <AppLogo href={ROUTES.HOME} height={36} blendWithDarkBackground />
          </div>
          <h4 className="text-white font-semibold text-base md:flex md:items-center md:min-h-[2.25rem] order-3 md:order-2">
            Quick Links
          </h4>
          <h4 className="text-white font-semibold text-base md:flex md:items-center md:min-h-[2.25rem] order-5 md:order-3">
            Services
          </h4>
          <h4 className="text-white font-semibold text-base md:flex md:items-center md:min-h-[2.25rem] order-7 md:order-4">
            Contact
          </h4>
          {/* Row 2: content under each */}
          <div className="order-2 md:order-5">
            <p className="text-sm leading-snug">
              Your trusted partner in navigating life&apos;s journey through ancient astrological
              wisdom.
            </p>
          </div>
          <div className="order-4 md:order-6">
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link href={ROUTES.HOME} className="hover:text-purple-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href={ROUTES.LOGIN} className="hover:text-purple-400 transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href={ROUTES.HOROSCOPE} className="hover:text-purple-400 transition-colors">
                  Horoscope
                </Link>
              </li>
            </ul>
          </div>
          <div className="order-6 md:order-7">
            <ul className="space-y-1.5 text-sm">
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Chat Consultation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Daily Horoscope
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-purple-400 transition-colors">
                  Birth Chart Analysis
                </a>
              </li>
            </ul>
          </div>
          <div className="order-8">
            <ul className="space-y-1.5 text-sm">
              <li>Email: info@jyotishapp.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Available 24/7</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 pt-4 text-center text-xs text-gray-500 space-y-2">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <Link
              href={ROUTES.PRIVACY}
              className="text-purple-400 underline underline-offset-2 decoration-purple-400/80 hover:text-purple-300 hover:decoration-purple-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600" aria-hidden>
              ·
            </span>
            <Link
              href={ROUTES.TERMS}
              className="text-purple-400 underline underline-offset-2 decoration-purple-400/80 hover:text-purple-300 hover:decoration-purple-300 transition-colors"
            >
              Terms of Service
            </Link>
          </p>
          <p>&copy; 2026 Chat Jyotishii. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
