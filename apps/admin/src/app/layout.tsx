import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { NepaliDateProvider } from '@/providers/nepali-date-provider';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { MaintenanceGate } from '@/components/maintenance/MaintenanceGate';
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
    'CJ Admin is the control panel for managing astrologers, clients, chats, earnings, pricing, and platform configuration for Chat Jyotishi.',
  applicationName: 'CJ Admin',
  metadataBase: getMetadataBase(),
  openGraph: {
    title: 'CJ Admin - Jyotish Control Panel',
    description:
      'Monitor live consultations, manage astrologers and clients, review chats and complaints, and configure the Chat Jyotishi platform.',
    url: '/',
    siteName: 'CJ Admin',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CJ Admin - Jyotish Control Panel',
    description:
      'Monitor live consultations, manage astrologers and clients, review chats and complaints, and configure the Chat Jyotishi platform.',
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
          <MaintenanceGate>
            <NepaliDateProvider>
              <TooltipProvider delayDuration={300}>
                {children}
                <Toaster position="top-right" richColors />
              </TooltipProvider>
            </NepaliDateProvider>
          </MaintenanceGate>
        </QueryProvider>
      </body>
    </html>
  );
}
