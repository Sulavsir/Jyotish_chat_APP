import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@jyotish/ui';
import spaceImage from '@/assets/images/space.jpg';
import { ROUTES } from '@/constants';
import { TwinklingStars } from '@/components/ui/TwinklingStars';

export function CTASection() {
  return (
    <section className="py-32 bg-gradient-to-r from-black via-red-950/20 to-purple-950/20 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <Image src={spaceImage} alt="Space Background" fill className="object-cover" />
      </div>
      <TwinklingStars count={90} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-red-300">
            Ready to Discover Your Destiny?
          </h2>
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
            Join thousands who have found clarity and guidance through the stars
          </p>
          <Button
            size="xl"
            color="primary"
            asChild
            className="font-bold text-xl px-14 py-8 rounded-xl transform hover:scale-105"
          >
            <Link href={ROUTES.LOGIN}>Start Your Journey Today</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
