'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { QUERY_KEYS, ROUTES } from '@/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Alert,
  AlertTitle,
  AlertDescription,
  Button,
  Skeleton,
} from '@jyotish/ui';
import { useRequireAuth } from '@/hooks';
import { USER_ROLES } from '@/constants';
import { LoadingScreenWithBackground } from '@/components/ui';
import { OnlineUsers } from '@/components/features/chat';
import { RequestInstantChatButton } from '@/components/features/instant-chat/RequestInstantChatButton';
import { BookAppointmentButton, BookAppointmentModal } from '@/components/features/appointment';
import { checkClientProfileCompletion } from '@/utils/profile-completion';
import Image from 'next/image';
import horoscopeImage from '@/assets/images/cj2.png';
import { TwinklingStars } from '@/components/ui/TwinklingStars';
import { BookJyotishServiceModal } from '@/components/features/jyotish-bookings';
import { JyotishBookingType } from '@jyotish/shared';
import {
  Sparkles,
  MessageCircle,
  CalendarDays,
  BookOpen,
  Sun,
  HeartHandshake,
  MapPin,
  ScrollText,
  GitCompareArrows,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import dashboardRotatingCopyService from '@/services/dashboardRotatingCopy.service';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isCheckingAccess } = useRequireAuth({
    requiredRole: USER_ROLES.CLIENT,
  });
  const [showWelcomeAlert, setShowWelcomeAlert] = useState(true);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPanditModalOpen, setIsPanditModalOpen] = useState(false);
  const [isVaastuModalOpen, setIsVaastuModalOpen] = useState(false);
  const [isKathaModalOpen, setIsKathaModalOpen] = useState(false);

  const isProfileComplete = useMemo(() => {
    if (!user) return false;
    return !!user.profileCompleted || checkClientProfileCompletion(user).isComplete;
  }, [user]);

  const { data: rotatingCopy = [], isLoading: isRotatingCopyLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.ROTATING_COPY,
    queryFn: dashboardRotatingCopyService.listPublic,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const [copyIndex, setCopyIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [typedSubtitle, setTypedSubtitle] = useState('');
  const [phase, setPhase] = useState<'title' | 'subtitle' | 'pause'>('title');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (rotatingCopy.length === 0) return;
    if (copyIndex < rotatingCopy.length) return;
    setCopyIndex(0);
    setTypedTitle('');
    setTypedSubtitle('');
    setPhase('title');
    setCharIndex(0);
  }, [rotatingCopy.length, copyIndex]);

  useEffect(() => {
    if (rotatingCopy.length === 0) return;
    const current = rotatingCopy[copyIndex];
    if (!current) return;
    // Slightly slower typing to avoid excessive re-renders and keep animations smooth
    const speed = phase === 'title' ? 52 : 34;

    let timer: ReturnType<typeof setTimeout> | null = null;

    if (phase === 'pause') {
      timer = setTimeout(() => {
        const next = (copyIndex + 1) % rotatingCopy.length;
        setCopyIndex(next);
        setTypedTitle('');
        setTypedSubtitle('');
        setPhase('title');
        setCharIndex(0);
      }, 3500);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    timer = setTimeout(() => {
      if (phase === 'title') {
        const nextText = current.title.slice(0, charIndex + 1);
        setTypedTitle(nextText);
        const nextChar = charIndex + 1;
        if (nextChar >= current.title.length) {
          setPhase('subtitle');
          setCharIndex(0);
        } else {
          setCharIndex(nextChar);
        }
        return;
      }

      // subtitle
      const nextText = current.subtitle.slice(0, charIndex + 1);
      setTypedSubtitle(nextText);
      const nextChar = charIndex + 1;
      if (nextChar >= current.subtitle.length) {
        setPhase('pause');
        setCharIndex(0);
      } else {
        setCharIndex(nextChar);
      }
    }, speed);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [rotatingCopy, copyIndex, phase, charIndex]);

  // Memoized rotating wheel so it doesn't "restart" during typewriter re-renders
  const rotatingWheelEl = useMemo(() => {
    return (
      <div className="relative h-[340px] w-[340px] opacity-[0.6]">
        <div className="absolute inset-0 animate-spin [animation-duration:90s] will-change-transform">
          <Image src={horoscopeImage} alt="Horoscope Wheel" fill className="object-contain" />
        </div>
      </div>
    );
  }, []);

  // Show loading state while checking access - prevents any flash of content
  if (isCheckingAccess) {
    return <LoadingScreenWithBackground message="Verifying access..." />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <style jsx>{`
          @keyframes caret-blink {
            0%,
            45% {
              opacity: 1;
            }
            46%,
            100% {
              opacity: 0;
            }
          }
          :global(.type-cursor) {
            animation: caret-blink 0.9s infinite;
          }

          @keyframes stars-drift-1 {
            from {
              background-position: 0px 0px;
            }
            to {
              background-position: 700px 900px;
            }
          }
          @keyframes stars-drift-2 {
            from {
              background-position: 0px 0px;
            }
            to {
              background-position: -900px 650px;
            }
          }
          @keyframes stars-twinkle {
            0% {
              opacity: 0.22;
              transform: scale(0.95);
            }
            50% {
              opacity: 0.55;
              transform: scale(1);
            }
            100% {
              opacity: 0.28;
              transform: scale(0.98);
            }
          }
          :global(.stars) {
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
          }
          :global(.stars::before),
          :global(.stars::after) {
            content: '';
            position: absolute;
            inset: -30px;
            background: transparent;
            width: 2px;
            height: 2px;
            border-radius: 999px;
            opacity: 0.55;
            box-shadow:
              20px 30px rgba(255, 255, 255, 0.55),
              60px 120px rgba(255, 255, 255, 0.35),
              110px 70px rgba(255, 255, 255, 0.45),
              160px 150px rgba(255, 255, 255, 0.25),
              220px 40px rgba(255, 255, 255, 0.38),
              280px 110px rgba(255, 255, 255, 0.32),
              340px 70px rgba(255, 255, 255, 0.28),
              420px 140px rgba(255, 255, 255, 0.22),
              520px 80px rgba(255, 255, 255, 0.26),
              600px 160px rgba(255, 255, 255, 0.18),
              680px 40px rgba(255, 255, 255, 0.24),
              760px 120px rgba(255, 255, 255, 0.2);
            filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.18));
            animation: stars-twinkle 6.5s ease-in-out infinite;
          }
          :global(.stars::after) {
            width: 1px;
            height: 1px;
            opacity: 0.5;
            box-shadow:
              30px 180px rgba(167, 139, 250, 0.45),
              90px 40px rgba(252, 211, 77, 0.4),
              140px 110px rgba(255, 255, 255, 0.35),
              210px 170px rgba(255, 255, 255, 0.25),
              300px 30px rgba(255, 255, 255, 0.28),
              390px 90px rgba(255, 255, 255, 0.22),
              470px 30px rgba(255, 255, 255, 0.2),
              560px 120px rgba(167, 139, 250, 0.28),
              640px 170px rgba(255, 255, 255, 0.18),
              720px 60px rgba(252, 211, 77, 0.24);
            animation-duration: 8.5s;
          }

          @keyframes spark {
            0% {
              opacity: 0.05;
              transform: scale(0.85) rotate(0deg);
            }
            50% {
              opacity: 0.9;
              transform: scale(1.15) rotate(18deg);
            }
            100% {
              opacity: 0.08;
              transform: scale(0.9) rotate(0deg);
            }
          }
          :global(.spark) {
            position: absolute;
            width: 10px;
            height: 10px;
            opacity: 0.3;
            filter: drop-shadow(0 0 12px rgba(167, 139, 250, 0.22));
            animation: spark 4.8s ease-in-out infinite;
          }
          :global(.spark::before),
          :global(.spark::after) {
            content: '';
            position: absolute;
            inset: 0;
            margin: auto;
            width: 10px;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.9), transparent);
            border-radius: 999px;
          }
          :global(.spark::after) {
            transform: rotate(90deg);
          }
          :global(.spark--1) {
            top: 18%;
            left: 16%;
            animation-delay: 0.2s;
          }
          :global(.spark--2) {
            top: 34%;
            left: 42%;
            animation-delay: 1.1s;
          }
          :global(.spark--3) {
            top: 22%;
            left: 72%;
            animation-delay: 0.6s;
          }
          :global(.spark--4) {
            top: 62%;
            left: 28%;
            animation-delay: 1.7s;
          }
          :global(.spark--5) {
            top: 72%;
            left: 76%;
            animation-delay: 2.1s;
          }
          :global(.spark--6) {
            top: 12%;
            left: 30%;
            animation-delay: 0.9s;
          }
          :global(.spark--7) {
            top: 14%;
            left: 54%;
            animation-delay: 1.9s;
          }
          :global(.spark--8) {
            top: 26%;
            left: 8%;
            animation-delay: 2.7s;
          }
          :global(.spark--9) {
            top: 28%;
            left: 88%;
            animation-delay: 0.4s;
          }
          :global(.spark--10) {
            top: 40%;
            left: 24%;
            animation-delay: 3.1s;
          }
          :global(.spark--11) {
            top: 46%;
            left: 66%;
            animation-delay: 1.4s;
          }
          :global(.spark--12) {
            top: 52%;
            left: 12%;
            animation-delay: 2.2s;
          }
          :global(.spark--13) {
            top: 56%;
            left: 88%;
            animation-delay: 3.7s;
          }
          :global(.spark--14) {
            top: 64%;
            left: 54%;
            animation-delay: 0.8s;
          }
          :global(.spark--15) {
            top: 70%;
            left: 10%;
            animation-delay: 1.6s;
          }
          :global(.spark--16) {
            top: 78%;
            left: 40%;
            animation-delay: 2.9s;
          }
          :global(.spark--17) {
            top: 82%;
            left: 90%;
            animation-delay: 3.3s;
          }
          :global(.spark--18) {
            top: 34%;
            left: 52%;
            animation-delay: 4.1s;
          }
              :global(.spark--19) {
            top: 12%;
            left: 30%;
            animation-delay: 0.9s;
          }
              :global(.spark--20) {
            top: 12%;
            left: 30%;
            animation-delay: 0.9s;
          }
            :global(.spark--21) {
            top: 12%;
            left: 30%;
            animation-delay: 0.9s;
          }
            :global(.spark--22) {
            top: 12%;
            left: 30%;
            animation-delay: 0.9s;
          }

          @keyframes meteor {
            0% {
              transform: translate3d(0, 0, 0);
              opacity: 0;
            }
            8% {
              opacity: 0.85;
            }
            35% {
              opacity: 0.25;
            }
            60%,
            100% {
              transform: translate3d(240px, 240px, 0);
              opacity: 0;
            }
          }
          :global(.meteor) {
            position: absolute;
            width: 180px;
            height: 2px;
            border-radius: 999px;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0),
              rgba(255, 255, 255, 0.9),
              rgba(167, 139, 250, 0.65),
              rgba(255, 255, 255, 0)
            );
            filter: drop-shadow(0 0 14px rgba(167, 139, 250, 0.28));
            opacity: 0;
            transform: rotate(18deg);
            pointer-events: none;
            animation: meteor 9s ease-in-out infinite;
          }
          :global(.meteor--1) {
            top: 10%;
            left: 58%;
            animation-delay: 0.8s;
          }
          :global(.meteor--2) {
            top: 46%;
            left: 8%;
            animation-delay: 2.4s;
            animation-duration: 11s;
          }
          :global(.meteor--3) {
            top: 68%;
            left: 52%;
            animation-delay: 4.6s;
            animation-duration: 12.5s;
          }

          @keyframes shooting-star {
            0% {
              transform: translate3d(-15%, 15%, 0) rotate(-12deg);
              opacity: 0;
            }
            10% {
              opacity: 0.9;
            }
            40% {
              opacity: 0.15;
            }
            70%,
            100% {
              transform: translate3d(120%, -70%, 0) rotate(-12deg);
              opacity: 0;
            }
          }
          :global(.shooting-star) {
            position: absolute;
            width: 180px;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
            border-radius: 999px;
            filter: drop-shadow(0 0 10px rgba(167, 139, 250, 0.25));
            opacity: 0;
            pointer-events: none;
          }
          :global(.shooting-star--1) {
            top: 22%;
            left: -10%;
            animation: shooting-star 7.5s ease-in-out infinite;
          }
          :global(.shooting-star--2) {
            top: 62%;
            left: -15%;
            animation: shooting-star 9.5s ease-in-out infinite;
            animation-delay: 1.8s;
          }
        `}</style>
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome, {user?.name || 'User'}! 🌟
            </h1>
            <p className="text-gray-400">
              Your cosmic journey begins here. Explore your horoscope, chat with astrologers, or book
              a consultation.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <RequestInstantChatButton />
            <BookAppointmentButton />
          </div>
        </div>

        {/* Welcome Alert - Dismissible Example */}
        {showWelcomeAlert && (
          <Alert variant="info" dismissible onDismiss={() => setShowWelcomeAlert(false)}>
            <AlertTitle>Welcome to Jyotish!</AlertTitle>
            <AlertDescription>
              Explore your personalized horoscope, chat with expert astrologers, and discover cosmic
              insights.{' '}
              {!isProfileComplete && user && (
                <Button
                  onClick={() => router.push(ROUTES.PROFILE)}
                  variant="link"
                  color="info"
                  size="sm"
                  className="text-white"
                >
                  Complete your profile
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Info / Intro (Nepali) */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-purple-500/50 via-indigo-500/20 to-amber-500/40">
          <div className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            {/* Animated glow blobs */}
            <div className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl motion-safe:animate-pulse" />
            <div className="pointer-events-none absolute -bottom-32 -left-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl motion-safe:animate-pulse" />
            <div className="pointer-events-none absolute top-10 right-10 h-2 w-2 rounded-full bg-amber-300/80 motion-safe:animate-ping" />

            {/* Space / stars layer */}
            <div className="pointer-events-none absolute inset-0">
              {/* Denser background stars */}
              <TwinklingStars count={140} />
              <div className="stars" />
              <span className="spark spark--1" />
              <span className="spark spark--2" />
              <span className="spark spark--3" />
              <span className="spark spark--4" />
              <span className="spark spark--5" />
              <span className="spark spark--6" />
              <span className="spark spark--7" />
              <span className="spark spark--8" />
              <span className="spark spark--9" />
              <span className="spark spark--10" />
              <span className="spark spark--11" />
              <span className="spark spark--12" />
              <span className="spark spark--13" />
              <span className="spark spark--14" />
              <span className="spark spark--15" />
              <span className="spark spark--16" />
              <span className="spark spark--17" />
              <span className="spark spark--18" />
              <span className="meteor meteor--1 motion-safe:block hidden sm:block" />
              <span className="meteor meteor--2 motion-safe:block hidden sm:block" />
              <span className="meteor meteor--3 motion-safe:block hidden sm:block" />
            </div>

            <div className="relative p-6 md:p-8">
              {/* Right-side horoscope wheel (desktop) */}
              <div className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 lg:block">
                {rotatingWheelEl}
              </div>

              <div className="flex items-start justify-between gap-6 relative">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-200">
                    <Sparkles className="h-4 w-4 text-purple-300" />
                    <span>Your spiritual companion</span>
                  </div>

                  <h2 className="mt-3 text-2xl md:text-3xl font-bold text-white leading-tight min-h-[56px]">
                    {isRotatingCopyLoading ? (
                      <Skeleton className="h-8 w-[min(28rem,90%)] bg-white/10" />
                    ) : (
                      <>
                        {typedTitle}
                        {phase === 'title' && typedTitle.length > 0 && (
                          <span className="type-cursor ml-1 text-white/80">|</span>
                        )}
                      </>
                    )}
                  </h2>
                  <p className="mt-0.5 text-gray-300 min-h-[40px]">
                    {isRotatingCopyLoading ? (
                      <Skeleton className="h-4 w-[min(34rem,95%)] bg-white/10" />
                    ) : (
                      <>
                        {typedSubtitle}
                        {phase === 'subtitle' && typedSubtitle.length > 0 && (
                          <span className="type-cursor ml-1 text-gray-300/70">|</span>
                        )}
                      </>
                    )}
                  </p>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                      <p className="text-sm font-semibold text-white">Instant Guidance</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Verified Jyotish सँग real-time chat गरेर तुरुन्त उत्तर पाउनुहोस्।
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
                      <p className="text-sm font-semibold text-white">Personalized Insights</p>
                      <p className="text-sm text-gray-400 mt-1">
                        जन्म विवरण अनुसार kundali review, match, र future predictions।
                      </p>
                    </div>
                  </div> ``
                </div>

                {!isProfileComplete && (
                  <div className="hidden lg:flex flex-col gap-3 min-w-[240px]">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs text-gray-400">Quick tip</p>
                      <p className="text-sm text-white font-semibold mt-1">Profile पूरा गर्नुहोस्</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Accurate insights को लागि जन्म विवरण र प्रोफाइल पूरा गर्नुहोस्।
                      </p>
                      <Button
                        onClick={() => router.push(ROUTES.PROFILE)}
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full border-white/10 text-white hover:bg-white/10"
                      >
                        Go to Profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Online Astrologers - Who's Active Now */}
        <OnlineUsers title="Online Astrologers - Start Chatting Now!" maxHeight="400px" />

        {/* Services */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-r from-purple-500/50 via-indigo-500/20 to-amber-500/40">
          <div className="relative overflow-hidden rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 p-5 md:p-6">
            <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-purple-500/15 blur-3xl motion-safe:animate-pulse" />
            <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl motion-safe:animate-pulse" />
            <div className="flex items-end justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Services</h2>
                <p className="text-gray-400 text-sm mb-2">
                  Choose what you want to do next. Chat is highlighted for quick help.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Highlighted: Chat with Jyotish */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-purple-500/40 ring-1 ring-purple-500/20 shadow-[0_0_52px_rgba(168,85,247,0.18)] transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(168,85,247,0.22)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-purple-500/2 via-pink-500/3 to-indigo-500" />
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-purple-500/22 blur-2xl" />
              <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500/80 via-fuchsia-500/30 to-transparent" />
            
             <CardHeader className="relative p-3 pb-1"> 
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <MessageCircle className="h-5 w-5 text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span>Chat with Jyotish</span>
                    </div>
                    <p className="text-xs text-gray-300/80 mt-1">Instant answers in real-time.</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Verified Jyotish</p>
                  <p>• Secure chat & fast replies</p>
                </div>
                <Button
                  onClick={() => router.push(ROUTES.ASTROLOGERS)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white h-8"
                >
                  Start Chatting
                </Button>
              </CardContent>
            </Card>

            {/* Book Appointment */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-indigo-400/30 hover:shadow-[0_0_40px_rgba(99,102,241,0.12)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-indigo-500/10 via-purple-500/6 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
                    <CalendarDays className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <span>Book Appointment</span>
                    <p className="text-xs text-gray-400 mt-1">Full kundali review</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Detailed kundali analysis</p>
                  <p>• 1:1 consultation slots</p>
                </div>
                <Button
                  onClick={() => setIsAppointmentModalOpen(true)}
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/10 hover:border-indigo-400/30 h-8"
                >
                  Book Now
                </Button>
              </CardContent>
            </Card>

            {/* Book Pandit Ji */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-amber-400/30 hover:shadow-[0_0_38px_rgba(252,211,77,0.10)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-amber-500/10 via-purple-500/6 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30">
                    <ScrollText className="h-5 w-5 text-amber-300" />
                  </div>
                  <div>
                    <span>Book Pandit Ji</span>
                    <p className="text-xs text-gray-400 mt-1">Rituals, puja & ceremonies</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
              <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Puja & rituals booking</p>
                  <p>• Verified pandit network</p>
                </div>
                <Button
                  onClick={() => setIsPanditModalOpen(true)}
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/10 hover:border-amber-400/30 h-8"
                >
                  Book now
                </Button>
              </CardContent>
            </Card>

            {/* Book Vaastu Sastri */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-emerald-400/30 hover:shadow-[0_0_38px_rgba(16,185,129,0.10)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-emerald-500/10 via-indigo-500/6 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                    <BookOpen className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <span>Book Vaastu Sastri</span>
                    <p className="text-xs text-gray-400 mt-1">Home & office vaastu</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Vastu guidance</p>
                  <p>• Home & office remedies</p>
                </div>
                <Button
                  onClick={() => setIsVaastuModalOpen(true)}
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/10 hover:border-emerald-400/30 h-8"
                >
                  Book now
                </Button>
              </CardContent>
            </Card>

            {/* Katha Vachak */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-fuchsia-400/25 hover:shadow-[0_0_38px_rgba(217,70,239,0.10)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/6 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/30">
                    <HeartHandshake className="h-5 w-5 text-fuchsia-300" />
                  </div>
                  <div>
                    <span>Katha Vachak</span>
                    <p className="text-xs text-gray-400 mt-1">Events & programs</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• कथा वाचन booking</p>
                  <p>• Events & programs</p>
                </div>
                <Button
                  onClick={() => setIsKathaModalOpen(true)}
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/10 hover:border-fuchsia-400/30 h-8"
                >
                  Book now
                </Button>
              </CardContent>
            </Card>

            {/* Daily Horoscope */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-purple-400/30 hover:shadow-[0_0_38px_rgba(168,85,247,0.12)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-purple-500/10 via-indigo-500/6 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <Sun className="h-5 w-5 text-purple-300" />
                  </div>
                  <div>
                    <span>Daily Horoscope</span>
                    <p className="text-xs text-gray-400 mt-1">Today’s forecast</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Love • Career • Health</p>
                  <p>• Personalized by sign</p>
                </div>
                <Button
                  onClick={() => router.push(ROUTES.HOROSCOPE)}
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/10 hover:border-purple-500/30 h-8"
                >
                  View Horoscope
                </Button>
              </CardContent>
            </Card>

            {/* Daily Subha Shahit */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-slate-300/20 hover:shadow-[0_0_34px_rgba(148,163,184,0.10)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-slate-500/10 via-purple-500/5 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-500/20 border border-slate-500/30">
                    <Sparkles className="h-5 w-5 text-slate-200" />
                  </div>
                  <div>
                    <span>Daily Subha Shahit</span>
                    <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Daily शुभ सन्देश</p>
                  <p>• Positive guidance</p>
                </div>
                <Button
                  disabled
                  className="w-full bg-white/5 text-white/70 border border-white/10 h-8"
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Kundali Match */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-rose-400/25 hover:shadow-[0_0_38px_rgba(244,63,94,0.10)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-rose-500/10 via-purple-500/6 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30">
                    <GitCompareArrows className="h-5 w-5 text-rose-300" />
                  </div>
                  <div>
                    <span>Kundali match</span>
                    <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Compatibility insights</p>
                  <p>• Dosha & remedies</p>
                </div>
                <Button
                  disabled
                  className="w-full bg-white/5 text-white/70 border border-white/10 h-8"
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>

            {/* Travel Prediction */}
            <Card className="group relative overflow-hidden bg-black/45 backdrop-blur-md border-white/10 transition-all duration-300 motion-safe:hover:-translate-y-0.5 hover:border-cyan-400/25 hover:shadow-[0_0_38px_rgba(34,211,238,0.10)] aspect-[4/3] flex flex-col">
              <div className="pointer-events-none absolute inset-0 opacity-100 bg-gradient-to-br from-cyan-500/10 via-indigo-500/6 to-transparent" />
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-white flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                    <MapPin className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <span>Travel Prediction</span>
                    <p className="text-xs text-gray-400 mt-1">Coming soon</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-2 mt-auto flex flex-col gap-2 flex-1">
                <div className="text-sm text-gray-200/70 space-y-1 flex-1">
                  <p>• Auspicious dates</p>
                  <p>• Route & timing tips</p>
                </div>
                <Button
                  disabled
                  className="w-full bg-white/5 text-white/70 border border-white/10 h-8"
                >
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>

        {/* Appointment modal (same UX as top BookAppointmentButton) */}
        <BookAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          onSuccess={() => setIsAppointmentModalOpen(false)}
        />

        <BookJyotishServiceModal
          isOpen={isPanditModalOpen}
          onClose={() => setIsPanditModalOpen(false)}
          type={JyotishBookingType.PANDIT}
          title="Book Pandit Ji"
        />
        <BookJyotishServiceModal
          isOpen={isVaastuModalOpen}
          onClose={() => setIsVaastuModalOpen(false)}
          type={JyotishBookingType.VAASTU}
          title="Book Vaastu Sastri"
        />
        <BookJyotishServiceModal
          isOpen={isKathaModalOpen}
          onClose={() => setIsKathaModalOpen(false)}
          type={JyotishBookingType.KATHA_VACHAK}
          title="Book Katha Vachak"
        />
      </div>
    </DashboardLayout>
  );
}
