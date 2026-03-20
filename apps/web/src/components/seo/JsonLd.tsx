/**
 * JSON-LD structured data for Google Search (rich results, knowledge panel)
 * Helps Google understand: organization, website (Nepal-focused)
 */
export function JsonLd() {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://chatjyotishi.com';

  const organization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Chat Jyotishi',
    alternateName: ['CJ', 'Jyotish Chat Nepal', 'ChatJyotishi'],
    url: baseUrl,
    description:
      'Online astrology consultation platform - chat with verified Nepali astrologers for horoscope, kundali, and personalized guidance.',
    areaServed: {
      '@type': 'Country',
      name: 'Nepal',
    },
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Chat Jyotishi',
    url: baseUrl,
    description:
      'Chat Jyotishi - Best online jyotish chat platform in Nepal. Connect with verified astrologers for real-time consultation.',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/astrologers`,
      'query-input': 'required name=search_term_string',
    },
  };

  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Chat Jyotishi',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'NPR',
    },
    description:
      'Real-time astrology chat with verified Nepali jyotish. Get horoscope, kundali match, and personalized cosmic guidance.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
      />
    </>
  );
}
