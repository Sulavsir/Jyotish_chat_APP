import Image from 'next/image';
import horoscopeImage from '@/assets/images/horoscope.webp';
import { TwinklingStars } from '@/components/ui/TwinklingStars';

export function HoroscopeFeatureSection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-purple-950/20 to-black overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <Image src={horoscopeImage} alt="Horoscope Background" fill className="object-cover" />
      </div>
      <TwinklingStars count={60} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative animate-spin-slow">
                <Image
                  src={horoscopeImage}
                  alt="Horoscope Wheel"
                  fill
                  className="object-contain drop-shadow-[0_0_50px_rgba(168,85,247,0.5)]"
                />
              </div>
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
