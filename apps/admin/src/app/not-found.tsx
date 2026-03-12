'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
      <h1 className="text-3xl font-bold mb-2">Page not found</h1>
      <p className="text-slate-400 mb-4">The page you are looking for does not exist.</p>
      <Link
        href="/admin/dashboard"
        className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium"
      >
        Go to admin dashboard
      </Link>
    </div>
  );
}

