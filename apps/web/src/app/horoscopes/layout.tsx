import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Horoscope Nepal - Rashifal | Chat Jyotishi',
  description:
    'Free daily, weekly, monthly & yearly horoscope (rashifal) in English, Nepali & Hindi. Get your zodiac predictions from Chat Jyotishi - Nepal\'s best astrology platform.',
  keywords: [
    'rashifal',
    'horoscope nepal',
    'daily horoscope',
    'weekly horoscope',
    'monthly horoscope',
    'rashifal today',
    'zodiac sign nepal',
    'astrology nepal',
  ],
  openGraph: {
    title: 'Daily Horoscope Nepal - Rashifal | Chat Jyotishi',
    description: 'Free horoscope in English, Nepali & Hindi. Daily, weekly, monthly predictions.',
  },
};

export default function HoroscopesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
