'use client';

import { useEffect, useState } from 'react';
import { Navbar } from '@/components/ui';
import { SubhaSahitSection } from '@/components/home/SubhaSahitSection';
import { Footer } from '@/components/home';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuthStore } from '@/store/auth-store';
import { USER_ROLES } from '@/constants';

export default function SubhaSahitPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const user = useAuthStore((state) => state.user);
  const isClient = user?.role === USER_ROLES.CLIENT;

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Avoid flashing the public layout before auth store hydrates
  if (!isHydrated) {
    return null;
  }

  if (isClient) {
    return (
      <DashboardLayout hideBackground>
        <div className="py-6">
          <SubhaSahitSection />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="pt-16">
        <SubhaSahitSection />
      </main>
      <Footer />
    </div>
  );
}

