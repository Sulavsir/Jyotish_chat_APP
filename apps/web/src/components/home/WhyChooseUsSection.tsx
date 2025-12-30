import Image from 'next/image';
import skyImage from '@/assets/images/sky.jpg';
import { TwinklingStars } from '@/components/ui/TwinklingStars';

export function WhyChooseUsSection() {
  return (
    <section className="py-24 bg-gradient-to-bl from-black via-red-950/20 to-purple-950/30 text-white relative overflow-hidden">
      <TwinklingStars count={80} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-pink-300 font-semibold text-sm uppercase tracking-wider">
              Why Choose Us
            </span>
            <h2 className="text-5xl md:text-6xl font-bold mb-8 mt-4 leading-tight">
              Your Trusted Cosmic Guide
            </h2>
            <p className="text-xl mb-10 text-gray-200 leading-relaxed">
              We combine ancient astrological wisdom with modern technology to deliver the most
              accurate and accessible guidance.
            </p>
            <div className="space-y-6">
              <Feature
                title="Verified Expert Astrologers"
                description="All our astrologers are verified professionals with years of experience"
              />
              <Feature
                title="100% Privacy Guaranteed"
                description="Your conversations and personal data are completely private and secure"
              />
              <Feature
                title="Available 24/7"
                description="Get cosmic guidance whenever you need it, day or night"
              />
            </div>
          </div>
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-10 border border-white/20 shadow-2xl">
              <div className="space-y-8">
                <Stat label="Total Consultations" value="10,000+" color="text-pink-300" />
                <Stat label="Expert Astrologers" value="50+" color="text-purple-300" />
                <Stat label="Happy Clients" value="8,500+" color="text-red-300" />
                <Stat label="Satisfaction Rate" value="98%" color="text-yellow-300" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
      <svg
        className="w-7 h-7 text-pink-300 mt-1 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <div>
        <h3 className="font-bold text-xl mb-2">{title}</h3>
        <p className="text-gray-200">{description}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between p-6 bg-white/10 rounded-2xl">
      <span className="text-lg font-medium">{label}</span>
      <span className={`text-4xl font-bold ${color}`}>{value}</span>
    </div>
  );
}
