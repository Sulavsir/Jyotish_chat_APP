import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Chat Jyotishi - Online Astrology Nepal',
  description:
    'Chat Jyotishi is Nepal\'s trusted platform for astrology consultation. Connect with verified jyotish for horoscope, kundali & personalized guidance.',
  openGraph: {
    title: 'About Chat Jyotishi - Astrology Platform Nepal',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
