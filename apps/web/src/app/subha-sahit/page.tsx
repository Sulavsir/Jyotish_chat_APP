'use client';

import { Navbar } from '@/components/ui';
import { SubhaSahitSection } from '@/components/home/SubhaSahitSection';
import { Footer } from '@/components/home';

export default function SubhaSahitPage() {
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

