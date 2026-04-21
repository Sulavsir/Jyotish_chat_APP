import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { NepaliDateProvider } from '@/providers/nepali-date-provider';
import { PaymentRedirectHandler } from '@/components/payment/PaymentRedirectHandler';
import { JsonLd } from '@/components/seo/JsonLd';
import { MaintenanceGate } from '@/components/maintenance/MaintenanceGate';

// Lazy-load AdminChatWidget - reduces initial bundle, loads after hydration
const AdminChatWidget = dynamic(
  () => import('@/components/widgets/AdminChatWidget').then((m) => ({ default: m.AdminChatWidget })),
  { ssr: false }
);

const AppointmentSessionReadyBridge = dynamic(
  () =>
    import('@/components/appointments/AppointmentSessionReadyBridge').then((m) => ({
      default: m.AppointmentSessionReadyBridge,
    })),
  { ssr: false }
);

const inter = Inter({ subsets: ['latin'] });

// Define metadataBase as a constant to ensure it's always available
const getMetadataBase = (): URL => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return new URL(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    return new URL(baseUrl);
  }
  return new URL('http://localhost:3000');
};

const SITE_NAME = 'Chat Jyotishi';
const SITE_TITLE = 'Chat Jyotishi (CJ) - Online Astrology Consultation Nepal';
const SITE_DESCRIPTION =
  'Chat Jyotishi - Connect with verified Nepali astrologers for real-time chat, horoscope, kundali, and astrology consultation. Best jyotish chat platform in Nepal.';

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: '%s | Chat Jyotishi',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'chatjyotishi',
    'chat jyotishi',
    'jyotish chat nepal',
    'jyotishchat nepal',
    'jyotish chat',
    'online astrology nepal',
    'astrologer chat nepal',
    'nepali astrologer',
    'horoscope nepal',
    'rashifal',
    'kundali nepal',
    'kundli match',
    'jyotish consultation',
    'astrology consultation nepal',
    'chat with astrologer',
    'best astrology app nepal',
    'verified astrologers nepal',
  ],
  applicationName: SITE_NAME,
  metadataBase: getMetadataBase(),
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'en_NP',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    // Add when you have them: google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: ['/favicon.ico'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <JsonLd />
        <QueryProvider>
          <MaintenanceGate>
            <AuthProvider>
              <NepaliDateProvider>
                <Suspense fallback={null}>
                  <PaymentRedirectHandler />
                </Suspense>
                <AppointmentSessionReadyBridge />
                {children}
              <AdminChatWidget />
              <Toaster position="top-right" richColors />
              {/* Fixed portal root for dropdowns (e.g. Language select) so they stay visible when scrolling */}
              <div
                id="dropdown-portal-root"
                aria-hidden
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 99999,
                  pointerEvents: 'none',
                }}
              />
            </NepaliDateProvider>
          </AuthProvider>
          </MaintenanceGate>
        </QueryProvider>
      </body>
    </html>
  );
}
