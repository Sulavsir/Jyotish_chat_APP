import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@jyotish/ui';
import spaceImage from '@/assets/images/space.jpg';
import horoscopeImage from '@/assets/images/horoscope.webp';
import { ROUTES } from '@/constants';
import { TwinklingStars } from '@/components/ui/TwinklingStars';
import { RotatingCopyTypewriter } from '@/components/ui/RotatingCopyTypewriter';

export function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={spaceImage}
          alt="Cosmic Space"
          fill
          className="object-cover"
          priority
          quality={100}
        />
        <TwinklingStars count={60} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-purple-900/30 to-black/90"></div>
      </div>

      {/* Floating Horoscope Wheel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 animate-spin-slow">
        <Image src={horoscopeImage} alt="Horoscope Wheel" fill className="object-contain" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-6 inline-block animate-fade-in-up">
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-[0.3em] drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">
              Ancient Wisdom • Modern Technology
            </span>
          </div>
          <RotatingCopyTypewriter
            titleAs="h1"
            subtitleAs="p"
            titleClassName="text-5xl md:text-6xl lg:text-7xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 drop-shadow-[0_0_50px_rgba(220,20,60,0.65)] animate-gradient-x leading-tight py-2"
            subtitleClassName="text-lg md:text-xl lg:text-2xl text-gray-200/90 mb-12 font-light tracking-wide max-w-3xl mx-auto animate-fade-in-up animation-delay-200"
          />
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up animation-delay-600">
            <Button
              size="xl"
              color="primary"
              asChild
              className="font-bold rounded-xl transform hover:scale-105"
            >
              <Link href={ROUTES.LOGIN}>Get Started</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 w-full z-20">
        <div className="flex justify-center animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/60 text-sm whitespace-nowrap">Scroll to explore</span>
            <svg
              className="w-6 h-6 text-white/70"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
