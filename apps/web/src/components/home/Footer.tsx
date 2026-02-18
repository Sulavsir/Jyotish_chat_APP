import Link from 'next/link';
import { ROUTES } from '@/constants';
import { TwinklingStars } from '@/components/ui/TwinklingStars';

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-black via-blue-950/20 via-purple-950/20 to-red-950/20 text-gray-400 py-16 border-t border-gray-800 overflow-hidden">
      <TwinklingStars count={40} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <h3 className="text-white font-bold text-2xl mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Chat Jyotishi
            </h3>
            <p className="text-sm leading-relaxed">
              Your trusted partner in navigating life&apos;s journey through ancient astrological
              wisdom.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3 text-sm">
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
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">Services</h4>
            <ul className="space-y-3 text-sm">
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
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li>Email: info@jyotishapp.com</li>
              <li>Phone: +1 (555) 123-4567</li>
              <li>Available 24/7</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-sm">
          <p>&copy; 2026 Chat Jyotishii. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
