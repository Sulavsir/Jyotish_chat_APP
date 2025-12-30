'use client';
import { useEffect, useRef } from 'react';

export function TwinklingStars({ count = 50 }: { count?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shootingStarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const stars: HTMLElement[] = [];
    const colors = [
      'rgba(255, 255, 255, 1)', // White
      'rgba(168, 85, 247, 0.9)', // Purple
      'rgba(236, 72, 153, 0.9)', // Pink
      'rgba(147, 197, 253, 0.9)', // Light blue
    ];

    for (let i = 0; i < count; i++) {
      const star = document.createElement('div');
      star.className = 'star';
      star.style.setProperty('--duration', `${Math.random() * 4 + 2}s`);
      star.style.setProperty('--delay', `${Math.random() * 4}s`);
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;

      // Random size
      const size = Math.random() < 0.1 ? Math.random() * 3 + 2 : Math.random() * 2 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;

      // Random color - mostly white
      const color =
        Math.random() < 0.8 ? colors[0] : colors[Math.floor(Math.random() * colors.length)];
      star.style.setProperty('--star-color', color);

      containerRef.current.appendChild(star);
      stars.push(star);
    }

    return () => {
      stars.forEach((star) => star.remove());
    };
  }, [count]);

  // Shooting stars effect
  useEffect(() => {
    if (!shootingStarsRef.current) return;

    const createShootingStar = () => {
      const shootingStar = document.createElement('div');
      shootingStar.className = 'shooting-star';

      // Random starting position (top area)
      const startX = Math.random() * 100;
      const startY = Math.random() * 30; // Start from top 30% of screen

      shootingStar.style.left = `${startX}%`;
      shootingStar.style.top = `${startY}%`;

      // Random animation duration
      const duration = Math.random() * 2 + 1.5; // 1.5-3.5 seconds
      shootingStar.style.setProperty('--shoot-duration', `${duration}s`);

      shootingStarsRef.current?.appendChild(shootingStar);

      // Remove after animation
      setTimeout(() => {
        shootingStar.remove();
      }, duration * 1000);
    };

    // Create shooting stars at random intervals
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        // 50% chance
        createShootingStar();
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 3px var(--star-color);
          }
          50% {
            box-shadow: 0 0 6px var(--star-color);
          }
        }

        @keyframes shoot {
          0% {
            transform: translate(0, 0) rotate(-45deg);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translate(300px, 300px) rotate(-45deg);
            opacity: 0;
          }
        }

        :global(.star) {
          position: absolute;
          background: var(--star-color);
          border-radius: 50%;
          animation:
            twinkle var(--duration) infinite,
            pulse-glow var(--duration) infinite;
          animation-delay: var(--delay);
          pointer-events: none;
        }

        :global(.shooting-star) {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          box-shadow:
            0 0 4px 2px rgba(255, 255, 255, 0.8),
            0 0 8px 4px rgba(168, 85, 247, 0.5);
          pointer-events: none;
          animation: shoot var(--shoot-duration) ease-out forwards;
        }

        :global(.shooting-star)::before {
          content: '';
          position: absolute;
          top: 0;
          right: 2px;
          width: 80px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.8) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          transform: translateX(0);
          border-radius: 50%;
          filter: blur(1px);
        }
      `}</style>
      <div ref={containerRef} className="absolute inset-0 pointer-events-none z-10" />
      <div ref={shootingStarsRef} className="absolute inset-0 pointer-events-none z-10" />
    </>
  );
}
