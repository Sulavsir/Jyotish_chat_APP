import { CosmicBackground } from '@/components/ui/CosmicBackground';

export default function BackgroundPreview() {
  return (
    <div className="min-h-screen relative">
      {/* Enhanced Cosmic Background */}
      <CosmicBackground />

      {/* Preview Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center space-y-8">
          <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 drop-shadow-[0_0_40px_rgba(220,20,60,0.9)]">
            MARGADARSHAN
          </h1>
          <p className="text-3xl text-pink-200 drop-shadow-[0_0_20px_rgba(255,105,180,0.6)]">
            YOUR PATH, YOUR DESTINY
          </p>
          <div className="mt-12 p-8 bg-black/50 backdrop-blur-md border border-purple-500/40 rounded-lg max-w-2xl">
            <p className="text-purple-100/90 text-lg leading-relaxed">
              ✨ <strong>Optimized Cosmic Space Theme</strong>
              <br />
              <span className="text-pink-300">🔴 Red</span> •{' '}
              <span className="text-blue-300">🔵 Blue</span> •{' '}
              <span className="text-purple-300">🟣 Purple</span> •{' '}
              <span className="text-pink-300">💗 Pink</span>
              <br />
              Deep space darkness with 3 optimized nebula layers
              <br />
              Stars twinkling in cosmic colors with simple animations
              <br />
              Performance-optimized: reduced blur, fewer layers
              <br />
              Fast and responsive for smooth user experience
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 justify-center text-sm">
            <span className="px-3 py-1 bg-purple-900/40 border border-purple-500/30 rounded-full text-purple-200">
              🌟 Purple nebulas
            </span>
            <span className="px-3 py-1 bg-blue-900/40 border border-blue-500/30 rounded-full text-blue-200">
              💫 Blue stars
            </span>
            <span className="px-3 py-1 bg-pink-900/40 border border-pink-500/30 rounded-full text-pink-200">
              ✨ Pink accents
            </span>
            <span className="px-3 py-1 bg-red-900/40 border border-red-500/30 rounded-full text-red-200">
              🔴 Red glows
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}













