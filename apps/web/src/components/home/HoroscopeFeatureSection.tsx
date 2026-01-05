import Image from 'next/image';
import horoscopeImage from '@/assets/images/horoscope.webp';
import { TwinklingStars } from '@/components/ui/TwinklingStars';

export function HoroscopeFeatureSection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-purple-950/20 to-black overflow-hidden">
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        :global(.animate-float) {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
      <div className="absolute inset-0 opacity-5">
        <Image src={horoscopeImage} alt="Horoscope Background" fill className="object-cover" />
      </div>
      <TwinklingStars count={60} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Glowing background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>

              {/* Spinning horoscope wheel */}
              <div className="relative animate-spin-slow">
                <Image
                  src={horoscopeImage}
                  alt="Horoscope Wheel"
                  fill
                  className="object-contain drop-shadow-[0_0_50px_rgba(168,85,247,0.5)]"
                />
              </div>

              {/* Floating stat cards around the wheel */}
              <div className="absolute -top-8 -left-8 bg-gradient-to-br from-purple-900/80 to-purple-800/60 backdrop-blur-md p-4 rounded-xl border border-purple-500/30 shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">5000+</div>
                    <div className="text-xs text-purple-300">Readings</div>
                  </div>
                </div>
              </div>

              <div
                className="absolute -bottom-8 -right-8 bg-gradient-to-br from-pink-900/80 to-pink-800/60 backdrop-blur-md p-4 rounded-xl border border-pink-500/30 shadow-lg animate-float"
                style={{ animationDelay: '1s' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">50+</div>
                    <div className="text-xs text-pink-300">Astrologers</div>
                  </div>
                </div>
              </div>

              <div
                className="absolute top-1/2 -right-12 bg-gradient-to-br from-red-900/80 to-red-800/60 backdrop-blur-md p-4 rounded-xl border border-red-500/30 shadow-lg animate-float"
                style={{ animationDelay: '2s' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">98%</div>
                    <div className="text-xs text-red-300">Accuracy</div>
                  </div>
                </div>
              </div>

              {/* Decorative orbiting dots */}
              <div className="absolute top-1/4 left-1/4 w-3 h-3 rounded-full bg-purple-400 animate-pulse"></div>
              <div
                className="absolute bottom-1/4 right-1/4 w-2 h-2 rounded-full bg-pink-400 animate-pulse"
                style={{ animationDelay: '1s' }}
              ></div>
              <div
                className="absolute top-1/3 right-1/3 w-2 h-2 rounded-full bg-red-400 animate-pulse"
                style={{ animationDelay: '2s' }}
              ></div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">
              Your Cosmic Blueprint
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mt-4 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-red-300">
              Personalized Horoscopes
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Unlock the secrets of your birth chart and receive daily cosmic guidance tailored
              specifically for you. Our expert astrologers analyze your unique planetary positions
              to provide accurate predictions.
            </p>
            <div className="space-y-4">
              <FeatureItem
                icon={<CheckIcon />}
                title="Daily Predictions"
                description="Start each day with cosmic insights"
                gradientFrom="from-purple-500"
                gradientTo="to-pink-500"
              />
              <FeatureItem
                icon={<CheckIcon />}
                title="Birth Chart Analysis"
                description="Detailed planetary position insights"
                gradientFrom="from-pink-500"
                gradientTo="to-red-500"
              />
              <FeatureItem
                icon={<CheckIcon />}
                title="Compatibility Reports"
                description="Discover relationship insights"
                gradientFrom="from-red-500"
                gradientTo="to-purple-500"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  gradientFrom,
  gradientTo,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-purple-500/20">
      <div
        className={`w-12 h-12 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
