/**
 * DropdownMenu Component
 * Global dropdown that works everywhere with proper positioning
 */

'use client';

import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  disabled?: boolean;
}

export function DropdownMenu({
  trigger,
  children,
  align = 'left',
  className = '',
  disabled = false,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();

        let left = rect.left;

        // Adjust based on alignment
        if (align === 'right') {
          left = rect.right;
        } else if (align === 'center') {
          left = rect.left + rect.width / 2;
        }

        setPosition({
          top: rect.bottom + 8,
          left,
        });
      }
    };

    updatePosition();

    if (isOpen) {
      // Listen to ALL scroll events (including scrollable containers)
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      // Update position on animation frames for smooth tracking
      let rafId: number | undefined;
      let isTracking = true;
      
      const trackPosition = () => {
        if (isTracking) {
          updatePosition();
          rafId = requestAnimationFrame(trackPosition);
        }
      };
      rafId = requestAnimationFrame(trackPosition);

      return () => {
        isTracking = false;
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
        if (rafId !== undefined) {
          cancelAnimationFrame(rafId);
        }
      };
    }

    return () => {};
  }, [isOpen, align]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const alignmentTransform = {
    left: '',
    right: '-translate-x-full',
    center: '-translate-x-1/2',
  };

  return (
    <>
      <div ref={triggerRef} onClick={handleTriggerClick} className="inline-block">
        {trigger}
      </div>
      {isOpen &&
        typeof window !== 'undefined' &&
        createPortal(
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            {/* Dropdown */}
            <div
              ref={dropdownRef}
              className={`fixed z-[9999] ${alignmentTransform[align]} ${className}`}
              style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
              }}
              onClick={() => setIsOpen(false)}
            >
              {children}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

// Dropdown item component for consistency
interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'danger';
  icon?: ReactNode;
  disabled?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  className = '',
  variant = 'default',
  icon,
  disabled = false,
}: DropdownItemProps) {
  const variantClasses = {
    default: 'text-white hover:bg-white/10',
    danger: 'text-red-400 hover:bg-red-500/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-4 py-3 text-left transition-colors flex items-center gap-3 ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

