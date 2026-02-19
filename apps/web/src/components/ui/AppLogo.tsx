'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ROUTES } from '@/constants';

import logoSrc from '@jyotish/ui/assets/chatjyotishilogo2.png';

export interface AppLogoProps {
  height?: number;
  href?: string;
  className?: string;
  blendWithDarkBackground?: boolean;
}

export function AppLogo({
  height = 40,
  href = ROUTES.HOME,
  className = '',
  blendWithDarkBackground = false,
}: AppLogoProps) {
  const img = (
    <Image
      src={logoSrc}
      alt="Chat Jyotishi"
      width={height * 3}
      height={height}
      className={`object-contain ${blendWithDarkBackground ? 'mix-blend-lighten' : ''}`}
    />
  );

  const wrapperClass = `inline-flex items-center bg-transparent ${className}`.trim();
  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label="Chat Jyotishi - Home">
        {img}
      </Link>
    );
  }
  return <span className={wrapperClass}>{img}</span>;
}
