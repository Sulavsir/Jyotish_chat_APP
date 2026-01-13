import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

// Define metadataBase as a constant to ensure it's always available
const getMetadataBase = (): URL => {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) {
    return new URL(process.env.NEXT_PUBLIC_ADMIN_URL);
  }
  return new URL('http://localhost:3002');
};

export const metadata: Metadata = {
  title: {
    default: 'CJ Admin - Jyotish Control Panel',
    template: '%s | CJ Admin',
  },
  description:
    'CJ Admin is the control panel for managing astrologers, clients, chats, earnings, pricing, and platform configuration for Chat Jyotish.',
  applicationName: 'CJ Admin',
  metadataBase: getMetadataBase(),
  openGraph: {
    title: 'CJ Admin - Jyotish Control Panel',
    description:
      'Monitor live consultations, manage astrologers and clients, review chats and complaints, and configure the Chat Jyotish platform.',
    url: '/',
    siteName: 'CJ Admin',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CJ Admin - Jyotish Control Panel',
    description:
      'Monitor live consultations, manage astrologers and clients, review chats and complaints, and configure the Chat Jyotish platform.',
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
          {children}
          <Toaster position="top-right" richColors />
        </QueryProvider>
      </body>
    </html>
  );
}
