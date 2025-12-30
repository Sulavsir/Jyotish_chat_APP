/**
 * Root Layout - Main application layout
 */

'use client';

import { useEffect } from 'react';
import { useAuth, useSocket } from '@/hooks';

interface RootLayoutProps {
  children: React.ReactNode;
}

export function RootLayout({ children }: RootLayoutProps) {
  const { isAuthenticated } = useAuth();
  
  // Initialize WebSocket connection if authenticated
  useSocket();

  useEffect(() => {
    // Any global initialization logic
  }, []);

  return <>{children}</>;
}

