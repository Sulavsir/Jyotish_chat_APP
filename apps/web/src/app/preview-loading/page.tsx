/**
 * Preview Page - Showcase loading components
 * Navigate to /preview-loading to see all loading states
 */

'use client';

import { useState } from 'react';
import { LoadingScreen, Spinner } from '@/components/ui';
import { Button } from '@jyotish/ui';

export default function PreviewLoadingPage() {
  const [showFullScreen, setShowFullScreen] = useState(false);

  if (showFullScreen) {
    return <LoadingScreen message="Preview Mode" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-8">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400">
            Loading Components Preview
          </h1>
          <p className="text-gray-400">Showcase of all loading states and spinners</p>
        </div>

        {/* Full Screen Loading */}
        <section className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-white">Full Screen Loading</h2>
          <p className="text-gray-400">Click the button to see the full-screen loading animation</p>
          <Button
            color="primary"
            onClick={() => {
              setShowFullScreen(true);
              setTimeout(() => setShowFullScreen(false), 5000);
            }}
          >
            Show LoadingScreen (5s)
          </Button>
        </section>

        {/* Spinner Variants */}
        <section className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold text-white">Spinner Variants</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-purple-400 mb-3">Default Variant</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Spinner size="sm" />
                  <p className="text-xs text-gray-400 mt-2">Small</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" />
                  <p className="text-xs text-gray-400 mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <Spinner size="lg" />
                  <p className="text-xs text-gray-400 mt-2">Large</p>
                </div>
                <div className="text-center">
                  <Spinner size="xl" />
                  <p className="text-xs text-gray-400 mt-2">X-Large</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-pink-400 mb-3">Cosmic Variant</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Spinner size="sm" variant="cosmic" />
                  <p className="text-xs text-gray-400 mt-2">Small</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" variant="cosmic" />
                  <p className="text-xs text-gray-400 mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <Spinner size="lg" variant="cosmic" />
                  <p className="text-xs text-gray-400 mt-2">Large</p>
                </div>
                <div className="text-center">
                  <Spinner size="xl" variant="cosmic" />
                  <p className="text-xs text-gray-400 mt-2">X-Large</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-400 mb-3">Simple Variant</h3>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <Spinner size="sm" variant="simple" />
                  <p className="text-xs text-gray-400 mt-2">Small</p>
                </div>
                <div className="text-center">
                  <Spinner size="md" variant="simple" />
                  <p className="text-xs text-gray-400 mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <Spinner size="lg" variant="simple" />
                  <p className="text-xs text-gray-400 mt-2">Large</p>
                </div>
                <div className="text-center">
                  <Spinner size="xl" variant="simple" />
                  <p className="text-xs text-gray-400 mt-2">X-Large</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Examples */}
        <section className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-white">Usage Examples</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg">
              <Spinner size="sm" variant="cosmic" />
              <span className="text-gray-300">Loading your profile...</span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg">
              <Spinner size="md" />
              <span className="text-gray-300">Fetching horoscope data...</span>
            </div>

            <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg">
              <Spinner size="sm" variant="simple" />
              <span className="text-gray-300">Processing request...</span>
            </div>
          </div>
        </section>

        {/* Error Pages */}
        <section className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-lg p-6 space-y-4">
          <h2 className="text-2xl font-bold text-white">Error Pages</h2>
          <p className="text-gray-400">Preview the custom error pages</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              color="primary"
              onClick={() => (window.location.href = '/this-page-does-not-exist')}
            >
              View 404 Page
            </Button>
            <Button color="secondary" onClick={() => (window.location.href = '/unauthorized')}>
              View 401 Page
            </Button>
          </div>
        </section>

        {/* Navigation */}
        <section className="text-center">
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Back to Home
          </Button>
        </section>
      </div>
    </div>
  );
}
