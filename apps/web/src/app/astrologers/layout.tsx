import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verified Astrologers Nepal | Chat with Jyotish Online',
  description:
    'Browse verified Nepali astrologers. Chat instantly or book appointments for kundali, horoscope & astrology consultation. Best jyotish chat platform in Nepal.',
  keywords: [
    'astrologers nepal',
    'nepali astrologer',
    'jyotish nepal',
    'chat with astrologer',
    'online astrologer',
    'verified astrologers',
  ],
  openGraph: {
    title: 'Verified Astrologers Nepal | Chat Jyotishi',
    description: 'Connect with verified Nepali astrologers for instant chat & consultation.',
  },
};

export default function AstrologersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
