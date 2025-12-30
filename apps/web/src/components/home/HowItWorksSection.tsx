import { TwinklingStars } from '@/components/ui/TwinklingStars';

export function HowItWorksSection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      <TwinklingStars count={50} />
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <span className="text-pink-400 font-semibold text-sm uppercase tracking-wider">
            Simple Process
          </span>
          <h2 className="text-5xl md:text-6xl font-bold mt-4 mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-300 via-pink-300 to-red-300">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Begin your cosmic journey in three simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          <Step
            number={1}
            title="Sign Up"
            description="Create your free account and enter your birth details for personalized cosmic insights"
            gradientFrom="from-purple-600"
            gradientTo="to-pink-600"
            showConnector
          />
          <Step
            number={2}
            title="Connect"
            description="Chat with verified astrologers instantly or schedule consultations at your convenience"
            gradientFrom="from-pink-600"
            gradientTo="to-red-600"
            showConnector
          />
          <Step
            number={3}
            title="Transform"
            description="Receive guidance and watch your life align with the wisdom of the cosmos"
            gradientFrom="from-red-600"
            gradientTo="to-purple-600"
          />
        </div>
      </div>
    </section>
  );
}

function Step({
  number,
  title,
  description,
  gradientFrom,
  gradientTo,
  showConnector = false,
}: {
  number: number;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  showConnector?: boolean;
}) {
  return (
    <div className="relative group">
      <div className="text-center">
        <div className="relative inline-block mb-8">
          <div
            className={`absolute -inset-6 bg-gradient-to-r ${gradientFrom} ${gradientTo} rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`}
          ></div>
          <div
            className={`relative w-24 h-24 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-2xl`}
          >
            <span className="text-4xl font-bold text-white">{number}</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
      {showConnector && (
        <div
          className={`hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-30`}
        ></div>
      )}
    </div>
  );
}
