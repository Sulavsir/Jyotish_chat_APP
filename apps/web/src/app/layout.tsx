import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import { AdminChatWidget } from '@/components/widgets/AdminChatWidget';

const inter = Inter({ subsets: ['latin'] });

// Define metadataBase as a constant to ensure it's always available
const getMetadataBase = (): URL => {
  if (process.env.NEXT_PUBLIC_WEB_URL) {
    return new URL(process.env.NEXT_PUBLIC_WEB_URL);
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
    return new URL(baseUrl);
  }
  return new URL('http://localhost:3000');
};

export const metadata: Metadata = {
  title: {
    default: 'Chat Jyotishi (CJ) - Astrology Consultation Platform',
    template: '%s | Chat Jyotishi',
  },
  description:
    'Chat Jyotishi (CJ) lets you connect with professional astrologers for real-time consultations, instant chat, and personalized horoscopes.',
  keywords: [
    'Chat Jyotishi',
    'CJ',
    'online astrology',
    'astrologer chat',
    'horoscope',
    'kundli',
    'jyotish consultation',
    'Chat Jyotishi',
    'jyotish chat',
    'jyotish consultation',
    'jyotish chat',
    'Chat Jyotishi autonomous technology',
    'autonomous technology',
    'Autonomous Technology',
  ],
  applicationName: 'Chat Jyotishi',
  metadataBase: getMetadataBase(),
  openGraph: {
    title: 'Chat Jyotishi (CJ) - Astrology Consultation Platform',
    description:
      'Talk to verified astrologers in real-time, get instant guidance, and manage your consultations in one place.',
    url: '/',
    siteName: 'Chat Jyotishi',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chat Jyotishi (CJ) - Astrology Consultation Platform',
    description:
      'Talk to verified astrologers in real-time, get instant guidance, and manage your consultations in one place.',
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
        <QueryProvider>
          <AuthProvider>
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
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
