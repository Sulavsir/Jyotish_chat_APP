import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@jyotish/ui';
import { TwinklingStars } from '@/components/ui/TwinklingStars';

export function ServicesSection() {
  const services = [
    {
      title: 'Real-Time Chat',
      description: 'Instant cosmic guidance',
      content:
        'Connect instantly with verified astrologers for immediate answers to your questions',
      icon: <ChatIcon />,
      gradientFrom: 'from-purple-600',
      gradientTo: 'to-pink-600',
      borderColor: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-400',
      hoverShadow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]',
    },
    {
      title: 'Daily Horoscope',
      description: 'Personalized predictions',
      content: 'Receive personalized daily horoscopes to start each day with cosmic insights',
      icon: <SunIcon />,
      gradientFrom: 'from-pink-600',
      gradientTo: 'to-red-600',
      borderColor: 'border-pink-500/30',
      hoverBorder: 'hover:border-pink-400',
      hoverShadow: 'hover:shadow-[0_0_40px_rgba(236,72,153,0.3)]',
    },
    {
      title: 'Consultations',
      description: 'Deep dive sessions',
      content: 'Schedule detailed sessions via chat, voice, or video call at your convenience',
      icon: <CalendarIcon />,
      gradientFrom: 'from-red-600',
      gradientTo: 'to-purple-600',
      borderColor: 'border-red-500/30',
      hoverBorder: 'hover:border-red-400',
      hoverShadow: 'hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]',
    },
    {
      title: 'Birth Chart',
      description: 'Your cosmic blueprint',
      content: 'Comprehensive analysis revealing your planetary influences and life path',
      icon: <ChartIcon />,
      gradientFrom: 'from-blue-600',
      gradientTo: 'to-purple-600',
      borderColor: 'border-blue-500/30',
      hoverBorder: 'hover:border-blue-400',
      hoverShadow: 'hover:shadow-[0_0_40px_rgba(59,130,246,0.3)]',
    },
    {
      title: 'Love Match',
      description: 'Relationship insights',
      content: 'Discover compatibility insights for relationships and partnerships',
      icon: <HeartIcon />,
      gradientFrom: 'from-indigo-600',
      gradientTo: 'to-pink-600',
      borderColor: 'border-indigo-500/30',
      hoverBorder: 'hover:border-indigo-400',
      hoverShadow: 'hover:shadow-[0_0_40px_rgba(99,102,241,0.3)]',
    },
    {
      title: 'Career Guide',
      description: 'Professional insights',
      content: 'Navigate your career path with astrological timing and guidance',
      icon: <BriefcaseIcon />,
      gradientFrom: 'from-purple-600',
      gradientTo: 'to-red-600',
      borderColor: 'border-purple-500/30',
      hoverBorder: 'hover:border-purple-400',
      hoverShadow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.3)]',
    },
  ];

  return (
    <section className="relative py-24 bg-gradient-to-br from-black via-red-950/30 to-purple-950/30 overflow-hidden">
      <TwinklingStars count={70} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">
            What We Offer
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mt-4 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-red-300">
            Our Services
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Comprehensive astrological guidance designed to illuminate your path
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {services.map((service, index) => (
            <Card
              key={index}
              className={`group bg-black/50 backdrop-blur-md ${service.borderColor} ${service.hoverBorder} ${service.hoverShadow} transition-all duration-300`}
            >
              <CardHeader>
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${service.gradientFrom} ${service.gradientTo} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {service.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-white">{service.title}</CardTitle>
                <CardDescription className="text-gray-400">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">{service.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// Icons
function ChatIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
