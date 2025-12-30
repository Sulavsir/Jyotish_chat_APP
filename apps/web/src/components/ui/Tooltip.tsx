/**
 * Tooltip Component
 * Global tooltip that works everywhere using Portal
 */

'use client';

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  disabled = false,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (isVisible && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        let top = 0;
        let left = 0;

        switch (position) {
          case 'top':
            top = rect.top + scrollY - 8;
            left = rect.left + scrollX + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + scrollY + 8;
            left = rect.left + scrollX + rect.width / 2;
            break;
          case 'left':
            top = rect.top + scrollY + rect.height / 2;
            left = rect.left + scrollX - 8;
            break;
          case 'right':
            top = rect.top + scrollY + rect.height / 2;
            left = rect.right + scrollX + 8;
            break;
        }

        setTooltipPos({ top, left });
      }
    };

    updatePosition();

    if (isVisible) {
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible, position]);

  if (disabled) {
    return <>{children}</>;
  }

  const transformClasses = {
    top: '-translate-x-1/2 -translate-y-full',
    bottom: '-translate-x-1/2',
    left: '-translate-x-full -translate-y-1/2',
    right: '-translate-y-1/2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-l-gray-900',
    right:
      'right-full top-1/2 -translate-y-1/2 -mr-1 border-4 border-transparent border-r-gray-900',
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      {isVisible &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            className={`fixed px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-[9999] ${transformClasses[position]}`}
            style={{
              top: `${tooltipPos.top}px`,
              left: `${tooltipPos.left}px`,
            }}
            role="tooltip"
          >
            {content}
            <div className={`absolute ${arrowClasses[position]}`}></div>
          </div>,
          document.body
        )}
    </>
  );
}

