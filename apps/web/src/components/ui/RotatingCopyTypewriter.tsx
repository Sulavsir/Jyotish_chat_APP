'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants';
import dashboardRotatingCopyService from '@/services/dashboardRotatingCopy.service';
import type { DashboardRotatingCopy } from '@/types';

type CopyItem = {
  title: string;
  subtitle: string;
};

type Phase = 'title' | 'subtitle' | 'pause';

type Props = {
  titleAs?: React.ElementType;
  subtitleAs?: React.ElementType;
  titleClassName?: string;
  subtitleClassName?: string;
  titleSkeletonClassName?: string;
  subtitleSkeletonClassName?: string;
  pauseMs?: number;
  titleSpeedMs?: number;
  subtitleSpeedMs?: number;
};

function InlineSkeleton({ className }: { className: string }) {
 
  return (
    <span
      aria-hidden="true"
      className={`inline-block rounded-md bg-white/10 animate-pulse ${className}`}
    />
  );
}

const FALLBACK_COPY: CopyItem[] = [
  {
    title: 'तपाईंलाई ज्योतिषसम्बन्धी केही चाहिएको हो?',
    subtitle: 'Verified Jyotish सँग chat, appointment, र दैनिक राशिफल—सबै एउटै ठाउँमा।',
  },
  {
    title: 'आजको दिन कस्तो रहनेछ?',
    subtitle: 'दैनिक राशिफल हेर्नुहोस् र आफ्नो दिनलाई राम्रोसँग योजना बनाउनुहोस्।',
  },
  {
    title: 'कुन्डली र मिलान चाहिएको छ?',
    subtitle: 'जन्म विवरण पूरा गरेपछि तपाईंलाई अझै accurate kundali insights पाइन्छ।',
  },
];

export function RotatingCopyTypewriter({
  titleAs: TitleTag = 'h2',
  subtitleAs: SubtitleTag = 'p',
  titleClassName,
  subtitleClassName,
  titleSkeletonClassName = 'h-8 w-[min(28rem,90%)] bg-white/10',
  subtitleSkeletonClassName = 'h-4 w-[min(34rem,95%)] bg-white/10',
  pauseMs = 3500,
  titleSpeedMs = 52,
  subtitleSpeedMs = 34,
}: Props) {
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.DASHBOARD.ROTATING_COPY,
    queryFn: dashboardRotatingCopyService.listPublic,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rotatingCopy = useMemo<CopyItem[]>(() => {
    const items: CopyItem[] = (Array.isArray(data) ? (data as DashboardRotatingCopy[]) : []).map(
      (i) => ({
        title: i.title,
        subtitle: i.subtitle,
      })
    );
    return items.length > 0 ? items : FALLBACK_COPY;
  }, [data]);

  const [copyIndex, setCopyIndex] = useState(0);
  const [typedTitle, setTypedTitle] = useState('');
  const [typedSubtitle, setTypedSubtitle] = useState('');
  const [phase, setPhase] = useState<Phase>('title');
  const [charIndex, setCharIndex] = useState(0);

  // Keep index valid when data changes
  useEffect(() => {
    if (copyIndex < rotatingCopy.length) return;
    setCopyIndex(0);
    setTypedTitle('');
    setTypedSubtitle('');
    setPhase('title');
    setCharIndex(0);
  }, [copyIndex, rotatingCopy.length]);

  useEffect(() => {
    const current = rotatingCopy[copyIndex];
    if (!current) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    if (phase === 'pause') {
      timer = setTimeout(() => {
        const next = (copyIndex + 1) % rotatingCopy.length;
        setCopyIndex(next);
        setTypedTitle('');
        setTypedSubtitle('');
        setPhase('title');
        setCharIndex(0);
      }, pauseMs);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    const speed = phase === 'title' ? titleSpeedMs : subtitleSpeedMs;
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
  }, [rotatingCopy, copyIndex, phase, charIndex, pauseMs, titleSpeedMs, subtitleSpeedMs]);

  return (
    <>
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
      `}</style>

      <TitleTag className={titleClassName}>
        {isLoading ? (
          <InlineSkeleton className={titleSkeletonClassName} />
        ) : (
          <>
            {typedTitle}
            {phase === 'title' && typedTitle.length > 0 && (
              <span className="type-cursor ml-1 text-white/80">|</span>
            )}
          </>
        )}
      </TitleTag>

      <SubtitleTag className={subtitleClassName}>
        {isLoading ? (
          <InlineSkeleton className={subtitleSkeletonClassName} />
        ) : (
          <>
            {typedSubtitle}
            {phase === 'subtitle' && typedSubtitle.length > 0 && (
              <span className="type-cursor ml-1 text-gray-300/70">|</span>
            )}
          </>
        )}
      </SubtitleTag>
    </>
  );
}

